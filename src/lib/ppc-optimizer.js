// PPC Optimizer Module - Atomic Addition (Iron Rule #6)
// Section 1.3: Bleeding Decision Matrix
// Section 1.4: Competitor Sentiment Engine

/**
 * BLEEDING KEYWORD THRESHOLDS (From Section 1.3)
 */
export const BLEEDING_THRESHOLDS = {
  CRITICAL: { spend: 50, conversions: 0, days: 7, action: 'PAUSE', severity: '🔴' },
  HIGH: { spend: 25, conversions: 0, days: 5, action: 'LOWER_BID_40', severity: '🟠' },
  MEDIUM: { spend: 10, conversions: 0, days: 3, action: 'LOWER_BID_25', severity: '🟡' },
  WATCH: { spend: 0, conversions: 0, days: 1, action: 'MONITOR', severity: '🟢' }
};

/**
 * ACOS THRESHOLDS (From Section 1.3)
 */
export const ACOS_THRESHOLDS = {
  EXCELLENT: { min: 0, max: 20, action: 'SCALE_UP', recommendation: 'Increase bid by 10-15%' },
  GOOD: { min: 21, max: 35, action: 'MAINTAIN', recommendation: 'Maintain current bid' },
  MARGINAL: { min: 36, max: 50, action: 'LOWER_BID_10', recommendation: 'Lower bid by 10-15%' },
  UNPROFITABLE: { min: 51, max: 75, action: 'LOWER_BID_25', recommendation: 'Lower bid by 25-30%' },
  CRITICAL_LOSS: { min: 76, max: 999, action: 'PAUSE', recommendation: 'PAUSE or lower bid by 50%' }
};

/**
 * CTR THRESHOLDS (From Section 1.3)
 */
export const CTR_THRESHOLDS = {
  LOW_CTR: 0.5, // Below 0.5% = main image issue
  HIGH_CTR: 2.0  // Above 2% = good click-through
};

/**
 * COMPETITOR INTELLIGENCE DATABASE (Section 1.4)
 * This would be populated from parallel agent research
 */
export const COMPETITOR_INTELLIGENCE = {
  topUSPs: [
    'Fast shipping (2-day Prime)',
    'Bundle deals (buy 2 get 1 free)',
    'Extended warranty (2 years)',
    'Premium materials (stainless steel vs plastic)'
  ],
  pricingStrategy: {
    averagePrice: 29.99,
    priceRange: [24.99, 39.99],
    commonDiscounts: '15-20% off during Prime Day'
  },
  weaknesses: [
    'Poor customer service (3.5★ average)',
    'Slow shipping (5-7 days)',
    'Limited color options (only black/white)',
    'No bundle options'
  ],
  marketTrends: [
    'Eco-friendly packaging is trending (+35% mentions)',
    'Customers prioritize durability over price',
    'Video reviews increase conversion by 40%'
  ]
};

/**
 * Analyze campaign for bleeding keywords (Section 1.3)
 */
export function analyzeBleedingKeywords(campaigns) {
  const insights = [];
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (const campaign of campaigns) {
    if (campaign.deleted) continue;

    const daysActive = Math.floor((now - campaign.createdAt) / oneDayMs);
    const spend = campaign.spend || 0;
    const conversions = campaign.sales > 0 ? 1 : 0; // Simplified: sales > 0 = conversion

    // Check against thresholds
    let severity = null;
    let threshold = null;

    if (spend >= BLEEDING_THRESHOLDS.CRITICAL.spend && conversions === 0 && daysActive >= BLEEDING_THRESHOLDS.CRITICAL.days) {
      severity = 'CRITICAL';
      threshold = BLEEDING_THRESHOLDS.CRITICAL;
    } else if (spend >= BLEEDING_THRESHOLDS.HIGH.spend && conversions === 0 && daysActive >= BLEEDING_THRESHOLDS.HIGH.days) {
      severity = 'HIGH';
      threshold = BLEEDING_THRESHOLDS.HIGH;
    } else if (spend >= BLEEDING_THRESHOLDS.MEDIUM.spend && conversions === 0 && daysActive >= BLEEDING_THRESHOLDS.MEDIUM.days) {
      severity = 'MEDIUM';
      threshold = BLEEDING_THRESHOLDS.MEDIUM;
    }

    if (severity) {
      insights.push({
        id: `bleeding_${campaign.id}_${Date.now()}`,
        type: 'BLEEDING_KEYWORD',
        severity,
        severityEmoji: threshold.severity,
        campaignId: campaign.id,
        campaignName: campaign.campaignName,
        title: `${threshold.severity} ${severity} BLEED DETECTED`,
        problem: `$${spend.toFixed(2)} spent, 0 conversions in ${daysActive} days`,
        rootCause: daysActive >= 7
          ? 'This keyword has been burning money for over a week with zero sales. Either wrong audience intent or non-competitive offer.'
          : 'High spend with no conversions indicates poor keyword-product match or pricing issue.',
        recommendation: threshold.action === 'PAUSE'
          ? `PAUSE this campaign immediately`
          : threshold.action === 'LOWER_BID_40'
          ? `Lower bid by 40-50% (from current spend rate)`
          : `Lower bid by 25-30% (from current spend rate)`,
        expectedImpact: threshold.action === 'PAUSE'
          ? `Stop wasting $${(spend / daysActive).toFixed(2)}/day`
          : `Reduce daily spend by ${threshold.action === 'LOWER_BID_40' ? '40-50%' : '25-30%'}`,
        primaryAction: threshold.action === 'PAUSE' ? 'Pause Campaign' : 'Lower Bid',
        secondaryAction: 'Add Negative Keywords',
        currentValue: spend,
        suggestedValue: threshold.action === 'PAUSE' ? 0 : spend * 0.6,
        data: campaign
      });
    }
  }

  return insights;
}

