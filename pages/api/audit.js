import { crawlURL } from '../../lib/crawler.js';
import { calculateScores } from '../../lib/scorer.js';
import { runAIAnalysis } from '../../lib/gemini.js';
import { getCombinedPageSpeedScore } from '../../lib/pagespeed.js';

/**
 * POST /api/audit
 * Main endpoint to run UX audit
 * 
 * Body: { url: string }
 * Returns: Full audit result
 */
export default async function handler(req, res) {
  // CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { url } = req.body;
    
    // Validate URL
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    let validUrl;
    try {
      validUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    console.log(`🔍 Starting audit for: ${url}`);
    
    // STEP 1: Crawl & Extract Data
    console.log('⬇️  Step 1: Crawling...');
    const crawledData = await crawlURL(url);
    
    if (crawledData.error) {
      return res.status(400).json({ 
        error: crawledData.error,
        step: 'crawling'
      });
    }
    
    // STEP 2: Calculate Scores (Pure Math - Fast!)
    console.log('🔢 Step 2: Calculating scores...');
    const scoringResult = calculateScores(crawledData);
    
    // STEP 3: PageSpeed (Optional, non-blocking)
    console.log('⚡ Step 3: Fetching PageSpeed (optional)...');
    let pageSpeedResult = null;
    try {
      // Try to get PageSpeed, but don't fail if it errors
      pageSpeedResult = await getCombinedPageSpeedScore(url);
      if (pageSpeedResult) {
        console.log('✅ PageSpeed data retrieved');
      } else {
        console.log('⚠️  PageSpeed not available, continuing without it');
      }
    } catch (error) {
      console.log('⚠️  PageSpeed fetch failed, continuing without it:', error.message);
    }
    
    // STEP 4: AI Analysis (3 brains: Analyzer, Storyteller, Recommender)
    console.log('🤖 Step 4: Running AI analysis...');
    const aiResult = await runAIAnalysis(crawledData, scoringResult);
    
    // Combine everything
    const finalResult = {
      url: crawledData.url,
      title: crawledData.title,
      timestamp: new Date().toISOString(),
      
      // Scores
      scores: scoringResult.scores,
      
      // PageSpeed (if available)
      performance: pageSpeedResult ? {
        overall: pageSpeedResult.overallScore,
        mobile: pageSpeedResult.mobile?.scores,
        desktop: pageSpeedResult.desktop?.scores,
        metrics: pageSpeedResult.mobile?.metrics || pageSpeedResult.desktop?.metrics,
        opportunities: pageSpeedResult.mobile?.opportunities || pageSpeedResult.desktop?.opportunities || []
      } : null,
      
      // AI Results
      analysis: aiResult.analysis,
      narrative: aiResult.narrative,
      recommendations: aiResult.recommendations,
      
      // Metadata
      metadata: {
        h1: crawledData.headings.h1[0] || null,
        meta_description: crawledData.meta_description,
        image_count: crawledData.images.length,
        cta_count: scoringResult.details.cta.primary_cta_count,
        form_count: crawledData.forms.length
      }
    };
    
    console.log('✅ Audit complete!');
    
    return res.status(200).json(finalResult);
    
  } catch (error) {
    console.error('Audit error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      step: 'unknown'
    });
  }
}

/**
 * Config to allow larger payloads if needed
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
};
