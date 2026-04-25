// Quick script to check database contents
import Dexie from 'dexie';

const db = new Dexie('VibePPC');
db.version(8).stores({
  campaigns: '++id, date'
});

async function checkData() {
  await db.open();
  const campaigns = await db.campaigns.toArray();

  console.log('Total campaigns:', campaigns.length);
  console.log('\nFirst 3 campaigns:');
  campaigns.slice(0, 3).forEach((c, idx) => {
    console.log(`\nCampaign ${idx}:`);
    console.log('  Campaign Name:', c.campaignName);
    console.log('  Date field:', c.date);
    console.log('  Date type:', typeof c.date);
    console.log('  All keys:', Object.keys(c));
  });
}

checkData().catch(console.error);