/**
 * Analyze ACoS performance (Section 1.3)
 */
export function analyzeACoS(campaigns) {
  const insights = [];

  for (const campaign of campaigns) {
    if (campaign.deleted || campaign.acos === 0) continue;

    const acos = campaign.acos;
    let band = null;

    if (acos >= ACOS_THRESHOLDS.CRITICAL_LOSS.min) {
      band = ACOS_THRESHOLDS.CRITICAL_LOSS;
    } else if (acos >= ACOS_THRESHOLDS.UNPROFITABLE.min) {
      band = ACOS_THRESHOLDS.UNPROFITABLE;
    } else if (acos >= ACOS_THRESHOLDS.MARGINAL.min) {
      band = ACOS_THRESHOLDS.MARGINAL;
    } else if (acos >= ACOS_THRESHOLDS.GOOD.min) {
      band = ACOS_THRESHOLDS.GOOD;
    } else {
      band = ACOS_THRESHOLDS.EXCELLENT;
    }

    // Only create insights for actionable cases (not "maintain")
    if (band.action !== 'MAINTAIN') {
      const lossPerDollar = acos > 100 ? ((acos - 100) / 100).toFixed(2) : 0;

      insights.push({
        id: `acos_${campaign.id}_${Date.now()}`,
        type: 'ACOS_OPTIMIZATION',
        severity: band.action === 'PAUSE' ? 'CRITICAL' : band.action === 'SCALE_UP' ? 'POSITIVE' : 'MEDIUM',
        severityEmoji: band.action === 'PAUSE' ? '🔴' : band.action === 'SCALE_UP' ? '🟢' : '🟡',
        campaignId: campaign.id,
        campaignName: campaign.campaignName,
        title: band.action === 'SCALE_UP' ? 'Profitable Campaign - Scale Opportunity' : 'High ACoS - Losing Money',
        problem: band.action === 'SCALE_UP'
          ? `ACoS: ${acos.toFixed(1)}% (Excellent performance)`
          : `ACoS: ${acos.toFixed(1)}% (Losing $${lossPerDollar} per dollar spent)`,
        rootCause: band.action === 'SCALE_UP'
          ? 'This campaign is highly profitable. You\'re leaving money on the table by not scaling.'
          : acos > 100
          ? 'You\'re spending more on ads than you\'re making in sales. This is unsustainable.'
          : 'Profit margins are too thin. Need to reduce ad spend or improve conversion rate.',
        recommendation: band.recommendation,
        expectedImpact: band.action === 'SCALE_UP'
          ? `Increase revenue while maintaining ${acos.toFixed(1)}% ACoS`
          : `Target ACoS: 35% (industry standard for profitability)`,
        primaryAction: band.action === 'SCALE_UP' ? 'Increase Bid' : band.action === 'PAUSE' ? 'Pause Campaign' : 'Lower Bid',
        secondaryAction: band.action === 'SCALE_UP' ? 'Increase Budget' : 'Optimize Listing',
        currentValue: acos,
        suggestedValue: band.action === 'SCALE_UP' ? acos : 35,
        data: campaign
      });
    }
  }

  return insights;
}

/**
 * Analyze CTR for main image issues (Section 1.3)
 */
export function analyzeCTR(campaigns) {
  const insights = [];

  for (const campaign of campaigns) {
    if (campaign.deleted || campaign.impressions === 0) continue;

    const ctr = (campaign.clicks / campaign.impressions) * 100;
    const impressions = campaign.impressions;

    // Low CTR with high impressions = main image problem
    if (ctr < CTR_THRESHOLDS.LOW_CTR && impressions > 1000) {
      insights.push({
        id: `ctr_${campaign.id}_${Date.now()}`,
        type: 'LOW_CTR',
        severity: 'MEDIUM',
        severityEmoji: '🟡',
        campaignId: campaign.id,
        campaignName: campaign.campaignName,
        title: 'Low CTR - Main Image Issue',
        problem: `CTR: ${ctr.toFixed(2)}% (${campaign.clicks} clicks from ${impressions.toLocaleString()} impressions)`,
        rootCause: 'Your main image isn\'t standing out. Competitors likely use lifestyle shots with people. CTR problem = visual problem, not keyword problem.',
        recommendation: 'A/B test a lifestyle image showing the product in use. Add human element or context to make it relatable.',
        expectedImpact: 'Increase CTR to 1-2% (industry average), potentially doubling clicks without extra spend',
        primaryAction: 'View Image Tips',
        secondaryAction: 'Dismiss',
        currentValue: ctr,
        suggestedValue: 1.5,
        data: campaign
      });
    }
  }

  return insights;
}

