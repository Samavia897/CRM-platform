const { fundImportQueue } = require('../config/importQueue')
const { Fund, Investor } = require("../models"); 
const FailedJobLog = require("../models/failedJobLogModel");
const fs = require('fs');
const csv = require('csv-parser');
const { Op } = require("sequelize");
const { Readable } = require('stream');
const { sequelize } = require("../models");

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
    const { name, fundName, type, location, website, industry, stage } = req.body;
    const finalName = name || fundName;

    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ error: "Unauthorized: Company ID missing." });
    }

    if (!finalName) {
      return res.status(400).json({ error: "Fund name is required" });
    }

    let formattedWebsite = website ? website.trim() : null;
    if (formattedWebsite && !formattedWebsite.startsWith("http://") && !formattedWebsite.startsWith("https://")) {
      formattedWebsite = `https://${formattedWebsite}`;
    }

    const newFund = await Fund.create({
      name: finalName.trim(),
      type: type || "Venture",
      location: location || "",
      website: formattedWebsite || null,
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
    const targetJobId = String(jobId).trim();
    const companyId = req.user.companyId;

    // 🌟 PROFESSIONAL RAW SQL FIX: Cast column dynamically to text to safely match UUIDs or Integers
    const [logEntries] = await sequelize.query(
      `SELECT * FROM "FailedJobLogs" 
       WHERE CAST("jobId" AS TEXT) = :targetJobId 
       AND "companyId" = :companyId 
       LIMIT 1`,
      {
        replacements: { targetJobId, companyId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const logEntry = Array.isArray(logEntries) ? logEntries[0] : logEntries;

    if (!logEntry) {
      return res.status(404).json({ error: "No validation errors found for this import batch." });
    }

    let records = logEntry.failedRecords;
    if (typeof records === 'string') {
      try { records = JSON.parse(records); } catch (e) {}
    }

    if (!records || !Array.isArray(records)) {
      records = records.rows || records.records || [records];
    }

    const headers = ["row_number", "name", "type", "location", "website", "industry", "import_error_reason"];
    const csvRows = [headers.join(",")];

    for (const row of records) {
      if (!row) continue;
      
      const lineValues = headers.map(key => {
        let val = row[key];
        if (Array.isArray(val)) val = val.join("; ");
        if (val && typeof val === 'object') val = JSON.stringify(val);
        
        const cleanVal = val !== undefined && val !== null ? String(val) : '';
        return `"${cleanVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(lineValues.join(","));
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=error_report_job_${targetJobId}.csv`);
    return res.status(200).send(csvRows.join("\n"));

  } catch (error) {
    console.error("EXECUTIVE CSV GENERATION ERROR:", error);
    return res.status(500).json({ error: "Failed to stream CSV error logs.", details: error.message });
  }
};