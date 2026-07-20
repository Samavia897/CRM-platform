const { Fund, Investor } = require("../models/index");
const fs = require('fs');
const csv = require('csv-parser');
const { Op } = require("sequelize");
const { Readable } = require('stream');
const { fundImportQueue } = require('../config/importQueue');
const { FailedJobLog } = require("../models");

exports.getAllFunds = async (req, res) => {
  try {
    const { search, type, category } = req.query;

    if (!req.user || !req.user.companyId) {
      return res.status(400).json({ error: "User company information missing" });
    }

    let whereClause = { companyId: req.user.companyId };

    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    if (type && type !== 'All Types') {
      whereClause.type = type;
    }

    if (category === 'AI based funds') {
      whereClause.industry = { [Op.overlap]: ['AI', 'Artificial Intelligence'] };
    }

    const funds = await Fund.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(funds);
  } catch (error) {
    console.error("FETCH ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.createFund = async (req, res) => {
  try {
    // 🌟 Support both 'name' (frontend default) and 'fundName' to avoid any crash
    const { name, fundName, type, location, website, industry, stage } = req.body;
    const finalName = name || fundName;

    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ error: "Unauthorized: Company ID missing." });
    }

    if (!finalName) {
      return res.status(400).json({ error: "Fund name is required" });
    }

    // URL safe format logic
    let formattedWebsite = website ? website.trim() : null;
    if (formattedWebsite && !formattedWebsite.startsWith("http://") && !formattedWebsite.startsWith("https://")) {
      formattedWebsite = `https://${formattedWebsite}`;
    }

    const newFund = await Fund.create({
      name: finalName.trim(),
      type: type || "Venture",
      location: location || "",
      website: formattedWebsite || null, // validation clear handles
      industry: industry || [],
      stage: stage || [],
      companyId: req.user.companyId
    });

    res.status(201).json(newFund);
  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateFund = async (req, res) => {
  try {
    const fund = await Fund.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });

    if (!fund) return res.status(404).json({ error: "Fund not found" });

    // Handle URL formatting on updates too
    if (req.body.website) {
      let ws = req.body.website.trim();
      if (ws && !ws.startsWith("http://") && !ws.startsWith("https://")) {
        req.body.website = `https://${ws}`;
      }
    } else if (req.body.website === "") {
      req.body.website = null;
    }

    await fund.update(req.body);
    res.status(200).json(fund);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFund = async (req, res) => {
  try {
    const fund = await Fund.findOne({
      where: { id: req.params.id, companyId: req.user.companyId }
    });

    if (!fund) return res.status(404).json({ error: "Fund not found" });

    await fund.destroy();
    res.status(200).json({ message: "Fund deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.importFunds = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const stream = Readable.from(req.file.buffer);

    stream
      .pipe(csv())
      .on('data', (data) => {
        const fundName = data.name || data.Name || data.fundName || data.FundName;
        let rawUrl = data.website || data.Website || '';

        if (fundName) {
          if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
            rawUrl = `https://${rawUrl.trim()}`;
          } else if (rawUrl) {
            rawUrl = rawUrl.trim();
          }

          const industryArray = data.industry || data.Industry
            ? (data.industry || data.Industry).split(',').map(s => s.trim()).filter(Boolean)
            : [];

          results.push({
            name: fundName.trim(),
            type: data.type || data.Type || 'Venture',
            location: data.location || data.Location || '',
            website: rawUrl || null,
            industry: industryArray, 
            companyId: req.user.companyId
          });
        }
      })
      .on('end', async () => {
        try {
          if (results.length === 0) {
            return res.status(400).json({ message: 'CSV execution complete but 0 matching records resolved.' });
          }

          // Queue mein job add kar rahe hain aur job instance le rahe hain
          const job = await fundImportQueue.add(
            `bulk_import_${req.user.companyId}_${Date.now()}`, 
            {
              rows: results,
              companyId: req.user.companyId
            }, 
            {
              removeOnComplete: true, 
              attempts: 3,            
              backoff: 5000           
            }
          );

          // 🌟 UPDATED: Ab jobId frontend ko lazmi milegi track karne ke liye
          return res.status(202).json({ 
            message: 'CSV uploaded and queued for background ingestion processing.', 
            jobId: job.id, 
            estimatedRecords: results.length 
          });

        } catch (queueError) {
          console.error('=== BULLMQ ENQUEUE ERROR ===', queueError);
          return res.status(500).json({ message: 'Failed to delegate process to message brokers', error: queueError.message });
        }
      });

  } catch (error) {
    console.error('=== SYSTEM IMPORT ERROR ===', error);
    return res.status(500).json({ message: 'Internal server error during import', error: error.message });
  }
};

exports.getFailedJobReport = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const logEntry = await FailedJobLog.findOne({
      where: { jobId, companyId: req.user.companyId }
    });

    if (!logEntry) {
      return res.status(404).json({ error: "No error logs found for this job asset." });
    }

    // Har qism ke format se data nikalne ki koshish karein
    let records = logEntry.failedRecords;
    
    if (typeof records === 'string') {
      try { records = JSON.parse(records); } catch(e) {}
    }
    if (records && typeof records === 'object' && !Array.isArray(records)) {
      records = records.rows || records.records || [records];
    }

    // AGAR DATA PHIR BHI KHALI HAI YA PARSE NAHI HUA
    if (!records || !Array.isArray(records) || records.length === 0) {
      // Crash karne ke bajaye generic clean file return karein
      const fallbackContent = "name,type,location,website,industry,import_error_reason\n\"Unknown Failed Row\",\"Venture\",\"\",\"\",\"\",\"\${logEntry.errorMessage || 'Validation failure'}\"";
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=failed_import_report_\${jobId}.csv`);
      return res.status(200).send(fallbackContent);
    }

    const headers = ["name", "type", "location", "website", "industry", "import_error_reason"];
    const csvRows = [headers.join(",")];

    for (let item of records) {
      if (!item) continue;
      const row = item.dataValues || item;
      
      const rowValues = headers.map(key => {
        let val = row[key];
        if (val === undefined || val === null) return '""';
        if (typeof val === 'object') val = JSON.stringify(val);
        return `"\${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(rowValues.join(","));
    }
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=failed_import_report_\${jobId}.csv`);
    return res.status(200).send(csvRows.join("\n"));

  } catch (error) {
    // KUCH BHI CRASH HO, USER KO FILE DE DO!
    console.error("REPORT GENERATION CAPTURE:", error);
    const extremeFallback = "error\n\"Failed to parse structure but records were skipped. Check your CSV fields syntax.\"";
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=failed_import_report_error.csv`);
    return res.status(200).send(extremeFallback);
  }
};