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

exports.importFunds = async (req, res) => {
  // Check if file buffer exists in memory
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: "No file uploaded or file buffer is empty" });
  }

  const results = [];

  // 🌟 FIXED: Reading directly from live memory buffer instead of disk path
  const stream = Readable.from(req.file.buffer.toString());

  stream
    .pipe(csv())
    .on('data', (data) => {
      let rawUrl = data.website || data.Website || '';
      rawUrl = rawUrl.trim();
      if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = `https://${rawUrl}`;
      }

      const fundName = data.name || data.Name || data.fundName || data.FundName;
      
      if (fundName) {
results.push({
  name: fundName.trim(),
  type: data.type || data.Type || 'Venture',
  location: data.location || data.Location || '',
  website: rawUrl || null,
  industry: data.industry || data.Industry 
    ? JSON.stringify((data.industry || data.Industry).split(',').map(s => s.trim()).filter(Boolean)) 
    : JSON.stringify([]),
  companyId: req.user.companyId
});
      }
    })
    .on('end', async () => {
      try {
        if (results.length > 0) {
          await Fund.bulkCreate(results, { validate: false });
        }
        res.status(200).json({ message: "Import successful", count: results.length });
      } catch (error) {
        console.error("IMPORT ERROR:", error);
        res.status(500).json({ error: "Database error during memory stream bulk insert" });
      }
    });
};