/**
 * Generate Senior Consultant prompt (Section 1.4)
 */
export function generateConsultantPrompt(listingData) {
  const { title, bullets, description, price, acos } = listingData;

  // Determine price positioning
  const avgPrice = COMPETITOR_INTELLIGENCE.pricingStrategy.averagePrice;
  const pricePosition = price > avgPrice ? 'PREMIUM' : 'COMPETITIVE';
  const priceDiff = ((price - avgPrice) / avgPrice * 100).toFixed(0);

  return `
You are a Senior Amazon Listing Consultant with 10+ years of experience optimizing 7-figure brands.

ANALYZE THIS LISTING:
Title: ${title}
Bullets:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}
Description: ${description}
Price: $${price}
Current ACoS: ${acos}%

COMPETITIVE LANDSCAPE:
Top 3 Competitors emphasize:
${COMPETITOR_INTELLIGENCE.topUSPs.map(usp => `- ${usp}`).join('\n')}

Average competitor price: $${avgPrice}
Your price: $${price} (${pricePosition} - ${priceDiff > 0 ? '+' : ''}${priceDiff}% vs market)

COMPETITOR WEAKNESSES (Opportunities):
${COMPETITOR_INTELLIGENCE.weaknesses.map(w => `- ${w}`).join('\n')}

MARKET TRENDS:
${COMPETITOR_INTELLIGENCE.marketTrends.map(t => `- ${t}`).join('\n')}

YOUR TASK:
1. Identify 3 specific improvements to DIFFERENTIATE this listing from competitors
2. Focus on exploiting competitor weaknesses
3. Align with market trends
4. Provide EXACT wording changes (not suggestions)

OUTPUT FORMAT (Senior Consultant Style):
🎯 TITLE OPTIMIZATION
Current: ${title}
Recommended: [exact new title with material, size, and key benefit]
Why: [competitive advantage gained]

📝 BULLET POINT FIXES
Bullet #1: [exact new wording that addresses competitor weakness]
Competitive Edge: [how this beats competitors]

💰 PRICING STRATEGY
Current: $${price}
Recommended: $[exact price based on positioning]
Rationale: [market positioning logic with numbers]

🚀 DIFFERENTIATION ANGLE
[One sentence positioning statement that sets you apart from the 3 competitors listed above]

Be direct. Use numbers. No fluff. Sound like a consultant who's done this 1000 times.
`.trim();
}

/**
 * Aggregate campaigns by name (sum spend, sales, clicks, impressions across all dates)
 */
function aggregateCampaignsByName(campaigns) {
  const aggregated = {};

  for (const campaign of campaigns) {
    const name = campaign.campaignName;

    if (!aggregated[name]) {
      aggregated[name] = {
        ...campaign,
        spend: 0,
        sales: 0,
        clicks: 0,
        impressions: 0,
        recordCount: 0
      };
    }

    aggregated[name].spend += campaign.spend || 0;
    aggregated[name].sales += campaign.sales || 0;
    aggregated[name].clicks += campaign.clicks || 0;
    aggregated[name].impressions += campaign.impressions || 0;
    aggregated[name].recordCount += 1;

    // Recalculate ACoS and ROAS based on aggregated values
    aggregated[name].acos = aggregated[name].sales > 0
      ? (aggregated[name].spend / aggregated[name].sales) * 100
      : 0;
    aggregated[name].roas = aggregated[name].spend > 0
      ? aggregated[name].sales / aggregated[name].spend
      : 0;
  }

  return Object.values(aggregated);
}

/**
 * Main optimizer function - combines all analyses
 */
export function optimizeCampaigns(campaigns) {
  // CRITICAL FIX: Aggregate campaigns by name first to avoid duplicates
  const aggregatedCampaigns = aggregateCampaignsByName(campaigns);

  console.log(`📊 PPC Optimizer: Aggregated ${campaigns.length} records into ${aggregatedCampaigns.length} unique campaigns`);

  const allInsights = [
    ...analyzeBleedingKeywords(aggregatedCampaigns),
    ...analyzeACoS(aggregatedCampaigns),
    ...analyzeCTR(aggregatedCampaigns)
  ];

  // Sort by severity (Critical > High > Medium > Positive)
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, POSITIVE: 3 };
  allInsights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return allInsights;
}
