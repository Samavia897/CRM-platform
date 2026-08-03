const { Pipeline, Investor } = require("../models/index");

exports.createPipeline = async (req, res) => {
  try {
    const { name, stages } = req.body;
    const companyId = req.user.companyId; 

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Pipeline name is required." });
    }

    const existingPipeline = await Pipeline.findOne({
      where: {
        name: name.trim(),
        companyId: companyId
      }
    });

    if (existingPipeline) {
      return res.status(400).json({ error: "A pipeline with this name already exists." });
    }

    let cleanStages = "New,Initial Meeting,Due Diligence,Commitment,Closed";
    if (stages && stages.trim() !== "") {
      cleanStages = stages.split(",").map(s => s.trim()).filter(Boolean).join(",");
    }

    const newPipeline = await Pipeline.create({
      name: name.trim(),
      stages: cleanStages,
      companyId: companyId
    });

    res.status(201).json(newPipeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.moveInvestor = async (req, res) => {
  try {
    const { investorId, pipelineId, newStage } = req.body;

    if (!investorId) {
      return res.status(400).json({ error: "Investor ID is required for moving steps." });
    }

    const investor = await Investor.findByPk(investorId);
    if (!investor) return res.status(404).json({ error: "Investor not found" });

    if (pipelineId) {
      investor.pipelineId = String(pipelineId).trim(); 
    }

    if (newStage) {
      investor.status = String(newStage).trim();
    }

    await investor.save();

    res.json({ message: "Investor moved successfully", investor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPipelines = async (req, res) => {
  try {
    const pipelines = await Pipeline.findAll({ where: { companyId: req.user.companyId } });
    res.json(pipelines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};