import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  getAnalyzerPrompt, 
  getStorytellerPrompt, 
  getRecommenderPrompt,
  parseJSONResponse 
} from './prompts.js';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Main orchestrator: Runs all 3 AI "brains" sequentially
 */
export async function runAIAnalysis(crawledData, scoringResult) {
  const { scores, flags, details } = scoringResult;
  
  try {
    // Brain 1: ANALYZER - Identify issues
    console.log('🧠 Running Analyzer...');
    const analysisData = {
      scores,
      flags,
      details,
      crawledData
    };
    
    const analysis = await callAnalyzer(analysisData);
    
    // Brain 2: STORYTELLER - Create narrative
    console.log('📖 Running Storyteller...');
    const storyData = {
      scores,
      issues: analysis.issues,
      strengths: analysis.strengths,
      crawledData
    };
    
    const narrative = await callStoryteller(storyData);
    
    // Brain 3: RECOMMENDER - Generate solutions
    console.log('💡 Running Recommender...');
    const recData = {
      issues: analysis.issues,
      scores,
      details,
      crawledData
    };
    
    const recommendations = await callRecommender(recData);
    
    return {
      analysis: {
        issues: analysis.issues,
        strengths: analysis.strengths
      },
      narrative,
      recommendations: recommendations.recommendations,
      success: true
    };
    
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw error;
  }
}

/**
 * Brain 1: ANALYZER
 * Input: scores, flags, details
 * Output: { issues: [], strengths: [] }
 */
async function callAnalyzer(data) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const prompt = getAnalyzerPrompt(data);
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const parsed = parseJSONResponse(text);
    
    // Validate structure
    if (!parsed.issues || !Array.isArray(parsed.issues)) {
      throw new Error('Invalid analyzer response structure');
    }
    
    return {
      issues: parsed.issues || [],
      strengths: parsed.strengths || []
    };
    
  } catch (error) {
    console.error('Analyzer error:', error);
    
    // Fallback: Generate basic issues from flags
    return generateFallbackAnalysis(data);
  }
}

/**
 * Brain 2: STORYTELLER
 * Input: scores, issues, strengths
 * Output: narrative string
 */
async function callStoryteller(data) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const prompt = getStorytellerPrompt(data);
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
    
  } catch (error) {
    console.error('Storyteller error:', error);
    
    // Fallback narrative
    return generateFallbackNarrative(data);
  }
}

/**
 * Brain 3: RECOMMENDER
 * Input: issues, scores, details
 * Output: { recommendations: [] }
 */
async function callRecommender(data) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const prompt = getRecommenderPrompt(data);
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const parsed = parseJSONResponse(text);
    
    // Validate and sort by priority
    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('Invalid recommender response structure');
    }
    
    // Calculate priority if not provided
    parsed.recommendations.forEach(rec => {
      if (!rec.priority) {
        const impactScore = rec.impact === 'high' ? 3 : rec.impact === 'medium' ? 2 : 1;
        const effortScore = rec.effort === 'high' ? 3 : rec.effort === 'medium' ? 2 : 1;
        rec.priority = impactScore - effortScore;
      }
    });
    
    // Sort by priority
    parsed.recommendations.sort((a, b) => b.priority - a.priority);
    
    return {
      recommendations: parsed.recommendations
    };
    
  } catch (error) {
    console.error('Recommender error:', error);
    
    // Fallback recommendations
    return generateFallbackRecommendations(data);
  }
}

/**
 * FALLBACK: Generate basic analysis from flags
 */
