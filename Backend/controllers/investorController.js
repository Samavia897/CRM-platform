const { Investor, Fund, Task } = require("../models/index");

exports.getInvestors = async (req, res) => {
  try {
    const investors = await Investor.findAll({
      where: {
        companyId: req.user.companyId
      },
      include: [
        {
          model: Fund,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Task,
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(investors);
  } catch (error) {
    console.error("GET INVESTORS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.createInvestor = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      fundId,
      status,
      pipelineId,
      officePhone,
      mobilePhone,
      jobTitle
    } = req.body;

    if (!fundId) return res.status(400).json({ error: "Please select a valid Fund." });
    if (!pipelineId) return res.status(400).json({ error: "Please select a Pipeline Board." });
    if (!status) return res.status(400).json({ error: "Please select a valid Pipeline Stage." });

    const companyId = req.user.companyId;

    const newInvestor = await Investor.create({
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : null,
      email: email.trim(),
      officePhone: officePhone || null,
      mobilePhone: mobilePhone || null,
      jobTitle: jobTitle || null,
      fundId: fundId,
      companyId: companyId,
      pipelineId: pipelineId, 
      status: String(status).trim()
    });

    res.status(201).json(newInvestor);
  } catch (error) {
    console.error("CREATE INVESTOR ERROR:", error);

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const detailedErrors = error.errors.map(err => `${err.path}: ${err.message}`).join(", ");
      return res.status(400).json({ error: `Database Validation Failed: ${detailedErrors}` });
    }

    res.status(500).json({ error: error.message });
  }
};

exports.updateInvestor = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, officePhone, mobilePhone, jobTitle, fundId, status, pipelineId } = req.body;

    const investor = await Investor.findOne({
      where: { id, companyId: req.user.companyId }
    });

    if (!investor) return res.status(404).json({ error: "Investor not found" });

    investor.firstName = firstName || investor.firstName;
    investor.lastName = lastName !== undefined ? lastName : investor.lastName;
    investor.email = email || investor.email;
    investor.officePhone = officePhone !== undefined ? officePhone : investor.officePhone;
    investor.mobilePhone = mobilePhone !== undefined ? mobilePhone : investor.mobilePhone;
    investor.jobTitle = jobTitle !== undefined ? jobTitle : investor.jobTitle;
    investor.fundId = fundId || investor.fundId;
    investor.status = status || investor.status;

    if (pipelineId !== undefined) {
      investor.pipelineId = pipelineId ? String(pipelineId) : null;
    }

    await investor.save();

    const updatedInvestor = await Investor.findByPk(investor.id, {
      include: [{ model: Fund, attributes: ['id', 'name'] }]
    });

    res.json(updatedInvestor);
  } catch (error) {
    console.error("UPDATE INVESTOR ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateInvestorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pipelineId } = req.body;

    const investor = await Investor.findOne({
      where: { id, companyId: req.user.companyId }
    });

    if (!investor) return res.status(404).json({ error: "Investor not found" });

    if (status) investor.status = String(status).trim();
    if (pipelineId) investor.pipelineId = String(pipelineId);

    await investor.save();
    res.json({ message: "Investor updated successfully", investor });
  } catch (error) {
    console.error("STATUS UPDATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteInvestor = async (req, res) => {
  try {
    const { id } = req.params;

    if (Task) {
      await Task.destroy({ where: { investorId: id } });
    }

    const deleted = await Investor.destroy({
      where: { id, companyId: req.user.companyId }
    });

    if (!deleted) return res.status(404).json({ error: "Investor not found" });

    res.json({ message: "Investor and linked tasks deleted successfully" });
  } catch (error) {
    console.error("DELETE INVESTOR ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};