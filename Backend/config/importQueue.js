const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { Fund, FailedJobLog } = require('../models'); 

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null, 
});

const fundImportQueue = new Queue('fundImportQueue', { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false
  }
});

const worker = new Worker('fundImportQueue', async (job) => {
  console.log(`=== Processing Job ${job.id} for Company ${job.data.companyId} ===`);
  const { rows, companyId } = job.data;

  if (!rows || rows.length === 0) return;

  const failedRowsList = []; // Bad rows separately yahan jama hongi

  for (const row of rows) {
    try {
      // 1. STAGE CHECK: Agar JSON broken hai ya invalid hai toh manually error throw karo
      let industryData = row.industry;
      
      if (typeof industryData === 'string') {
        try {
          // Check karo agar valid JSON string nahi hai (jaise broken_json), toh error throw hoga
          JSON.parse(industryData);
        } catch (e) {
          throw new Error(`Invalid JSON format in industry field`);
        }
      } else if (typeof industryData === 'object') {
        industryData = JSON.stringify(industryData);
      }

      // 2. AMOUNT CHECK: Agar amount numbers ke alawa kuch aur hai toh error throw karo
      if (row.amount && isNaN(Number(row.amount))) {
        throw new Error(`Amount must be a valid number, got: "${row.amount}"`);
      }

      // Agar data sahi hai toh object taiyar karo
      const parsedRow = {
        ...row,
        companyId: companyId,
        industry: industryData
      };

      // Single row insert (jo sahi hain sirf wahi database mein jayengi)
      await Fund.create(parsedRow);

    } catch (rowError) {
      console.error(`⚠️ Bad Row Detected: ${row.name || 'Unknown'} - Reason: ${rowError.message}`);
      
      // Sahi rows se ALAG karke is bad row ko reason ke sath save kar rahe hain
      failedRowsList.push({
        ...row,
        import_error_reason: rowError.message
      });
    }
  }

  // 3. AGAR BATCH MEIN KOI BHI BAD ROW MILI, TOH USKO SEPARATELY DATABASE REGISTRY MEIN DUMP KARO
  if (failedRowsList.length > 0) {
    await FailedJobLog.create({
      jobId: job.id,
      companyId: companyId,
      queueName: job.queueName,
      errorMessage: `${failedRowsList.length} rows were separated due to validation errors.`,
      failedRecords: failedRowsList // Yeh bad rows ka alag data hai
    });
    console.log(`🚀 Saved ${failedRowsList.length} bad rows separately in FailedJobLog table.`);
  }

  console.log(`=== Ingestion completed for Job ${job.id} ===`);
}, { connection });

module.exports = { fundImportQueue };