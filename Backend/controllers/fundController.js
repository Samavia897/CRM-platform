const { Fund, Investor } = require("../models/index");
const fs = require('fs');
const csv = require('csv-parser');
const { Op } = require("sequelize");
const { Readable } = require('stream');

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

    // Handled category tracking on server side gracefully
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

// controllers/fundController.js ke andar pooray importFunds function ko is se replace karein:

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
          // 1. Website link ko format karna taake Postgres validate kar sakay
          if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
            rawUrl = `https://${rawUrl.trim()}`;
          } else if (rawUrl) {
            rawUrl = rawUrl.trim();
          }

          // 2. Industry Array ko process karna
          const industryArray = data.industry || data.Industry
            ? (data.industry || data.Industry).split(',').map(s => s.trim()).filter(Boolean)
            : [];

          results.push({
            name: fundName.trim(),
            type: data.type || data.Type || 'Venture',
            location: data.location || data.Location || '',
            website: rawUrl || null,
            // PostgreSQL JSON field ke liye safely stringify karein
            industry: JSON.stringify(industryArray),
            companyId: req.user.companyId
          });
        }
      })
      .on('end', async () => {
        try {
          if (results.length > 0) {
            // Bulk insert execute karein
            await Fund.bulkCreate(results);
          }
          return res.status(200).json({ message: 'Funds imported successfully', count: results.length });
        } catch (dbError) {
          // Agar database validation fail ho to backend log mein poora error print ho
          console.error('=== DATABASE IMPORT ERROR ===', dbError);
          return res.status(500).json({ 
            message: 'Database save failed', 
            error: dbError.message,
            details: dbError.errors ? dbError.errors.map(e => e.message) : dbError
          });
        }
      });

  } catch (error) {
    console.error('=== SYSTEM IMPORT ERROR ===', error);
    return res.status(500).json({ message: 'Internal server error during import', error: error.message });
  }
};