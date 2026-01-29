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
 * FALLBACK: Generate basic analysis from flags and scores
 */
function generateFallbackAnalysis(data) {
  const { flags, scores, details } = data;
  const issues = [];
  const strengths = [];
  
  // CONTENT ISSUES
  if (flags.no_h1 || scores.content < 70) {
    if (flags.no_h1) {
      issues.push({
        category: 'content',
        severity: 'critical',
        description: 'Halaman tidak memiliki heading utama (H1) yang jelas',
        evidence: 'H1 count = 0'
      });
    }
    
    if (flags.no_meta_description) {
      issues.push({
        category: 'content',
        severity: 'major',
        description: 'Meta description tidak ditemukan, penting untuk SEO',
        evidence: 'Meta description missing'
      });
    }
    
    if (flags.low_text_ratio) {
      issues.push({
        category: 'content',
        severity: 'minor',
        description: 'Rasio teks terhadap HTML terlalu rendah, halaman mungkin terlalu berat',
        evidence: `Text ratio < 10%`
      });
    }
    
    if (flags.placeholder_text_detected) {
      issues.push({
        category: 'content',
        severity: 'major',
        description: 'Terdeteksi teks placeholder (lorem ipsum), website belum production-ready',
        evidence: 'Placeholder text found'
      });
    }
  }
  
  // LAYOUT ISSUES
  if (flags.multiple_h1 || scores.layout < 70) {
    if (flags.multiple_h1) {
      issues.push({
        category: 'layout',
        severity: 'major',
        description: 'Terdapat lebih dari satu H1, dapat membingungkan struktur halaman',
        evidence: 'Multiple H1 detected'
      });
    }
    
    if (flags.too_many_ctas) {
      issues.push({
        category: 'layout',
        severity: 'minor',
        description: 'Terlalu banyak CTA yang bersaing, dapat membingungkan user',
        evidence: '>5 CTAs detected'
      });
    }
    
    if (scores.layout < 50) {
      issues.push({
        category: 'layout',
        severity: 'major',
        description: 'Hierarki visual tidak jelas, sulit bagi user untuk memindai konten',
        evidence: `Layout score: ${scores.layout}/100`
      });
    }
  }
  
  // CTA ISSUES
  if (flags.no_primary_cta || scores.cta < 70) {
    if (flags.no_primary_cta) {
      issues.push({
        category: 'cta',
        severity: 'critical',
        description: 'Tidak ada call-to-action (CTA) utama yang jelas',
        evidence: 'CTA count = 0'
      });
    } else if (scores.cta < 50) {
      issues.push({
        category: 'cta',
        severity: 'major',
        description: 'CTA tidak cukup jelas atau tidak mudah ditemukan',
        evidence: `CTA score: ${scores.cta}/100`
      });
    }
  }
  
  // ACCESSIBILITY ISSUES
  if (flags.low_contrast || flags.missing_alt_text || flags.small_font || scores.accessibility < 70) {
    if (flags.low_contrast) {
      issues.push({
        category: 'accessibility',
        severity: 'major',
        description: 'Kontras warna teks kurang memenuhi standar aksesibilitas WCAG',
        evidence: 'Color contrast below 4.5:1 ratio'
      });
    }
    
    if (flags.missing_alt_text) {
      issues.push({
        category: 'accessibility',
        severity: 'major',
        description: 'Sebagian besar gambar tidak memiliki teks alternatif (alt text)',
        evidence: '>50% images missing alt text'
      });
    }
    
    if (flags.small_font) {
      issues.push({
        category: 'accessibility',
        severity: 'minor',
        description: 'Ukuran font terlalu kecil, sulit dibaca terutama di mobile',
        evidence: 'Body font size < 14px'
      });
    }
  }
  
  // GENERAL LOW SCORE ISSUES
  if (scores.content < 50) {
    issues.push({
      category: 'content',
      severity: 'critical',
      description: 'Struktur konten sangat lemah, perlu perbaikan menyeluruh',
      evidence: `Content score: ${scores.content}/100`
    });
  }
  
  if (scores.layout < 40) {
    issues.push({
      category: 'layout',
      severity: 'critical',
      description: 'Layout dan hierarki perlu redesign untuk meningkatkan usability',
      evidence: `Layout score: ${scores.layout}/100`
    });
  }
  
  if (scores.cta < 40) {
    issues.push({
      category: 'cta',
      severity: 'critical',
      description: 'Tidak ada path yang jelas untuk user mencapai tujuan',
      evidence: `CTA score: ${scores.cta}/100`
    });
  }
  
  // Generate strengths from good scores
  if (scores.content >= 80) {
    strengths.push({
      category: 'content',
      description: 'Konten terstruktur dengan baik dan mudah dipahami'
    });
  }
  
  if (scores.layout >= 80) {
    strengths.push({
      category: 'layout',
      description: 'Hierarki visual jelas dan membantu user memindai konten'
    });
  }
  
  if (scores.cta >= 80) {
    strengths.push({
      category: 'cta',
      description: 'Call-to-action jelas dan mudah ditemukan'
    });
  }
  
  if (scores.accessibility >= 80) {
    strengths.push({
      category: 'accessibility',
      description: 'Website memenuhi standar aksesibilitas dasar dengan baik'
    });
  }
  
  // Always have at least one strength
  if (strengths.length === 0) {
    const highestScore = Math.max(scores.content, scores.layout, scores.cta, scores.accessibility);
    if (highestScore >= 60) {
      strengths.push({
        category: 'general',
        description: 'Beberapa aspek UX sudah cukup baik sebagai fondasi untuk perbaikan'
      });
    }
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
  
  // Opening based on score
  if (score >= 80) {
    narrative = '🎉 Website Anda memiliki fondasi UX yang solid! ';
  } else if (score >= 60) {
    narrative = 'Website Anda memiliki beberapa aspek UX yang baik, namun ada beberapa area yang perlu diperbaiki untuk meningkatkan pengalaman pengguna. ';
  } else if (score >= 40) {
    narrative = 'Website Anda memerlukan perbaikan UX yang cukup signifikan untuk meningkatkan kepuasan dan konversi pengguna. ';
  } else {
    narrative = '⚠️ Website Anda memerlukan perhatian serius pada aspek UX. Banyak area yang perlu diperbaiki untuk memberikan pengalaman yang baik kepada pengguna. ';
  }
  
  narrative += `\n\nSkor keseluruhan UX: ${score}/100\n\n`;
  
  // Breakdown by category
  const categoryAnalysis = [];
  
  if (scores.content < 70) {
    categoryAnalysis.push(`📝 **Content (${scores.content}/100)**: Struktur konten perlu diperbaiki${scores.content < 50 ? ' secara menyeluruh' : ''}`);
  }
  
  if (scores.layout < 70) {
    categoryAnalysis.push(`🎨 **Layout (${scores.layout}/100)**: Hierarki visual kurang jelas${scores.layout < 50 ? ', perlu redesign' : ''}`);
  }
  
  if (scores.cta < 70) {
    categoryAnalysis.push(`🎯 **CTA (${scores.cta}/100)**: Call-to-action tidak cukup efektif${scores.cta < 50 ? ', user kesulitan mencapai tujuan' : ''}`);
  }
  
  if (scores.accessibility < 70) {
    categoryAnalysis.push(`♿ **Accessibility (${scores.accessibility}/100)**: Standar aksesibilitas belum terpenuhi dengan baik`);
  }
  
  if (categoryAnalysis.length > 0) {
    narrative += 'Area yang memerlukan perhatian:\n' + categoryAnalysis.join('\n') + '\n\n';
  }
  
  // Issues summary
  if (issues.length > 0) {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const majorCount = issues.filter(i => i.severity === 'major').length;
    
    narrative += `Kami menemukan **${issues.length} masalah** yang perlu ditangani`;
    
    if (criticalCount > 0) {
      narrative += `, termasuk **${criticalCount} masalah kritis** yang sebaiknya segera diperbaiki`;
    } else if (majorCount > 0) {
      narrative += `, dengan **${majorCount} masalah mayor** yang perlu perhatian`;
    }
    
    narrative += '. ';
  }
  
  // Positive note and encouragement
  narrative += '\n\nDengan melakukan perbaikan yang kami rekomendasikan secara bertahap, website Anda dapat meningkatkan kepuasan pengguna dan mencapai tujuan bisnis dengan lebih efektif. ';
  
  // Score-based closing
  if (score >= 60) {
    narrative += 'Anda sudah memiliki fondasi yang cukup baik untuk dikembangkan lebih lanjut! 💪';
  } else {
    narrative += 'Mulai dari perbaikan yang paling kritis, lalu lanjutkan ke area lainnya. 🚀';
  }
  
  return narrative;
}

/**
 * FALLBACK: Generate basic recommendations
 */
function generateFallbackRecommendations(data) {
  const { issues, scores, details } = data;
  const recommendations = [];
  
  // Group issues by category for better recommendations
  const issuesByCategory = {
    content: issues.filter(i => i.category === 'content'),
    layout: issues.filter(i => i.category === 'layout'),
    cta: issues.filter(i => i.category === 'cta'),
    accessibility: issues.filter(i => i.category === 'accessibility')
  };
  
  // CONTENT RECOMMENDATIONS
  if (issuesByCategory.content.length > 0 || scores.content < 70) {
    if (details.content && !details.content.has_h1) {
      recommendations.push({
        title: 'Tambahkan Heading Utama (H1)',
        description: 'Setiap halaman harus memiliki satu H1 yang jelas dan deskriptif yang menjelaskan tujuan halaman kepada user dan search engine.',
        category: 'content',
        impact: 'high',
        effort: 'low',
        priority: 2
      });
    }
    
    if (scores.content < 60) {
      recommendations.push({
        title: 'Perbaiki Struktur Konten',
        description: 'Gunakan heading hierarkis (H1, H2, H3) untuk mengorganisir konten. Pastikan meta description ada dan informatif (50-160 karakter).',
        category: 'content',
        impact: 'high',
        effort: 'medium',
        priority: 1
      });
    }
  }
  
  // LAYOUT RECOMMENDATIONS
  if (issuesByCategory.layout.length > 0 || scores.layout < 70) {
    if (details.layout && details.layout.multiple_h1) {
      recommendations.push({
        title: 'Gunakan Hanya Satu H1',
        description: 'Hapus H1 duplikat dan gunakan H2/H3 untuk sub-heading. Ini membantu struktur halaman lebih jelas.',
        category: 'layout',
        impact: 'medium',
        effort: 'low',
        priority: 1
      });
    }
    
    if (scores.layout < 60) {
      recommendations.push({
        title: 'Tingkatkan Hierarki Visual',
        description: 'Gunakan ukuran font, warna, dan spacing yang berbeda untuk membuat hierarki visual yang jelas. Prioritaskan konten penting di atas fold.',
        category: 'layout',
        impact: 'high',
        effort: 'medium',
        priority: 1
      });
    }
  }
  
  // CTA RECOMMENDATIONS
  if (issuesByCategory.cta.length > 0 || scores.cta < 70) {
    if (details.cta && details.cta.primary_cta_count === 0) {
      recommendations.push({
        title: 'Tambahkan Call-to-Action Utama',
        description: 'Buat tombol CTA yang menonjol dengan teks aksi yang spesifik (contoh: "Mulai Gratis", "Daftar Sekarang"). Tempatkan di posisi yang mudah dilihat.',
        category: 'cta',
        impact: 'high',
        effort: 'low',
        priority: 2
      });
    }
    
    if (scores.cta < 60) {
      recommendations.push({
        title: 'Optimalkan CTA',
        description: 'Gunakan kata kerja yang jelas, buat tombol kontras dengan background, dan batasi jumlah CTA per halaman (maksimal 2-3 CTA utama).',
        category: 'cta',
        impact: 'high',
        effort: 'low',
        priority: 2
      });
    }
  }
  
  // ACCESSIBILITY RECOMMENDATIONS
  if (issuesByCategory.accessibility.length > 0 || scores.accessibility < 70) {
    if (details.accessibility && details.accessibility.low_contrast_count > 0) {
      recommendations.push({
        title: 'Perbaiki Kontras Warna',
        description: 'Pastikan rasio kontras antara teks dan background minimal 4.5:1 untuk teks normal dan 3:1 untuk teks besar (sesuai WCAG AA).',
        category: 'accessibility',
        impact: 'high',
        effort: 'medium',
        priority: 1
      });
    }
    
    if (details.accessibility && details.accessibility.missing_alt_percentage > 50) {
      recommendations.push({
        title: 'Tambahkan Alt Text pada Gambar',
        description: 'Semua gambar informatif harus memiliki alt text yang menjelaskan konten gambar untuk screen reader dan SEO.',
        category: 'accessibility',
        impact: 'medium',
        effort: 'low',
        priority: 1
      });
    }
    
    if (details.accessibility && details.accessibility.body_font_size < 14) {
      recommendations.push({
        title: 'Tingkatkan Ukuran Font',
        description: 'Gunakan minimal 16px untuk body text agar mudah dibaca, terutama di perangkat mobile.',
        category: 'accessibility',
        impact: 'medium',
        effort: 'low',
        priority: 1
      });
    }
  }
  
  // GENERAL RECOMMENDATIONS based on low scores
  if (scores.content < 50 && recommendations.filter(r => r.category === 'content').length === 0) {
    recommendations.push({
      title: 'Audit Konten Menyeluruh',
      description: 'Lakukan review lengkap struktur konten: heading, paragraf, meta tags. Pastikan konten relevan dan mudah dipindai.',
      category: 'content',
      impact: 'high',
      effort: 'high',
      priority: 0
    });
  }
  
  if (scores.layout < 50 && recommendations.filter(r => r.category === 'layout').length === 0) {
    recommendations.push({
      title: 'Redesign Layout',
      description: 'Pertimbangkan redesign layout untuk meningkatkan usability: gunakan grid system, white space yang cukup, dan visual hierarchy yang jelas.',
      category: 'layout',
      impact: 'high',
      effort: 'high',
      priority: 0
    });
  }
  
  // Always add at least one general recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Lakukan User Testing',
      description: 'Meskipun tidak ada masalah kritis, selalu ada ruang untuk perbaikan. Lakukan user testing untuk mendapat feedback langsung.',
      category: 'general',
      impact: 'medium',
      effort: 'medium',
      priority: 0
    });
  }
  
  // Sort by priority (highest first)
  recommendations.sort((a, b) => b.priority - a.priority);
  
  return { recommendations };
}
