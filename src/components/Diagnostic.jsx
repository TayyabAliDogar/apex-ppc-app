import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { db, extractDate, safeParseDate } from '../lib/db';

export function Diagnostic() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    if (!db.isOpen()) await db.open();
    const campaigns = await db.campaigns.toArray();

    const first3 = campaigns.slice(0, 3).map(c => ({
      campaignName: c.campaignName,
      dateField: c.date,
      dateType: typeof c.date,
      extractedDate: extractDate(c),
      parsedTime: safeParseDate(extractDate(c)),
      allKeys: Object.keys(c)
    }));

    setData({
      total: campaigns.length,
      samples: first3
    });
  };

  if (!data) return <div>Loading...</div>;

  return (
    <Card title="Database Diagnostic">
      <div className="space-y-4">
        <div className="text-lg">Total Campaigns: {data.total}</div>

        <div className="space-y-4">
          {data.samples.map((sample, idx) => (
            <div key={idx} className="bg-[#0D1826] p-4 rounded-[9px]">
              <h3 className="text-emerald-400 font-medium mb-2">Campaign {idx + 1}</h3>
              <div className="space-y-1 text-sm font-mono">
                <div><span className="text-[#94A3B8]">Campaign Name:</span> {sample.campaignName}</div>
                <div><span className="text-[#94A3B8]">Date Field:</span> {JSON.stringify(sample.dateField)}</div>
                <div><span className="text-[#94A3B8]">Date Type:</span> {sample.dateType}</div>
                <div><span className="text-[#94A3B8]">Extracted Date:</span> {JSON.stringify(sample.extractedDate)}</div>
                <div><span className="text-[#94A3B8]">Parsed Time:</span> {sample.parsedTime}</div>
                <div><span className="text-[#94A3B8]">Parsed Date:</span> {isNaN(sample.parsedTime) ? 'INVALID' : new Date(sample.parsedTime).toISOString()}</div>
                <div><span className="text-[#94A3B8]">All Keys:</span> {sample.allKeys.join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
