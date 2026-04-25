// AI Service for VibePPC Command Center
// Bleeding Keyword Detection & Bid Optimization
import { db, queries, safeParseFloat, getMaxDateFromData } from '../lib/db';

/**
 * Detect bleeding keywords (high spend, zero sales)
 * These are keywords draining budget without conversions
 */
export async function detectBleedingKeywords(options = {}) {
  const {
    minSpend = 0,  // Changed from 50 to 0 to catch all zero-sales campaigns
    minClicks = 10,
    dateRange = 30
  } = options;

  try {
    const maxDate = await getMaxDateFromData();
    const startDate = maxDate - (dateRange * 24 * 60 * 60 * 1000);
    const campaigns = await queries.getCampaignsByDateRange(startDate, maxDate);

    console.log('🔍 [AI] detectBleedingKeywords:', {
      totalCampaigns: campaigns.length,
      minSpend,
      minClicks,
      dateRange
    });

    // FIX: safeParseFloat use karo — CSV strings "12.50" direct compare nahi hoti
    const bleedingCampaigns = campaigns.filter(campaign => {
      const spend = safeParseFloat(campaign.spend);
      const sales = safeParseFloat(campaign.sales);
      const clicks = safeParseFloat(campaign.clicks);

      // Changed: Allow spend >= 0 instead of spend > minSpend to catch all zero-sales campaigns
      const isBleeding = spend >= minSpend && sales === 0 && clicks >= minClicks;

      // Log first 5 campaigns to see what data looks like
      if (campaigns.indexOf(campaign) < 5) {
        console.log('🔍 [AI] Sample campaign data:', {
          name: campaign.campaignName,
          spend,
          sales,
          clicks,
          rawSpend: campaign.spend,
          rawSales: campaign.sales,
          rawClicks: campaign.clicks
        });
      }

      if (spend >= minSpend && sales === 0) {
        console.log('🔍 [AI] Potential bleeding campaign:', {
          name: campaign.campaignName,
          spend,
          sales,
          clicks,
          isBleeding
        });
      }

      return isBleeding;
    });

    // Sort by spend (highest first)
    bleedingCampaigns.sort((a, b) => safeParseFloat(b.spend) - safeParseFloat(a.spend));

    // FIX: totalWaste bhi safeParseFloat se
    const totalWaste = bleedingCampaigns.reduce((sum, c) => sum + safeParseFloat(c.spend), 0);

    return {
      bleedingCampaigns,
      totalWaste,
      count: bleedingCampaigns.length,
      recommendations: generateRecommendations(bleedingCampaigns)
    };
  } catch (error) {
    console.error('Failed to detect bleeding keywords:', error);
    throw error;
  }
}

/**
 * Generate actionable recommendations for bleeding keywords
 */
function generateRecommendations(bleedingCampaigns) {
  const recommendations = [];

  bleedingCampaigns.forEach(campaign => {
    // FIX: safeParseFloat everywhere
    const spend = safeParseFloat(campaign.spend);
    const clicks = safeParseFloat(campaign.clicks);
    const cpc = clicks > 0 ? spend / clicks : 0;

    recommendations.push({
      campaignName: campaign.campaignName,
      asin: campaign.asin,
      issue: 'Zero conversions despite significant spend',
      severity: spend > 200 ? 'critical' : spend > 100 ? 'high' : 'medium',
      wastedSpend: spend,
      action: 'PAUSE_OR_REDUCE',
      suggestion: `Pause this campaign or reduce bid by 50%. Current CPC: $${cpc.toFixed(2)}`,
      potentialSavings: spend * 0.8
    });
  });

  return recommendations;
}

/**
 * Analyze campaign performance and suggest bid adjustments
 */
