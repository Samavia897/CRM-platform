const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { Fund, FailedJobLog } = require('../models'); // Imported FailedJobLog model

// Redis connection setup
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null, 
});

// 1. COMPLETELY CONFIGURING EXPONENTIAL BACKOFF RETRIES
const fundImportQueue = new Queue('fundImportQueue', { 
  connection,
  defaultJobOptions: {
    attempts: 3,                  // Unpredictable fail hone par max 3 attempts karega
    backoff: {
      type: 'exponential',        // 1st retry: 5s, 2nd retry: 10s baad (avoids DB choking)
      delay: 5000, 
    },
    removeOnComplete: true,       // Memory efficiency: Success hone par Redis cache se remove karega
    removeOnFail: false          // Persistent failures ko Redis ke native failed list mein rakhega code audit ke liye
  }
});

// 2. WORKER IMPLEMENTATION WITH INDIVIDUAL ERROR HANDLING
const worker = new Worker('fundImportQueue', async (job) => {
  console.log(`=== Processing Job ${job.id} for Company ${job.data.companyId} ===`);
  const { rows, companyId } = job.data;

  if (!rows || rows.length === 0) {
    return { success: true, count: 0 };
  }

  // Row validation and stringify JSON attributes before ingestion
  const parsedRows = rows.map(r => ({
    ...r,
    companyId: companyId, // Ensuring multi-tenant scoping
    industry: typeof r.industry === 'object' ? JSON.stringify(r.industry) : r.industry
  }));

  // Bulk operation execution
  await Fund.bulkCreate(parsedRows, { validate: true });
  
  console.log(`=== Successful background ingestion of ${rows.length} records ===`);
  return { success: true, count: rows.length };

}, { connection });

// 3. COMPLETELY IMPLEMENTING FAILED REGISTRY & REPORT GENERATION
worker.on('failed', async (job, err) => {
  console.error(`❌ Job ${job.id} completely failed after 3 attempts. Error: ${err.message}`);
  
  if (!job) return;

  const { rows, companyId } = job.data;

  try {
    // Persistent logs database engine mein dump karna taaki data kabhi loss na ho
    await FailedJobLog.create({
      jobId: job.id,
      companyId: companyId,
      queueName: job.queueName,
      errorMessage: err.message,
      failedRecords: rows // Complete layout saved for client reporting
    });

    console.log(`🚀 System Registry: Persistent failure report registered for Job ${job.id}`);
  } catch (registryError) {
    console.error(`💥 CRITICAL ERROR: Failed to log failure registry in DB:`, registryError.message);
  }
});

module.exports = { fundImportQueue };