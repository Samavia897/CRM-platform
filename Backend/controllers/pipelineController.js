const { Pipeline, Investor } = require("../models/index");

exports.createPipeline = async (req, res) => {
  try {
    const { name, stages } = req.body;

    let cleanStages = "New,Initial Meeting,Due Diligence,Commitment,Closed";
    if (stages && stages.trim() !== "") {
      cleanStages = stages.split(",").map(s => s.trim()).filter(Boolean).join(",");
    }

    const newPipeline = await Pipeline.create({
      name,
      stages: cleanStages,
      companyId: req.user.companyId
    });

    res.status(201).json(newPipeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.moveInvestor = async (req, res) => {
  try {
    const { investorId, pipelineId, newStage } = req.body;

    const investor = await Investor.findByPk(investorId);
    if (!investor) return res.status(404).json({ error: "Investor not found" });

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

exports.getPipelines = async (req, res) => {
  try {
    const pipelines = await Pipeline.findAll({ where: { companyId: req.user.companyId } });
    res.json(pipelines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};