export async function analyzeCampaignPerformance(campaignId) {
  try {
    const campaign = await db.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // FIX: safeParseFloat use karo
    const spend = safeParseFloat(campaign.spend);
    const sales = safeParseFloat(campaign.sales);
    const clicks = safeParseFloat(campaign.clicks);
    const impressions = safeParseFloat(campaign.impressions);

    const roas = spend > 0 ? sales / spend : 0;
    const acos = sales > 0 ? (spend / sales) * 100 : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;

    let performance = 'unknown';
    let bidAdjustment = 0;

    if (roas >= 3.0 && acos <= 33) {
      performance = 'excellent';
      bidAdjustment = +20;
    } else if (roas >= 2.0 && acos <= 50) {
      performance = 'good';
      bidAdjustment = +10;
    } else if (roas >= 1.0 && acos <= 100) {
      performance = 'acceptable';
      bidAdjustment = 0;
    } else if (sales === 0 && spend > 50) {
      performance = 'bleeding';
      bidAdjustment = -100;
    } else {
      performance = 'poor';
      bidAdjustment = -30;
    }

    return {
      campaign,
      metrics: {
        roas: roas.toFixed(2),
        acos: acos.toFixed(1),
        ctr: ctr.toFixed(2),
        cpc: cpc.toFixed(2)
      },
      performance,
      bidAdjustment,
      recommendation: getBidRecommendation(performance, bidAdjustment, cpc)
    };
  } catch (error) {
    console.error('Failed to analyze campaign:', error);
    throw error;
  }
}

/**
 * Generate human-readable bid recommendation
 */
function getBidRecommendation(performance, adjustment, currentCPC) {
  if (adjustment === -100) {
    return `⛔ PAUSE this campaign immediately. It's bleeding money with zero conversions.`;
  }
  if (adjustment > 0) {
    const newCPC = currentCPC * (1 + adjustment / 100);
    return `✅ Increase bid by ${adjustment}% (from $${currentCPC.toFixed(2)} to $${newCPC.toFixed(2)}). This campaign is performing well.`;
  }
  if (adjustment < 0) {
    const newCPC = currentCPC * (1 + adjustment / 100);
    return `⚠️ Reduce bid by ${Math.abs(adjustment)}% (from $${currentCPC.toFixed(2)} to $${newCPC.toFixed(2)}). Performance is below target.`;
  }
  return `➡️ Maintain current bid of $${currentCPC.toFixed(2)}. Performance is acceptable.`;
}

/**
 * Get AI insights summary for dashboard
 */
export async function getAIInsightsSummary(dateRange = 30) {
  try {
    const maxDate = await getMaxDateFromData();
    const startDate = maxDate - (dateRange * 24 * 60 * 60 * 1000);
    const campaigns = await queries.getCampaignsByDateRange(startDate, maxDate);

    const bleeding = await detectBleedingKeywords({ dateRange });

    // FIX: safeParseFloat se calculate karo
    const totalSpend = campaigns.reduce((sum, c) => sum + safeParseFloat(c.spend), 0);
    const totalSales = campaigns.reduce((sum, c) => sum + safeParseFloat(c.sales), 0);
    const avgROAS = totalSpend > 0 ? totalSales / totalSpend : 0;

    const excellent = campaigns.filter(c => {
      const spend = safeParseFloat(c.spend);
      const sales = safeParseFloat(c.sales);
      const roas = spend > 0 ? sales / spend : 0;
      return roas >= 3.0;
    }).length;

    const poor = campaigns.filter(c => {
      const spend = safeParseFloat(c.spend);
      const sales = safeParseFloat(c.sales);
      const roas = spend > 0 ? sales / spend : 0;
      return roas < 1.0;
    }).length;

    return {
      totalCampaigns: campaigns.length,
      bleedingCount: bleeding.count,
      totalWaste: bleeding.totalWaste,
      avgROAS: avgROAS.toFixed(2),
      excellentCampaigns: excellent,
      poorCampaigns: poor,
      topRecommendations: bleeding.recommendations.slice(0, 5)
    };
  } catch (error) {
    console.error('Failed to get AI insights:', error);
    throw error;
  }
}