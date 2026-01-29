/**
 * PageSpeed Insights API Integration
 * Get performance metrics from Google PageSpeed
 */

const PAGESPEED_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

/**
 * Fetch PageSpeed scores for a URL
 * @param {string} url - URL to analyze
 * @param {string} strategy - 'mobile' or 'desktop'
 * @returns {Promise<Object>} PageSpeed results
 */
export async function getPageSpeedScore(url, strategy = 'mobile') {
  try {
    // Build API URL
    const apiUrl = new URL(PAGESPEED_API_URL);
    apiUrl.searchParams.append('url', url);
    apiUrl.searchParams.append('strategy', strategy);
    apiUrl.searchParams.append('category', 'performance');
    apiUrl.searchParams.append('category', 'accessibility');
    apiUrl.searchParams.append('category', 'best-practices');
    apiUrl.searchParams.append('category', 'seo');
    
    // Add API key if available (optional for basic use)
    if (process.env.PAGESPEED_API_KEY) {
      apiUrl.searchParams.append('key', process.env.PAGESPEED_API_KEY);
    }
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(apiUrl.toString(), {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract relevant scores
    return parsePageSpeedData(data);
    
  } catch (error) {
    console.error('PageSpeed fetch error:', error);
    
    // Return null on error (graceful fallback)
    return null;
  }
}

/**
 * Parse PageSpeed API response
 */
function parsePageSpeedData(data) {
  const lighthouseResult = data.lighthouseResult;
  const categories = lighthouseResult.categories;
  
  // Extract scores (0-1 scale, convert to 0-100)
  const scores = {
    performance: Math.round(categories.performance.score * 100),
    accessibility: Math.round(categories.accessibility.score * 100),
    bestPractices: Math.round(categories['best-practices'].score * 100),
    seo: Math.round(categories.seo.score * 100),
  };
  
  // Extract key metrics
  const audits = lighthouseResult.audits;
  const metrics = {
    fcp: audits['first-contentful-paint']?.numericValue || 0,
    lcp: audits['largest-contentful-paint']?.numericValue || 0,
    cls: audits['cumulative-layout-shift']?.numericValue || 0,
    tbt: audits['total-blocking-time']?.numericValue || 0,
    si: audits['speed-index']?.numericValue || 0,
  };
  
  // Extract top opportunities (improvements)
  const opportunities = [];
  const opportunityAudits = [
    'render-blocking-resources',
    'unused-css-rules',
    'unused-javascript',
    'modern-image-formats',
    'offscreen-images',
    'unminified-css',
    'unminified-javascript'
  ];
  
  opportunityAudits.forEach(auditId => {
    const audit = audits[auditId];
    if (audit && audit.score !== null && audit.score < 1) {
      opportunities.push({
        id: auditId,
        title: audit.title,
        description: audit.description,
        savings: audit.numericValue || 0
      });
    }
  });
  
  // Sort by potential savings
  opportunities.sort((a, b) => b.savings - a.savings);
  
  return {
    scores,
    metrics,
    opportunities: opportunities.slice(0, 3), // Top 3 opportunities
    strategy: data.analysisUTCTimestamp
  };
}

/**
 * Get combined score (mobile + desktop average)
 */
export async function getCombinedPageSpeedScore(url) {
  try {
    // Fetch both mobile and desktop (parallel)
    const [mobileResult, desktopResult] = await Promise.allSettled([
      getPageSpeedScore(url, 'mobile'),
      getPageSpeedScore(url, 'desktop')
    ]);
    
    const mobile = mobileResult.status === 'fulfilled' ? mobileResult.value : null;
    const desktop = desktopResult.status === 'fulfilled' ? desktopResult.value : null;
    
    // If both failed, return null
    if (!mobile && !desktop) {
      return null;
    }
    
    // Calculate average scores
    const avgScores = {
      performance: average(mobile?.scores.performance, desktop?.scores.performance),
      accessibility: average(mobile?.scores.accessibility, desktop?.scores.accessibility),
      bestPractices: average(mobile?.scores.bestPractices, desktop?.scores.bestPractices),
      seo: average(mobile?.scores.seo, desktop?.scores.seo),
    };
    
    // Overall performance score (weighted)
    const overallScore = Math.round(avgScores.performance);
    
    return {
      mobile,
      desktop,
      average: avgScores,
      overallScore,
      hasBothResults: mobile && desktop
    };
    
  } catch (error) {
    console.error('Combined PageSpeed error:', error);
    return null;
  }
}

/**
 * Helper: Calculate average (handles null)
 */
function average(...values) {
  const validValues = values.filter(v => v !== null && v !== undefined);
  if (validValues.length === 0) return null;
  return Math.round(validValues.reduce((a, b) => a + b, 0) / validValues.length);
}

/**
 * Convert milliseconds to human readable
 */
export function formatMetric(value, type) {
  if (!value) return 'N/A';
  
  switch(type) {
    case 'time':
      return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(2)}s`;
    case 'cls':
      return value.toFixed(3);
    default:
      return value.toString();
  }
}

/**
 * Get performance rating label
 */
export function getPerformanceLabel(score) {
  if (score >= 90) return { label: 'Excellent', color: 'green' };
  if (score >= 50) return { label: 'Needs Improvement', color: 'orange' };
  return { label: 'Poor', color: 'red' };
}
