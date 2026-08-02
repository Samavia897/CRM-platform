const { Queue, Worker } = require("bullmq");
const IORedis = require("ioredis");
const { Fund, FailedJobLog } = require("../models");

// 1. Redis Connection Setup (Render Environment Variable auto-fallback)
const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

// 2. Initialize the BullMQ Queue instance
const fundImportQueue = new Queue("fundImportQueue", {
  connection: redisConnection
});

// 3. Your In-Memory Validation & Processing Processor Function
const processFundImport = async (job) => {
  const { rows, companyId } = job.data;
  
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    throw new Error("No rows found in import payload.");
  }

  // A. Header / Required Field Structure Validation Check
  const requiredColumns = ['name'];
  const fileHeaders = Object.keys(rows[0] || {}).map(h => h.toLowerCase().trim());
  const missingHeaders = requiredColumns.filter(col => !fileHeaders.includes(col));

  if (missingHeaders.length > 0) {
    // Save file-level schema/header rejection block
    await FailedJobLog.create({
      jobId: String(job.id).trim(),
      companyId: companyId,
      failedRecords: [{
        row_number: 0,
        name: "File Format Error",
        import_error_reason: `Invalid CSV format or missing mandatory column header(s): ${missingHeaders.join(', ')}`
      }]
    });
    return {
      total: rows.length,
      imported: 0,
      failed: rows.length,
      jobId: job.id
    };
  }

  const validRows = [];
  const failedRowsList = [];

  // B. O(1) Bulk duplicate memory set check
  const incomingNames = rows.map(r => r.name?.trim()).filter(Boolean);
  const existingFunds = await Fund.findAll({
    where: { 
      name: incomingNames,
      companyId: companyId 
    },
    attributes: ['name']
  });
  const existingNamesSet = new Set(existingFunds.map(f => f.name.toLowerCase()));

  // Track duplicates within the same batch file upload to prevent multi-insert collision
  const batchSeenNames = new Set();

  // C. In-memory loop validation (Super fast CPU work)
  rows.forEach((row, index) => {
    const rowNum = index + 1;
    const errors = [];

    const trimmedName = row.name ? String(row.name).trim() : '';

    if (!trimmedName) {
      errors.push("Fund Name is required.");
    }

    if (!row.type) {
      errors.push("Fund Type is required.");
    }

    // Check system duplicates
    if (trimmedName && existingNamesSet.has(trimmedName.toLowerCase())) {
      errors.push(`Fund name "${trimmedName}" already exists in system.`);
    }

    // Check batch self-duplicates
    if (trimmedName) {
      const lowerName = trimmedName.toLowerCase();
      if (batchSeenNames.has(lowerName)) {
        errors.push(`Duplicate fund name "${trimmedName}" found within the uploaded file batch.`);
      } else {
        batchSeenNames.add(lowerName);
      }
    }

    // Strict Industry Format Verification
    if (row.industry) {
      const indStr = String(row.industry).trim();
      if (indStr.includes('{') || indStr.includes('}') || indStr.toUpperCase().includes('BROKEN')) {
        errors.push("Invalid Industry format string.");
      } else if (typeof row.industry === 'string') {
        try {
          row.industry = JSON.parse(row.industry);
        } catch(e) {
          row.industry = row.industry.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }

    if (errors.length > 0) {
      failedRowsList.push({
        ...row,
        row_number: rowNum,
        name: trimmedName || `Row ${rowNum}`,
        import_error_reason: errors.join(" | ")
      });
    } else {
      validRows.push({
        name: trimmedName,
        type: row.type || 'Venture',
        location: row.location ? String(row.location).trim() : '',
        website: row.website ? String(row.website).trim() : null,
        industry: Array.isArray(row.industry) ? row.industry : (row.industry ? [row.industry] : []),
        companyId: companyId
      });
    }
  });

  // D. Bulk Insert Valid Rows (1 Database Call Only)
  if (validRows.length > 0) {
    await Fund.bulkCreate(validRows, { validating: false });
  }

  // E. Save Failed Logs safely for UI SweetAlert retrieval
  if (failedRowsList.length > 0) {
    await FailedJobLog.create({
      jobId: String(job.id).trim(),
      companyId: companyId,
      failedRecords: failedRowsList
    });
  }

  return {
    total: rows.length,
    imported: validRows.length,
    failed: failedRowsList.length,
    jobId: job.id
  };
};

// 4. Initialize Worker to listen and process incoming queue tasks
const fundImportWorker = new Worker("fundImportQueue", processFundImport, {
  connection: redisConnection
});

fundImportWorker.on("completed", (job) => {
  console.log(`Job ${job.id} validation processing successfully completed.`);
});

fundImportWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} worker execution failed:`, err);
});

// 5. Professional Export Structure
module.exports = {
  fundImportQueue,
  fundImportWorker
};