function generateFallbackAnalysis(data) {
  const { flags, scores } = data;
  const issues = [];
  const strengths = [];
  
  // Generate issues from flags
  if (flags.no_h1) {
    issues.push({
      category: 'content',
      severity: 'critical',
      description: 'Halaman tidak memiliki heading utama (H1) yang jelas',
      evidence: 'H1 count = 0'
    });
  }
  
  if (flags.multiple_h1) {
    issues.push({
      category: 'layout',
      severity: 'major',
      description: 'Terdapat lebih dari satu H1, dapat membingungkan struktur halaman',
      evidence: 'Multiple H1 detected'
    });
  }
  
  if (flags.no_primary_cta) {
    issues.push({
      category: 'cta',
      severity: 'critical',
      description: 'Tidak ada call-to-action (CTA) utama yang jelas',
      evidence: 'CTA count = 0'
    });
  }
  
  if (flags.low_contrast) {
    issues.push({
      category: 'accessibility',
      severity: 'major',
      description: 'Kontras warna teks kurang memenuhi standar aksesibilitas',
      evidence: 'Color contrast below WCAG standards'
    });
  }
  
  if (flags.missing_alt_text) {
    issues.push({
      category: 'accessibility',
      severity: 'major',
      description: 'Sebagian besar gambar tidak memiliki teks alternatif',
      evidence: '>50% images missing alt text'
    });
  }
  
  // Generate strengths from good scores
  if (scores.content >= 80) {
    strengths.push({
      category: 'content',
      description: 'Konten terstruktur dengan baik dan mudah dipahami'
    });
  }
  
  if (scores.cta >= 80) {
    strengths.push({
      category: 'cta',
      description: 'Call-to-action jelas dan mudah ditemukan'
    });
  }
  
  return { issues, strengths };
}

/**
 * FALLBACK: Generate basic narrative
 */
function generateFallbackNarrative(data) {
  const { scores, issues } = data;
  const score = scores.total;
  
  let narrative = '';
  
  if (score >= 80) {
    narrative = 'Website Anda memiliki fondasi UX yang baik! ';
  } else if (score >= 60) {
    narrative = 'Website Anda memiliki beberapa aspek UX yang solid, namun ada area yang perlu diperbaiki. ';
  } else {
    narrative = 'Website Anda memerlukan beberapa perbaikan UX untuk meningkatkan pengalaman pengguna. ';
  }
  
  narrative += `\n\nSkor keseluruhan: ${score}/100\n\n`;
  
  if (issues.length > 0) {
    narrative += `Kami menemukan ${issues.length} area yang perlu perhatian, `;
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    if (criticalCount > 0) {
      narrative += `termasuk ${criticalCount} masalah kritis yang sebaiknya segera ditangani. `;
    } else {
      narrative += 'yang dapat ditingkatkan untuk memberikan pengalaman yang lebih baik. ';
    }
  }
  
  narrative += '\n\nDengan melakukan perbaikan yang kami rekomendasikan, website Anda dapat meningkatkan kepuasan pengguna dan mencapai tujuan bisnis dengan lebih efektif.';
  
  return narrative;
}

/**
 * FALLBACK: Generate basic recommendations
 */
function generateFallbackRecommendations(data) {
  const { issues } = data;
  const recommendations = [];
  
  issues.forEach(issue => {
    let rec = {
      category: issue.category,
      impact: issue.severity === 'critical' ? 'high' : issue.severity === 'major' ? 'medium' : 'low',
      effort: 'medium'
    };
    
    switch (issue.category) {
      case 'content':
        rec.title = 'Perbaiki Struktur Konten';
        rec.description = 'Pastikan setiap halaman memiliki heading utama (H1) yang jelas dan deskriptif.';
        rec.effort = 'low';
        break;
      case 'layout':
        rec.title = 'Tingkatkan Hierarki Visual';
        rec.description = 'Gunakan struktur heading yang konsisten (H1, H2, H3) untuk membantu pengguna memahami organisasi konten.';
        break;
      case 'cta':
        rec.title = 'Tambahkan Call-to-Action Jelas';
        rec.description = 'Buat tombol CTA yang menonjol dengan teks aksi yang spesifik (mis: "Mulai Gratis", "Hubungi Kami").';
        rec.effort = 'low';
        break;
      case 'accessibility':
        rec.title = 'Tingkatkan Aksesibilitas';
        rec.description = 'Pastikan kontras warna memenuhi standar WCAG dan semua gambar memiliki teks alternatif.';
        break;
    }
    
    const impactScore = rec.impact === 'high' ? 3 : rec.impact === 'medium' ? 2 : 1;
    const effortScore = rec.effort === 'high' ? 3 : rec.effort === 'medium' ? 2 : 1;
    rec.priority = impactScore - effortScore;
    
    recommendations.push(rec);
  });
  
  // Remove duplicates and sort
  const unique = recommendations.filter((rec, index, self) =>
    index === self.findIndex(r => r.title === rec.title)
  );
  
  unique.sort((a, b) => b.priority - a.priority);
  
  return { recommendations: unique };
}
