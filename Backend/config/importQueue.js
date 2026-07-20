const { Fund, FailedJobLog } = require("../models");

// BullMQ Queue Processor
const processFundImport = async (job) => {
  const { rows, companyId } = job.data;
  
  const validRows = [];
  const failedRowsList = [];

  // 1. DUPICATE CHECK IN BULK (O(1) Memory Set Optimization)
  // Saare incoming names nikalen aur ek hi single DB query chalayein
  const incomingNames = rows.map(r => r.name?.trim()).filter(Boolean);
  const existingFunds = await Fund.findAll({
    where: { 
      name: incomingNames,
      companyId: companyId 
    },
    attributes: ['name']
  });
  const existingNamesSet = new Set(existingFunds.map(f => f.name.toLowerCase()));

  // 2. IN-MEMORY VALIDATION (Pure CPU work - Super Fast)
  rows.forEach((row, index) => {
    const rowNum = index + 1;
    const errors = [];

    // Validation A: Required Fields
    if (!row.name) errors.push("Fund Name is required.");
    if (!row.type) errors.push("Fund Type is required.");

    // Validation B: Duplicate Check
    if (row.name && existingNamesSet.has(row.name.toLowerCase())) {
      errors.push(`Fund name "${row.name}" already exists in system.`);
    }

    // Validation C: Industry Array check (Safe string handling)
    if (row.industry && typeof row.industry === 'string') {
      try {
        row.industry = JSON.parse(row.industry);
      } catch(e) {
        row.industry = row.industry.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // Output Separation
    if (errors.length > 0) {
      failedRowsList.push({
        ...row,
        row_number: rowNum,
        import_error_reason: errors.join(" | ")
      });
    } else {
      validRows.push({
        name: row.name,
        type: row.type || 'Venture',
        location: row.location || '',
        website: row.website || null,
        industry: row.industry || [],
        companyId: companyId
      });
    }
  });

  // 3. BULK INSERT VALID ROWS (Only 1 Single DB Call - Maximum Speed)
  if (validRows.length > 0) {
    await Fund.bulkCreate(validRows, { validating: false });
  }

  // 4. SAVE FAILED LOGS USING STRUCTURAL STRATEGY
  // Agar koi row fail hui hai, toh hum uska object text format mein direct save karenge
  if (failedRowsList.length > 0) {
    await FailedJobLog.create({
      jobId: String(job.id).trim(), // Match with router params string conversion safely
      companyId: companyId,
      failedRecords: failedRowsList // Sequelize will handle stringification automatically if JSON type
    });
  }

  // Summary object for polling tracking
  return {
    total: rows.length,
    imported: validRows.length,
    failed: failedRowsList.length,
    jobId: job.id
  };
};