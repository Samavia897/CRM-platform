const { Fund, Investor } = require("../models/index");
const fs = require('fs');
const csv = require('csv-parser');
const { Op } = require("sequelize"); // Search functionality ke liye zaroori hai

// 1. GET ALL FUNDS (With Search & Filters for UI Tabs)
exports.getAllFunds = async (req, res) => {
  try {
    const { search, type, category } = req.query;
    
    // Check if user/company info exists
    if (!req.user || !req.user.companyId) {
      return res.status(400).json({ error: "User company information missing" });
    }

    let whereClause = { companyId: req.user.companyId };

    // UI Search Bar Logic
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` }; // Case-insensitive search
    }

    // UI Dropdown "All Types" Logic
    if (type && type !== 'All Types') {
      whereClause.type = type;
    }

    // UI Tabs Logic (e.g., AI based funds)
    if (category === 'AI based funds') {
      // Assuming industry is an array or string
      whereClause.industry = { [Op.overlap]: ['AI', 'Artificial Intelligence'] };
    } else if (category === 'GeoPref') {
      // Add logic for GeoPref tab if needed
    }

    const funds = await Fund.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    console.log(`Fetched ${funds.length} funds for company: ${req.user.companyId}`);
    res.status(200).json(funds);
  } catch (error) {
    console.error("FETCH ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 2. CREATE FUND (Fixed 'stage' bug and naming)
exports.createFund = async (req, res) => {
  try {
    const { fundName, type, location, website, industry, stage } = req.body;

    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ error: "Unauthorized: Company ID missing." });
    }

    if (!fundName) {
      return res.status(400).json({ error: "Fund name is required" });
    }

    const newFund = await Fund.create({
      name: fundName, // Mapping frontend 'fundName' to backend 'name'
      type: type || "Venture",
      location,
      website,
      industry: industry || [],
      stage: stage || [], // Fixed: Now it won't throw undefined error
      companyId: req.user.companyId
    });

    res.status(201).json(newFund);
  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// 3. UPDATE FUND
exports.updateFund = async (req, res) => {
  try {
    const fund = await Fund.findOne({ 
      where: { id: req.params.id, companyId: req.user.companyId } 
    });

    if (!fund) return res.status(404).json({ error: "Fund not found" });

    // Update with new data
    await fund.update(req.body);
    res.status(200).json(fund);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. DELETE FUND
exports.deleteFund = async (req, res) => {
  try {
    const fund = await Fund.findOne({ 
      where: { id: req.params.id, companyId: req.user.companyId } 
    });

    if (!fund) {
      return res.status(404).json({ error: "Fund not found" });
    }

    await fund.destroy();
    res.status(200).json({ message: "Fund deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. IMPORT FUNDS (CSV)
exports.importFunds = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const results = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      results.push({
        name: data.name || data.fundName, // Support both headers
        type: data.type || 'Venture',
        location: data.location,
        website: data.website,
        industry: data.industry ? data.industry.split(',').map(s => s.trim()) : [],
        companyId: req.user.companyId
      });
    })
    .on('end', async () => {
      try {
        if (results.length > 0) {
          await Fund.bulkCreate(results);
        }
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(200).json({ message: "Import successful", count: results.length });
      } catch (error) {
        console.error("IMPORT ERROR:", error);
        res.status(500).json({ error: "Database error during import" });
      }
    });
};