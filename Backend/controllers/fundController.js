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
    
    // Scoping to req.user.companyId for enterprise data security
    const logEntry = await FailedJobLog.findOne({
      where: { jobId, companyId: req.user.companyId }
    });

    if (!logEntry) {
      return res.status(404).json({ error: "No error logs found for this job asset." });
    }

    // 🌟 SAFE EXTRACTION: Database se raw data plain array ki tarah nikalna
    let records = logEntry.failedRecords;
    if (typeof records === 'string') {
      try {
        records = JSON.parse(records);
      } catch (e) {
        console.error("Failed to parse failedRecords JSON string");
      }
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "No physical records attached to failure." });
    }

    // Sequelize model instances ko plain object mein convert karna agar zaroorat ho
    const plainRecords = records.map(r => (typeof r.get === 'function' ? r.get({ plain: true }) : r));

    // 🌟 SAFE HEADERS GENERATION: Pehli row ke saare keys nikalna
    const firstRecord = plainRecords[0];
    const headers = Object.keys(firstRecord).join(",");
    
    // Rows parsing with proper escape characters
    const csvRows = plainRecords.map(row => 
      Object.keys(firstRecord).map(key => {
        const val = row[key] !== undefined && row[key] !== null ? row[key] : '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",")
    );
    
    const csvContent = [headers, ...csvRows].join("\n");

    // Setting file descriptors and buffers for instant client download streaming
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=failed_import_report_${jobId}.csv`);
    
    return res.status(200).send(csvContent);

  } catch (error) {
    console.error("Report generation failed:", error);
    return res.status(500).json({ error: "Failed to compile background job report.", details: error.message });
  }
};