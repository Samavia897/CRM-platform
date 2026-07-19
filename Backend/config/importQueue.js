const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { Fund } = require('../models'); 


const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null, 
});

const fundImportQueue = new Queue('fundImportQueue', { connection });


const worker = new Worker('fundImportQueue', async (job) => {
  console.log(`=== Processing Job ${job.id} for Company ${job.data.companyId} ===`);
  const { rows, companyId } = job.data;

 
  if (rows && rows.length > 0) {
  
    const parsedRows = rows.map(r => ({
      ...r,
      industry: JSON.stringify(r.industry) 
    }));
    
    await Fund.bulkCreate(parsedRows);
    console.log(`=== Successful background ingestion of ${rows.length} records ===`);
  }
}, { connection });

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed deeply with:`, err.message);
});

module.exports = { fundImportQueue };