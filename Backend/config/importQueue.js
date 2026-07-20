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

// 3. Your In-Memory Validation Processor Function
const processFundImport = async (job) => {
  const { rows, companyId } = job.data;
  
  const validRows = [];
  const failedRowsList = [];

  // O(1) Bulk duplicate memory set check
  const incomingNames = rows.map(r => r.name?.trim()).filter(Boolean);
  const existingFunds = await Fund.findAll({
    where: { 
      name: incomingNames,
      companyId: companyId 
    },
    attributes: ['name']
  });
  const existingNamesSet = new Set(existingFunds.map(f => f.name.toLowerCase()));

  // In-memory loop validation (Super fast CPU work)
  rows.forEach((row, index) => {
    const rowNum = index + 1;
    const errors = [];

    if (!row.name) errors.push("Fund Name is required.");
    if (!row.type) errors.push("Fund Type is required.");

    if (row.name && existingNamesSet.has(row.name.toLowerCase())) {
      errors.push(`Fund name "${row.name}" already exists in system.`);
    }

    if (row.industry && typeof row.industry === 'string') {
      try {
        row.industry = JSON.parse(row.industry);
      } catch(e) {
        row.industry = row.industry.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

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

  // Bulk Insert Valid Rows (1 Call Only)
  if (validRows.length > 0) {
    await Fund.bulkCreate(validRows, { validating: false });
  }

  // Save Failed Logs safely
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