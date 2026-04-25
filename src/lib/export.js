// Data Export Functionality (Mandatory Mitigation: Backup Data)
// Allows users to export all data as JSON for backup
import { db } from './db';
import { markBackupComplete } from './storage-monitor';
import * as XLSX from 'xlsx';

export async function exportAllData() {
  try {
    // Rule 2.9.2: Use .filter() for soft-delete check (Schema V3)
    const campaigns = await db.campaigns.filter(c => !c.deleted).toArray();
    const keywords = await db.keywords.toArray();
    const insights = await db.insights.toArray();
    const forecasts = await db.forecasts.toArray();
    const settings = await db.settings.toArray();

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        campaigns,
        keywords,
        insights,
        forecasts,
        settings
      },
      metadata: {
        totalCampaigns: campaigns.length,
        totalKeywords: keywords.length,
        totalInsights: insights.length
      }
    };

    // Create JSON blob
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apex-backup-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Mark backup as complete
    markBackupComplete();

    return {
      success: true,
      totalRecords: campaigns.length + keywords.length + insights.length
    };
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export data: ' + error.message);
  }
}

export async function importData(file) {
  try {
    const text = await file.text();
    const importData = JSON.parse(text);

    // Validate format
    if (!importData.version || !importData.data) {
      throw new Error('Invalid backup file format');
    }

    // Import data
    const { campaigns, keywords, insights, forecasts, settings } = importData.data;

    if (campaigns && campaigns.length > 0) {
      await db.campaigns.bulkPut(campaigns);
    }
    if (keywords && keywords.length > 0) {
      await db.keywords.bulkPut(keywords);
    }
    if (insights && insights.length > 0) {
      await db.insights.bulkPut(insights);
    }
    if (forecasts && forecasts.length > 0) {
      await db.forecasts.bulkPut(forecasts);
    }
    if (settings && settings.length > 0) {
      await db.settings.bulkPut(settings);
    }

    return {
      success: true,
      imported: {
        campaigns: campaigns?.length || 0,
        keywords: keywords?.length || 0,
        insights: insights?.length || 0
      }
    };
  } catch (error) {
    console.error('Import failed:', error);
    throw new Error('Failed to import data: ' + error.message);
  }
}

