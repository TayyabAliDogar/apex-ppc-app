import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { optimizeListing } from '../lib/gemini';
// ATOMIC ADDITION: Import new PPC optimizer module (Iron Rule #6)
import { optimizeCampaigns, generateConsultantPrompt } from '../lib/ppc-optimizer';
import { EmeraldInsightList } from './EmeraldInsightCard';
import { db } from '../lib/db';
// ATOMIC ADDITION: Import Amazon scraper (Iron Rule #6)
import { scrapeAmazonProduct, scrapeCompetitors } from '../lib/amazon-scraper';

export function ListingEditor() {
  // Form data state
  const [listing, setListing] = useState(() => {
    // Restore from localStorage on mount
    const saved = localStorage.getItem('vibeppc_listing_editor');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('✅ Restored listing data from localStorage');
        return parsed.listing || {
          title: '',
          bullets: ['', '', '', '', ''],
          description: ''
        };
      } catch (e) {
        console.warn('⚠️ Failed to restore listing data:', e);
      }
    }
    return {
      title: '',
      bullets: ['', '', '', '', ''],
      description: ''
    };
  });

  // AI analysis state
  const[analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(() => {
    // Restore suggestions from localStorage
    const saved = localStorage.getItem('vibeppc_listing_editor');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.suggestions || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [error, setError] = useState(null);

  // ASIN-based competitor analysis state
  const [userAsin, setUserAsin] = useState(() => {
    const saved = localStorage.getItem('vibeppc_listing_editor');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.userAsin || '';
      } catch (e) {
        return '';
      }
    }
    return '';
  });
  const [competitorAsins, setCompetitorAsins] = useState(() => {
    const saved = localStorage.getItem('vibeppc_listing_editor');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.competitorAsins || ['', '', ''];
      } catch (e) {
        return ['', '', ''];
      }
    }
    return ['', '', ''];
  });
  const [fetchingProductData, setFetchingProductData] = useState(false);
  const [productData, setProductData] = useState(null);
  const [competitorData, setCompetitorData] = useState(() => {
    const saved = localStorage.getItem('vibeppc_listing_editor');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log(`✅ Restored ${parsed.competitorData?.length || 0} competitor listings from localStorage`);
        return parsed.competitorData || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCompetitorInput, setManualCompetitorInput] = useState({
    asin: '',
    title: '',
    bullets: ['', '', '', '', ''],
    description: '',
    price: '',
    rating: '',
    reviewCount: ''
  });

  // ATOMIC ADDITION: PPC Insights state (Iron Rule #6 - Non-destructive)
  const [ppcInsights, setPpcInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const[cooldownProgress, setCooldownProgress] = useState(0);

  // FIX: Clear listing editor data on hard refresh
  useEffect(() => {
    // Detect if this is a page reload (hard refresh)
    const navigationEntries = performance.getEntriesByType('navigation');
    const isReload = navigationEntries.length > 0 && navigationEntries[0].type === 'reload';

    if (isReload) {
      // Clear listing editor data from localStorage on hard refresh
      localStorage.removeItem('vibeppc_listing_editor');
      console.log('🔄 Hard refresh detected - Cleared listing editor data');

      // Reset all state to empty
      setListing({
        title: '',
        bullets: ['', '', '', '', ''],
        description: ''
      });
      setSuggestions(null);
      setUserAsin('');
      setCompetitorAsins(['', '', '']);
      setCompetitorData([]);
    }
  }, []); // Run once on mount

  // CRITICAL FIX: Persist listing editor state to localStorage
  useEffect(() => {
    const dataToSave = {
      listing,
      suggestions,
      userAsin,
      competitorAsins,
      competitorData
    };

    try {
      localStorage.setItem('vibeppc_listing_editor', JSON.stringify(dataToSave));
      console.log('💾 Saved listing editor state to localStorage');
    } catch (e) {
      console.warn('⚠️ Failed to save listing editor state:', e);
    }
  }, [listing, suggestions, userAsin, competitorAsins, competitorData]);

  // Title change handler
  const handleTitleChange = (value) => {
    setListing(prev => ({
      ...prev,
      title: value
    }));
  };

  // Bullet change handler
  const handleBulletChange = (index, value) => {
    setListing(prev => ({
      ...prev,
      bullets: prev.bullets.map((bullet, i) =>
        i === index ? value : bullet
      )
    }));
  };

  // Description change handler
  const handleDescriptionChange = (value) => {
    setListing(prev => ({
      ...prev,
      description: value
    }));
  };

  // Character counter color logic
  const getCounterColor = (length, max) => {
    const percentage = (length / max) * 100;
    if (percentage >= 100) return 'text-red-400';
    if (percentage >= 90) return 'text-yellow-400';
    return 'text-gray-500';
  };

  // Form validation
  const isFormValid = () => {
    if (listing.title.trim().length <= 5) return false;
    if (listing.description.trim().length <= 10) return false;
    return true;
  };

  // AI Refine handler with 4-second cooldown and PPC insights (Pillar 3)
  const handleAIRefine = async () => {
    if (!isFormValid()) {
      setError('Please fill in all required fields');
      return;
    }

    setAnalyzing(true);
    setLoadingInsights(true);
    setError(null);
    setSuggestions(null);
    setCooldownProgress(0);

    try {
      // Phase 1: 4-second cooldown with glowing progress ring (Pillar 3)
      const cooldownDuration = 4000; // 4 seconds
      const intervalMs = 50; // Update every 50ms for smooth animation
      const steps = cooldownDuration / intervalMs;
      let currentStep = 0;

      const cooldownInterval = setInterval(() => {
        currentStep++;
        const progress = (currentStep / steps) * 100;
        setCooldownProgress(progress);

        if (currentStep >= steps) {
          clearInterval(cooldownInterval);
        }
      }, intervalMs);

      // Wait for cooldown to complete
      await new Promise(resolve => setTimeout(resolve, cooldownDuration));

      // Phase 2: Load PPC insights from campaigns
      try {
        // Verify database is open
        if (!db.isOpen()) {
          console.warn('⚠️ Database not open, skipping PPC insights');
          throw new Error('Database not ready');
        }

        // FIXED: Allow version 8 or higher (Since DB is on V8)
        if (db.verno < 8) {
          console.warn(`⚠️ Database version mismatch: Expected V8 or higher, got V${db.verno}`);
          throw new Error('Database version mismatch');
        }

        const campaigns = await db.campaigns
          .filter(c => !c.deleted)
          .toArray();

        console.log(`📊 ListingEditor: Loaded ${campaigns.length} campaigns for insights`);

        if (campaigns.length > 0) {
          const validCampaigns = campaigns.filter(c => {
            return (
              c &&
              typeof c.campaignName === 'string' &&
              c.campaignName.trim() !== '' &&
              typeof c.spend === 'number' &&
              typeof c.sales === 'number'
            );
          });

          console.log(`✅ Validated ${validCampaigns.length} campaigns for insights`);

          if (validCampaigns.length > 0) {
            const insights = optimizeCampaigns(validCampaigns);
            setPpcInsights(insights);
            console.log(`✅ Generated ${insights.length} PPC insights`);
          } else {
            console.log('ℹ️ No valid campaigns found - skipping PPC insights');
          }
        } else {
          console.log('ℹ️ No campaigns found - skipping PPC insights');
        }
      } catch (dbError) {
        console.error('❌ Failed to load campaigns for insights:', dbError);
        // Don't fail the entire operation, just skip PPC insights
      }

      // Phase 3: Call AI listing optimization with competitor data if available
      const competitorDataForAI = competitorData.length > 0 ? competitorData : null;

      if (competitorDataForAI) {
        console.log(`✅ Using ${competitorDataForAI.length} real competitor listings for AI analysis`);
      } else {
        console.log('ℹ️ No competitor data - using generic optimization patterns');
      }

      const result = await optimizeListing(listing, competitorDataForAI);
      setSuggestions(result);

    } catch (err) {
      console.error('❌ AI Refine failed:', err);
      setError(err.message || 'Unable to analyze listing.');
    } finally {
      setAnalyzing(false);
      setLoadingInsights(false);
      setCooldownProgress(0);
    }
  };

  // Format field name for display
  const formatFieldName = (field) => {
    const fieldMap = {
      'title': 'Title',
      'bullet1': 'Bullet 1',
      'bullet2': 'Bullet 2',
      'bullet3': 'Bullet 3',
      'bullet4': 'Bullet 4',
      'bullet5': 'Bullet 5',
      'description': 'Description'
    };
    return fieldMap[field] || field;
  };

  // Apply individual suggestion
  const applySuggestion = (field, optimizedValue) => {
    if (field === 'title') {
      setListing(prev => ({ ...prev, title: optimizedValue }));
    } else if (field.startsWith('bullet')) {
      const index = parseInt(field.replace('bullet', '')) - 1;
      setListing(prev => ({
        ...prev,
        bullets: prev.bullets.map((b, i) => i === index ? optimizedValue : b)
      }));
    } else if (field === 'description') {
      setListing(prev => ({ ...prev, description: optimizedValue }));
    }
  };

  // Apply all suggestions at once
  const applyAllSuggestions = () => {
    if (!suggestions || !suggestions.optimized) return;

    setListing({
      title: suggestions.optimized.title,
      bullets: suggestions.optimized.bullets,
      description: suggestions.optimized.description
    });
  };

  // ATOMIC ADDITION: PPC Insight handlers (Iron Rule #6 - Non-destructive)
  const handleDismissInsight = (insightId) => {
    setPpcInsights(prev => prev.filter(insight => insight.id !== insightId));
  };

  const handleApplyInsight = async (insight, actionType) => {
    // TODO: Implement actual bid changes when campaign management is added
    alert(`Action "${insight.primaryAction}" would be applied to: ${insight.campaignName}`);
  };

  // ASIN-based competitor analysis handlers
  const handleFetchProductData = async () => {
    if (!userAsin.trim()) {
      setError('Please enter your product ASIN');
      return;
    }

    setFetchingProductData(true);
    setError(null);

    try {
      console.log(`🔍 Fetching product data for ASIN: ${userAsin}`);
      const data = await scrapeAmazonProduct(userAsin);

      setProductData(data);

      // Auto-fill the listing form with scraped data
      setListing({
        title: data.title || '',
        bullets: [
          data.bullets[0] || '',
          data.bullets[1] || '',
          data.bullets[2] || '',
          data.bullets[3] || '',
          data.bullets[4] || ''
        ],
        description: data.description || ''
      });

      console.log('✅ Product data fetched and form auto-filled');
      setError(null);

    } catch (err) {
      console.error('❌ Failed to fetch product:', err);
      setError(err.message || 'Failed to fetch product data. Amazon may have blocked the request. Try manual entry instead.');
    } finally {
      setFetchingProductData(false);
    }
  };

  const handleFetchCompetitorData = async () => {
    const validAsins = competitorAsins.filter(asin => asin.trim() !== '');

    if (validAsins.length === 0) {
      setError('Please enter at least one competitor ASIN');
      return;
    }

    setFetchingProductData(true);
    setError(null);

    try {
      console.log(`🔍 Fetching competitor data for ${validAsins.length} ASINs:`, validAsins);
      const results = await scrapeCompetitors(validAsins);

      setCompetitorData(results);
      console.log(`✅ Successfully fetched ${results.length} competitor listings`);
      setError(null);

    } catch (err) {
      console.error('❌ Failed to fetch competitors:', err);
      setError(err.message || 'Failed to fetch competitor data. Amazon may have blocked the request. Try manual entry instead.');
    } finally {
      setFetchingProductData(false);
    }
  };

  const handleCompetitorAsinChange = (index, value) => {
    setCompetitorAsins(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleManualCompetitorBulletChange = (index, value) => {
    setManualCompetitorInput(prev => ({
      ...prev,
      bullets: prev.bullets.map((b, i) => i === index ? value : b)
    }));
  };

  const handleAddManualCompetitor = () => {
    if (!manualCompetitorInput.asin.trim() || !manualCompetitorInput.title.trim()) {
      setError('Please enter at least ASIN and Title for the competitor');
      return;
    }

    const newCompetitor = {
      asin: manualCompetitorInput.asin.trim(),
      title: manualCompetitorInput.title.trim(),
      bullets: manualCompetitorInput.bullets.filter(b => b.trim() !== ''),
      description: manualCompetitorInput.description.trim(),
      price: parseFloat(manualCompetitorInput.price) || 0,
      rating: parseFloat(manualCompetitorInput.rating) || 0,
      reviewCount: parseInt(manualCompetitorInput.reviewCount) || 0
    };

    setCompetitorData(prev => [...prev, newCompetitor]);

    // Reset form
    setManualCompetitorInput({
      asin: '',
      title: '',
      bullets: ['', '', '', '', ''],
      description: '',
      price: '',
      rating: '',
      reviewCount: ''
    });

    setShowManualInput(false);
    setError(null);
  };

  const handleRemoveCompetitor = (index) => {
    setCompetitorData(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header with AI Refine Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-[700]" style={{ color: 'var(--text-primary)' }}>Listing Editor</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Optimize your Amazon product listing with AI
          </p>
        </div>
        <Button
          onClick={handleAIRefine}
          disabled={analyzing || !isFormValid()}
          className="relative flex items-center gap-2 text-white px-6 py-3 rounded-[9px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          style={{ backgroundColor: 'var(--accent-primary)' }}
          onMouseEnter={(e) => !analyzing && !isFormValid() ? null : e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
        >
          {analyzing ? (
            <>
              {/* Glowing Progress Ring (4-second cooldown) */}
              {loadingInsights && cooldownProgress < 100 ? (
                <div className="relative w-5 h-5">
                  <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 20 20">
                    {/* Background circle */}
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="2"
                      fill="none"
                    />
                    {/* Progress circle with glow */}
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 8}`}
                      strokeDashoffset={`${2 * Math.PI * 8 * (1 - cooldownProgress / 100)}`}
                      className="transition-all duration-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                      style={{
                        filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))'
                      }}
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 border-[0.5px] border-white border-t-transparent rounded-[4px] animate-spin" />
              )}
              {loadingInsights && cooldownProgress < 100 ? 'Preparing Insights...' : 'Refining...'}
            </>
          ) : (
            <>
              <span>✨</span>
              AI Refine
            </>
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-[9px] p-4" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid var(--error)' }}>
          <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
        </div>
      )}

      {/* ASIN-Based Competitor Analysis Section */}
      <Card animationDelay={0}>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>ASIN-Based Competitor Analysis</h3>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Fetch real product data from Amazon to analyze your listing against competitors
            </p>
          </div>

          {/* User's ASIN Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Your Product ASIN
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={userAsin}
                onChange={(e) => setUserAsin(e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="B09XYZ1234"
                className="flex-1 rounded-[9px] px-4 py-3 focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--input-focus-border)';
                  e.target.style.boxShadow = '0 0 0 3px var(--input-focus-shadow)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--input-border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <Button
                onClick={handleFetchProductData}
                disabled={fetchingProductData || !userAsin.trim()}
                className="text-white px-6 py-3 rounded-[9px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#3B82F6' }}
                onMouseEnter={(e) => !fetchingProductData && userAsin.trim() ? e.currentTarget.style.backgroundColor = '#2563EB' : null}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
              >
                {fetchingProductData ? 'Fetching...' : 'Fetch My Product'}
              </Button>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Enter your product's ASIN to fetch title, bullets, and description from Amazon
            </p>
          </div>

          {/* Competitor ASINs Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Competitor ASINs (2-3 recommended)
            </label>
            <div className="space-y-2">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-sm w-24" style={{ color: 'var(--text-tertiary)' }}>Competitor {index + 1}:</span>
                  <input
                    type="text"
                    value={competitorAsins[index]}
                    onChange={(e) => handleCompetitorAsinChange(index, e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder="B08ABC5678"
                    className="flex-1 rounded-[9px] px-4 py-2 focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#A855F7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--input-border)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
            <Button
              onClick={handleFetchCompetitorData}
              disabled={fetchingProductData || competitorAsins.every(a => !a.trim())}
              className="mt-3 text-white px-6 py-3 rounded-[9px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#A855F7' }}
              onMouseEnter={(e) => !fetchingProductData && !competitorAsins.every(a => !a.trim()) ? e.currentTarget.style.backgroundColor = '#9333EA' : null}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#A855F7'}
            >
              {fetchingProductData ? 'Fetching...' : 'Fetch Competitor Data'}
            </Button>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Enter 2-3 competitor ASINs to analyze their listings and get authentic optimization suggestions
            </p>
          </div>

          {/* Manual Input Option */}
          <div className="pt-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Manual Competitor Entry</h4>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Add competitor data manually for testing</p>
              </div>
              <Button
                onClick={() => setShowManualInput(!showManualInput)}
                className="px-4 py-2 rounded-[9px] text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              >
                {showManualInput ? 'Hide Form' : 'Add Manually'}
              </Button>
            </div>

            {showManualInput && (
              <div className="p-4 rounded-[9px] space-y-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>ASIN *</label>
                    <input
                      type="text"
                      value={manualCompetitorInput.asin}
                      onChange={(e) => setManualCompetitorInput(prev => ({ ...prev, asin: e.target.value.toUpperCase() }))}
                      maxLength={10}
                      placeholder="B08ABC5678"
                      className="w-full rounded px-3 py-2 text-sm focus:outline-none"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#A855F7';
                        e.target.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--input-border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Price</label>
                    <input
                      type="number"
                      value={manualCompetitorInput.price}
                      onChange={(e) => setManualCompetitorInput(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="29.99"
                      className="w-full rounded px-3 py-2 text-sm focus:outline-none"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#A855F7';
                        e.target.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--input-border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Title *</label>
                  <input
                    type="text"
                    value={manualCompetitorInput.title}
                    onChange={(e) => setManualCompetitorInput(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Competitor product title..."
                    className="w-full rounded px-3 py-2 text-sm focus:outline-none"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#A855F7';
                      e.target.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--input-border)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Bullet Points</label>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <textarea
                      key={index}
                      value={manualCompetitorInput.bullets[index]}
                      onChange={(e) => handleManualCompetitorBulletChange(index, e.target.value)}
                      rows={2}
                      placeholder={`Bullet point ${index + 1}...`}
                      className="w-full rounded px-3 py-2 text-sm mb-2 resize-none focus:outline-none"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#A855F7';
                        e.target.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--input-border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Description</label>
                  <textarea
                    value={manualCompetitorInput.description}
                    onChange={(e) => setManualCompetitorInput(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Product description..."
                    className="w-full rounded px-3 py-2 text-sm resize-none focus:outline-none"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#A855F7';
                      e.target.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--input-border)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Rating</label>
                    <input
                      type="number"
                      value={manualCompetitorInput.rating}
                      onChange={(e) => setManualCompetitorInput(prev => ({ ...prev, rating: e.target.value }))}
                      placeholder="4.5"
                      step="0.1"
                      min="0"
                      max="5"
                      className="w-full rounded px-3 py-2 text-sm focus:outline-none"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#A855F7';
                        e.target.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--input-border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Review Count</label>
                    <input
                      type="number"
                      value={manualCompetitorInput.reviewCount}
                      onChange={(e) => setManualCompetitorInput(prev => ({ ...prev, reviewCount: e.target.value }))}
                      placeholder="1234"
                      className="w-full rounded px-3 py-2 text-sm focus:outline-none"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#A855F7';
                        e.target.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--input-border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAddManualCompetitor}
                  className="w-full text-white px-4 py-2 rounded-[9px] text-sm font-medium transition-colors"
                  style={{ backgroundColor: '#A855F7' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9333EA'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#A855F7'}
                >
                  Add Competitor
                </Button>
              </div>
            )}
          </div>

          {/* Scraping Notice */}
          <div className="p-4 rounded-[9px]" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h4 className="text-sm font-medium mb-1" style={{ color: '#60A5FA' }}>Amazon Product Scraping Active</h4>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  This feature scrapes Amazon product pages to extract listing data.
                </p>
                <ul className="text-xs mt-2 space-y-1 ml-4" style={{ color: 'var(--text-tertiary)' }}>
                  <li>• Works immediately - no API key needed</li>
                  <li>• May be blocked by Amazon's anti-bot measures (CAPTCHA)</li>
                  <li>• Use "Add Manually" as backup if scraping fails</li>
                  <li>• 2-second delay between requests to avoid rate limiting</li>
                </ul>
                <p className="text-xs mt-2" style={{ color: '#FBBF24' }}>
                  ⚠️ Note: Web scraping violates Amazon's Terms of Service. Use for educational/testing purposes only.
                </p>
              </div>
            </div>
          </div>

          {/* Display Fetched Competitor Data */}
          {competitorData.length > 0 && (
            <div className="mt-4 p-4 rounded-[9px]" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--accent-primary)' }}>
                    Competitor Data Loaded ({competitorData.length} competitor{competitorData.length !== 1 ? 's' : ''})
                  </h4>
                  <div className="space-y-3">
                    {competitorData.map((comp, idx) => (
                      <div key={idx} className="p-3 rounded" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium" style={{ color: '#A855F7' }}>
                            Competitor {idx + 1}: {comp.asin}
                          </span>
                          <div className="flex items-center gap-2">
                            {comp.rating > 0 && (
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {comp.rating}★ ({comp.reviewCount} reviews)
                              </span>
                            )}
                            <button
                              onClick={() => handleRemoveCompetitor(idx)}
                              className="text-xs px-2 py-1 rounded transition-colors"
                              style={{ color: 'var(--error)' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <p className="text-xs mb-1 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                          <strong>Title:</strong> {comp.title}
                        </p>
                        {comp.price > 0 && (
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <strong>Price:</strong> ${comp.price}
                          </p>
                        )}
                        {comp.bullets && comp.bullets.length > 0 && (
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {comp.bullets.length} bullet points loaded
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-3" style={{ color: 'var(--accent-primary)' }}>
                    ✨ AI Refine will now use REAL competitor data for authentic analysis
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Form Card */}
      <Card animationDelay={0.08}>
        <div className="space-y-6">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Product Title <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              value={listing.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              maxLength={200}
              placeholder="Enter your product title..."
              className="w-full rounded-[9px] px-4 py-3 focus:outline-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--text-primary)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--input-focus-border)';
                e.target.style.boxShadow = '0 0 0 3px var(--input-focus-shadow)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--input-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div className={`text-xs mt-1 ${getCounterColor(listing.title.length, 200)}`}>
              {listing.title.length}/200
            </div>
          </div>

          {/* Bullet Points (5x) */}
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index}>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Bullet Point {index + 1}
                {index < 3 && <span style={{ color: 'var(--error)' }}> *</span>}
              </label>
              <textarea
                value={listing.bullets[index]}
                onChange={(e) => handleBulletChange(index, e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Enter key feature or benefit..."
                className="w-full rounded-[9px] px-4 py-3 focus:outline-none resize-none"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--input-focus-border)';
                  e.target.style.boxShadow = '0 0 0 3px var(--input-focus-shadow)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--input-border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div className={`text-xs mt-1 ${getCounterColor(listing.bullets[index].length, 500)}`}>
                {listing.bullets[index].length}/500
              </div>
            </div>
          ))}

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Product Description <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <textarea
              value={listing.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              maxLength={2000}
              rows={6}
              placeholder="Enter detailed product description (minimum 100 characters)..."
              className="w-full rounded-[9px] px-4 py-3 focus:outline-none resize-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--text-primary)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--input-focus-border)';
                e.target.style.boxShadow = '0 0 0 3px var(--input-focus-shadow)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--input-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div className={`text-xs mt-1 ${getCounterColor(listing.description.length, 2000)}`}>
              {listing.description.length}/2000 {listing.description.length < 100 && '(minimum 100 characters)'}
            </div>
          </div>

          {/* Required Fields Note */}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            * Required fields (Title + at least 3 bullet points + Description with minimum 100 characters)
          </p>
        </div>
      </Card>

      {/* AI Suggestions Panel */}
      {suggestions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card title="AI Suggestions">
            <div className="space-y-6">
              {/* SEO Score */}
              <div className="flex items-center justify-between p-4 rounded-[9px]" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                <div>
                  <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>SEO Score</h3>
                  <p className="text-4xl font-[700]" style={{ color: 'var(--accent-primary)' }}>{suggestions.seoScore}/100</p>
                </div>
                <div className="text-5xl">
                  {suggestions.seoScore >= 80 ? '🎉' : suggestions.seoScore >= 60 ? '👍' : '⚠️'}
                </div>
              </div>

              {/* Competitor Insights */}
              {suggestions.competitorInsights && (
                <div className="p-4 rounded-[9px]" style={{ background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium flex items-center gap-2" style={{ color: '#C084FC' }}>
                      <span>🔍</span> Competitor Intelligence
                    </h3>
                    {suggestions.competitorInsights.dataSource === 'REAL_AMAZON_DATA' ? (
                      <span className="px-3 py-1 rounded-[4px] text-xs font-medium" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-primary)', border: '1px solid rgba(16, 185, 129, 0.5)' }}>
                        ✅ Real Amazon Data
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-[4px] text-xs font-medium" style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', border: '1px solid rgba(251, 191, 36, 0.5)' }}>
                        ⚠️ Generic Patterns
                      </span>
                    )}
                  </div>

                  {suggestions.competitorInsights.topKeywords && suggestions.competitorInsights.topKeywords.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Top Competitor Keywords:</h4>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.competitorInsights.topKeywords.map((keyword, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-[4px] text-xs" style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#C084FC' }}>
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.competitorInsights.competitorWeaknesses && suggestions.competitorInsights.competitorWeaknesses.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Competitor Weaknesses to Exploit:</h4>
                      <ul className="space-y-1">
                        {suggestions.competitorInsights.competitorWeaknesses.map((weakness, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-tertiary)' }}>
                            <span style={{ color: 'var(--error)' }}>•</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {suggestions.competitorInsights.differentiationStrategy && (
                    <div className="p-3 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--accent-primary)' }}>Differentiation Strategy:</h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{suggestions.competitorInsights.differentiationStrategy}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Suggestions List */}
              {suggestions.suggestions && suggestions.suggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Improvement Suggestions</h3>
                  <div className="space-y-3">
                    {suggestions.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-[9px] transition-colors"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--accent-primary)' }}>
                              {formatFieldName(suggestion.field)}
                            </h4>
                            <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>{suggestion.issue}</p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{suggestion.fix}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimized Content */}
              {suggestions.optimized && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Optimized Content</h3>
                    <button
                      onClick={applyAllSuggestions}
                      className="px-4 py-2 text-white rounded-[9px] text-sm font-medium transition-colors"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
                    >
                      Apply All
                    </button>
                  </div>

                  {/* Optimized Title */}
                  <div className="mb-4 p-4 rounded-[9px]" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Optimized Title</h4>
                      <button
                        onClick={() => applySuggestion('title', suggestions.optimized.title)}
                        className="px-3 py-1 rounded text-sm font-medium transition-colors"
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-primary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                          e.currentTarget.style.color = 'var(--accent-primary)';
                        }}
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{suggestions.optimized.title}</p>
                  </div>

                  {/* Optimized Bullets */}
                  {suggestions.optimized.bullets.map((bullet, index) => (
                    <div key={index} className="mb-4 p-4 rounded-[9px]" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Optimized Bullet {index + 1}</h4>
                        <button
                          onClick={() => applySuggestion(`bullet${index + 1}`, bullet)}
                          className="px-3 py-1 rounded text-sm font-medium transition-colors"
                          style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-primary)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                            e.currentTarget.style.color = 'var(--accent-primary)';
                          }}
                        >
                          Apply
                        </button>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{bullet}</p>
                    </div>
                  ))}

                  {/* Optimized Description */}
                  <div className="p-4 rounded-[9px]" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Optimized Description</h4>
                      <button
                        onClick={() => applySuggestion('description', suggestions.optimized.description)}
                        className="px-3 py-1 rounded text-sm font-medium transition-colors"
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-primary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                          e.currentTarget.style.color = 'var(--accent-primary)';
                        }}
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{suggestions.optimized.description}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ATOMIC ADDITION: Emerald Insight Cards (Iron Rule #6 - Additive only, never replaces existing UI) */}
      {ppcInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <EmeraldInsightList
            insights={ppcInsights}
            onDismiss={handleDismissInsight}
            onApply={handleApplyInsight}
          />
        </motion.div>
      )}
    </div>
  );
}