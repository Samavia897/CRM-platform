const { Pipeline, Investor } = require("../models/index");

// 1. New Pipeline Create karna (Dynamic Comma Clean Up ke sath)
exports.createPipeline = async (req, res) => {
  try {
    const { name, stages } = req.body;
    
    // Agar frontend se string aati hai "Prospect, Initial Pitch, Won"
    // toh hum use clean karke "Prospect,Initial Pitch,Won" bana kar save karenge
    let cleanStages = "New,Initial Meeting,Due Diligence,Commitment,Closed";
    if (stages && stages.trim() !== "") {
      cleanStages = stages.split(",").map(s => s.trim()).filter(Boolean).join(",");
    }

    const newPipeline = await Pipeline.create({
      name,
      stages: cleanStages,
      companyId: req.user.companyId // Safely mapping client UUID token data
    });
    
    res.status(201).json(newPipeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Investor ko Pipeline Stage mein move karna (Drag & Drop Dedicated Handler)
exports.moveInvestor = async (req, res) => {
  try {
    const { investorId, pipelineId, newStage } = req.body;
    
    const investor = await Investor.findByPk(investorId);
    if (!investor) return res.status(404).json({ error: "Investor not found" });

    // Alignment of foreign keys and strings
    if (pipelineId) {
      investor.pipelineId = parseInt(pipelineId, 10);
    }
    
    if (newStage) {
      investor.status = newStage; 
    }
    
    await investor.save();

    res.json({ message: "Investor moved successfully", investor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get all pipelines for dropdown list
exports.getPipelines = async (req, res) => {
  try {
    const pipelines = await Pipeline.findAll({ where: { companyId: req.user.companyId } });
    res.json(pipelines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};