export async function exportToCSV() {
  try {
    // Rule 2.9.2: Use .filter() for soft-delete check (Schema V3)
    const campaigns = await db.campaigns.filter(c => !c.deleted).toArray();

    // Convert to CSV
    const headers = ['Campaign Name', 'Date', 'Impressions', 'Clicks', 'Spend', 'Sales', 'ACoS', 'ROAS'];
    const rows = campaigns.map(c => [
      c.campaignName,
      new Date(c.date).toLocaleDateString(),
      c.impressions,
      c.clicks,
      c.spend,
      c.sales,
      c.acos,
      c.roas
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create CSV blob
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apex-campaigns-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, totalRecords: campaigns.length };
  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error('Failed to export CSV: ' + error.message);
  }
}

/**
 * Export data to professional Excel file with formatted sheets
 */
export async function exportToExcel() {
  try {
    // Get all data
    const campaigns = await db.campaigns.filter(c => !c.deleted).toArray();
    const keywords = await db.keywords.toArray();
    const insights = await db.insights.toArray();

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Campaigns Sheet
    if (campaigns.length > 0) {
      const campaignData = campaigns.map(c => ({
        'Campaign Name': c.campaignName || '',
        'ASIN': c.asin || '',
        'Date': c.date ? new Date(c.date).toLocaleDateString() : '',
        'Impressions': c.impressions || 0,
        'Clicks': c.clicks || 0,
        'Spend': c.spend ? `$${parseFloat(c.spend).toFixed(2)}` : '$0.00',
        'Sales': c.sales ? `$${parseFloat(c.sales).toFixed(2)}` : '$0.00',
        'ACoS': c.acos ? `${parseFloat(c.acos).toFixed(2)}%` : '0%',
        'ROAS': c.roas ? parseFloat(c.roas).toFixed(2) : '0'
      }));

      const campaignSheet = XLSX.utils.json_to_sheet(campaignData);

      // Set column widths
      campaignSheet['!cols'] = [
        { wch: 30 }, // Campaign Name
        { wch: 15 }, // ASIN
        { wch: 12 }, // Date
        { wch: 12 }, // Impressions
        { wch: 10 }, // Clicks
        { wch: 12 }, // Spend
        { wch: 12 }, // Sales
        { wch: 10 }, // ACoS
        { wch: 10 }  // ROAS
      ];

      XLSX.utils.book_append_sheet(workbook, campaignSheet, 'Campaigns');
    }

    // Keywords Sheet
    if (keywords.length > 0) {
      const keywordData = keywords.map(k => ({
        'Keyword': k.keyword || '',
        'Campaign ID': k.campaignId || '',
        'Bid': k.bid ? `$${parseFloat(k.bid).toFixed(2)}` : '$0.00',
        'Match Type': k.matchType || '',
        'Impressions': k.impressions || 0,
        'Clicks': k.clicks || 0,
        'Spend': k.spend ? `$${parseFloat(k.spend).toFixed(2)}` : '$0.00',
        'Conversions': k.conversions || 0,
        'ACoS': k.acos ? `${parseFloat(k.acos).toFixed(2)}%` : '0%'
      }));

      const keywordSheet = XLSX.utils.json_to_sheet(keywordData);

      keywordSheet['!cols'] = [
        { wch: 25 }, // Keyword
        { wch: 12 }, // Campaign ID
        { wch: 10 }, // Bid
        { wch: 12 }, // Match Type
        { wch: 12 }, // Impressions
        { wch: 10 }, // Clicks
        { wch: 12 }, // Spend
        { wch: 12 }, // Conversions
        { wch: 10 }  // ACoS
      ];

      XLSX.utils.book_append_sheet(workbook, keywordSheet, 'Keywords');
    }

    // Insights Sheet
    if (insights.length > 0) {
      const insightData = insights.map(i => ({
        'Type': i.type || '',
        'Severity': i.severity || '',
        'Campaign ID': i.campaignId || '',
        'Keyword ID': i.keywordId || '',
        'Created': i.createdAt ? new Date(i.createdAt).toLocaleDateString() : '',
        'Resolved': i.resolvedAt ? new Date(i.resolvedAt).toLocaleDateString() : 'Open'
      }));

      const insightSheet = XLSX.utils.json_to_sheet(insightData);

      insightSheet['!cols'] = [
        { wch: 20 }, // Type
        { wch: 12 }, // Severity
        { wch: 12 }, // Campaign ID
        { wch: 12 }, // Keyword ID
        { wch: 12 }, // Created
        { wch: 12 }  // Resolved
      ];

      XLSX.utils.book_append_sheet(workbook, insightSheet, 'Insights');
    }

    // Summary Sheet
    const totalSpend = campaigns.reduce((sum, c) => sum + (parseFloat(c.spend) || 0), 0);
    const totalSales = campaigns.reduce((sum, c) => sum + (parseFloat(c.sales) || 0), 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + (parseFloat(c.impressions) || 0), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + (parseFloat(c.clicks) || 0), 0);
    const avgRoas = totalSpend > 0 ? (totalSales / totalSpend).toFixed(2) : 0;
    const avgAcos = totalSales > 0 ? ((totalSpend / totalSales) * 100).toFixed(2) : 0;

    const summaryData = [
      { 'Metric': 'Total Campaigns', 'Value': campaigns.length },
      { 'Metric': 'Total Keywords', 'Value': keywords.length },
      { 'Metric': 'Total Insights', 'Value': insights.length },
      { 'Metric': '', 'Value': '' },
      { 'Metric': 'Total Spend', 'Value': `$${totalSpend.toFixed(2)}` },
      { 'Metric': 'Total Sales', 'Value': `$${totalSales.toFixed(2)}` },
      { 'Metric': 'Total Impressions', 'Value': totalImpressions.toLocaleString() },
      { 'Metric': 'Total Clicks', 'Value': totalClicks.toLocaleString() },
      { 'Metric': '', 'Value': '' },
      { 'Metric': 'Average ROAS', 'Value': `${avgRoas}x` },
      { 'Metric': 'Average ACoS', 'Value': `${avgAcos}%` },
      { 'Metric': '', 'Value': '' },
      { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() }
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [
      { wch: 25 }, // Metric
      { wch: 20 }  // Value
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Download file
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Apex-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Mark backup as complete
    markBackupComplete();

    return {
      success: true,
      totalRecords: campaigns.length + keywords.length + insights.length,
      sheets: ['Summary', 'Campaigns', 'Keywords', 'Insights'].filter((_, i) =>
        i === 0 || (i === 1 && campaigns.length > 0) || (i === 2 && keywords.length > 0) || (i === 3 && insights.length > 0)
      )
    };
  } catch (error) {
    console.error('Excel export failed:', error);
    throw new Error('Failed to export Excel: ' + error.message);
  }
}
