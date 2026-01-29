import { hasPlaceholderText, hasActionVerb } from './crawler.js';

/**
 * Calculate all UX scores from crawled data
 * Returns: { content, layout, cta, accessibility, total, flags, details }
 */
export function calculateScores(data) {
  const content = calculateContentScore(data);
  const layout = calculateLayoutScore(data);
  const cta = calculateCTAScore(data);
  const accessibility = calculateAccessibilityScore(data);
  
  // Total score (weighted average)
  // C=30%, L=25%, A=25%, R=20% (no Performance yet)
  const total = Math.round(
    (content.score * 0.30) +
    (layout.score * 0.25) +
    (cta.score * 0.25) +
    (accessibility.score * 0.20)
  );
  
  // Collect flags for AI analysis
  const flags = {
    multiple_h1: data.headings.h1.length > 1,
    no_h1: data.headings.h1.length === 0,
    low_contrast: accessibility.details.low_contrast_count > 0,
    no_primary_cta: cta.details.primary_cta_count === 0,
    low_text_ratio: parseFloat(data.text_stats.text_ratio) < 10,
    placeholder_text_detected: content.details.has_placeholder,
    missing_alt_text: accessibility.details.missing_alt_percentage > 50,
    too_many_ctas: cta.details.primary_cta_count > 5,
    small_font: data.css_summary.body_font_size_px < 14,
    no_meta_description: !data.meta_description
  };
  
  return {
    scores: {
      content: content.score,
      layout: layout.score,
      cta: cta.score,
      accessibility: accessibility.score,
      total
    },
    flags,
    details: {
      content: content.details,
      layout: layout.details,
      cta: cta.details,
      accessibility: accessibility.details
    }
  };
}

/**
 * Content Clarity Score (0-100)
 */
function calculateContentScore(data) {
  let score = 0;
  const details = {};
  
  // 1. H1 presence & quality (max 40 points)
  const h1 = data.headings.h1[0] || '';
  if (h1.length > 0) {
    score += 20;
    details.has_h1 = true;
    
    // Length check
    if (h1.length <= 90) {
      score += 10;
      details.h1_length_good = true;
    } else if (h1.length <= 120) {
      score += 5;
    }
    
    // Action verb check
    if (hasActionVerb(h1)) {
      score += 10;
      details.h1_has_action = true;
    }
  } else {
    details.has_h1 = false;
  }
  
  // 2. Meta description (max 15 points)
  if (data.meta_description) {
    score += 10;
    const len = data.meta_description.length;
    if (len >= 50 && len <= 160) {
      score += 5;
      details.meta_description_optimal = true;
    }
  }
  
  // 3. Text ratio (max 10 points)
  const textRatio = parseFloat(data.text_stats.text_ratio);
  if (textRatio >= 15) {
    score += 10;
    details.good_text_ratio = true;
  } else if (textRatio >= 5) {
    score += 5;
  }
  
  // 4. Placeholder detection (penalty -10)
  const allText = [
    data.title,
    data.meta_description,
    ...data.headings.h1,
    ...data.paragraphs.slice(0, 5)
  ].join(' ');
  
  details.has_placeholder = hasPlaceholderText(allText);
  if (details.has_placeholder) {
    score -= 10;
  }
  
  // 5. Paragraph count (max 10 points)
  const paraCount = data.paragraphs.length;
  if (paraCount >= 2 && paraCount <= 10) {
    score += 10;
    details.good_paragraph_count = true;
  } else if (paraCount === 1 || paraCount > 20) {
    score += 0;
  } else {
    score += 5;
  }
  
  // 6. Title check (max 15 points)
  if (data.title) {
    score += 10;
    if (data.title.length <= 70) {
      score += 5;
      details.title_length_good = true;
    }
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    details
  };
}

/**
 * Layout & Hierarchy Score (0-100)
 */
function calculateLayoutScore(data) {
  let score = 0;
  const details = {};
  
  // 1. Heading structure (max 35 points)
  const h1Count = data.headings.h1.length;
  const h2Count = data.headings.h2.length;
  const h3Count = data.headings.h3.length;
  
  // Exactly one H1
  if (h1Count === 1) {
    score += 15;
    details.single_h1 = true;
  } else if (h1Count === 0) {
    score += 0;
    details.no_h1 = true;
  } else {
    score += 5;
    details.multiple_h1 = true;
  }
  
  // Has H2/H3 for structure
  if (h2Count > 0 || h3Count > 0) {
    score += 15;
    details.has_subheadings = true;
  }
  
  // No heading jumps (simplified check)
  if (h1Count > 0 && h2Count > 0) {
    score += 5;
    details.proper_hierarchy = true;
  }
  
  // 2. CTA density (max 25 points)
  const totalCTAs = data.buttons.length + 
                    data.links.filter(l => hasActionVerb(l.text)).length;
  
  details.total_cta_count = totalCTAs;
  
  if (totalCTAs >= 1 && totalCTAs <= 3) {
    score += 15;
    details.optimal_cta_density = true;
  } else if (totalCTAs === 0) {
    score += 0;
  } else if (totalCTAs > 5) {
    score -= 10; // Penalty for clutter
    details.too_many_ctas = true;
  } else {
    score += 10;
  }
  
  // 3. Content organization (max 20 points)
  // Based on paragraph distribution
  if (data.paragraphs.length >= 3) {
    score += 10;
    details.has_content_blocks = true;
  }
  
  // Has forms (indicates structure)
  if (data.forms.length > 0 && data.forms.length <= 2) {
    score += 10;
    details.has_forms = true;
  }
  
  // 4. Image presence (max 20 points)
  const imageCount = data.images.length;
  if (imageCount >= 1 && imageCount <= 10) {
    score += 20;
    details.good_image_count = true;
  } else if (imageCount > 10) {
    score += 10;
    details.many_images = true;
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    details
  };
}

/**
 * Actionability / CTA Score (0-100)
 */
function calculateCTAScore(data) {
  let score = 0;
  const details = {};
  
  // Identify primary CTAs
  const allCTAs = [
    ...data.buttons.map(b => ({ text: b.text, type: 'button' })),
    ...data.links.filter(l => hasActionVerb(l.text)).map(l => ({ text: l.text, type: 'link' }))
  ];
  
  details.primary_cta_count = allCTAs.length;
  details.cta_examples = allCTAs.slice(0, 3).map(c => c.text);
  
  // 1. Primary CTA presence (max 20 points)
  if (allCTAs.length > 0) {
    score += 20;
    details.has_primary_cta = true;
  }
  
  // 2. CTA text quality (max 30 points)
  let qualityCTAs = 0;
  allCTAs.forEach(cta => {
    // Check if has action verb + object (more than 1 word)
    const words = cta.text.trim().split(/\s+/);
    if (words.length >= 2 && hasActionVerb(cta.text)) {
      qualityCTAs++;
    }
  });
  
  if (qualityCTAs > 0) {
    score += 15;
    details.has_quality_ctas = true;
    
    // Bonus if most CTAs are quality
    if (qualityCTAs >= allCTAs.length * 0.5) {
      score += 15;
      details.most_ctas_quality = true;
    }
  }
  
  // 3. CTA competition (max 30 points)
  if (allCTAs.length >= 1 && allCTAs.length <= 3) {
    score += 30;
    details.optimal_cta_count = true;
  } else if (allCTAs.length > 5) {
    score -= 10;
    details.too_many_competing_ctas = true;
  } else if (allCTAs.length === 4 || allCTAs.length === 5) {
    score += 15;
  }
  
  // 4. Button vs generic link (max 20 points)
  const buttonCount = data.buttons.length;
  if (buttonCount > 0) {
    score += 20;
    details.uses_buttons = true;
  } else if (allCTAs.length > 0) {
    score += 10; // Has CTAs but no buttons
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    details
  };
}

/**
 * Accessibility / WCAG-lite Score (0-100)
 */
function calculateAccessibilityScore(data) {
  let score = 0;
  const details = {};
  
  // 1. Contrast check (max 60 points)
  const colorPairs = data.css_summary.color_pairs_sample || [];
  let contrastChecks = 0;
  let passingContrast = 0;
  
  colorPairs.forEach(pair => {
    const ratio = calculateContrastRatio(pair.fg, pair.bg);
    contrastChecks++;
    
    // WCAG AA: 4.5:1 for normal text, 3:1 for large text
    if (ratio >= 4.5) {
      passingContrast++;
    }
  });
  
  details.contrast_checks = contrastChecks;
  details.passing_contrast = passingContrast;
  details.low_contrast_count = contrastChecks - passingContrast;
  
  if (contrastChecks > 0) {
    const passRate = passingContrast / contrastChecks;
    if (passRate >= 0.8) {
      score += 60;
      details.good_contrast = true;
    } else if (passRate >= 0.5) {
      score += 40;
    } else if (passRate >= 0.25) {
      score += 20;
    }
  } else {
    // No color data, give neutral score
    score += 30;
    details.no_contrast_data = true;
  }
  
  // 2. Alt text check (max 20 points)
  const totalImages = data.images.length;
  let imagesWithAlt = 0;
  
  data.images.forEach(img => {
    if (img.alt && img.alt.length > 0 && img.alt.toLowerCase() !== 'image') {
      imagesWithAlt++;
    }
  });
  
  details.total_images = totalImages;
  details.images_with_alt = imagesWithAlt;
  
  if (totalImages > 0) {
    const altRate = imagesWithAlt / totalImages;
    details.missing_alt_percentage = Math.round((1 - altRate) * 100);
    
    if (altRate >= 0.8) {
      score += 20;
      details.good_alt_coverage = true;
    } else if (altRate >= 0.5) {
      score += 10;
    }
  } else {
    score += 10; // No images, neutral score
    details.no_images = true;
  }
  
  // 3. Font size (max 10 points)
  const fontSize = data.css_summary.body_font_size_px;
  details.body_font_size = fontSize;
  
  if (fontSize >= 16) {
    score += 10;
    details.good_font_size = true;
  } else if (fontSize >= 14) {
    score += 5;
  }
  
  // 4. Form labels (max 10 points)
  let totalInputs = 0;
  let inputsWithLabels = 0;
  
  data.forms.forEach(form => {
    form.inputs.forEach(input => {
      totalInputs++;
      if (input.hasLabel) {
        inputsWithLabels++;
      }
    });
  });
  
  details.total_inputs = totalInputs;
  details.inputs_with_labels = inputsWithLabels;
  
  if (totalInputs > 0) {
    const labelRate = inputsWithLabels / totalInputs;
    if (labelRate >= 0.8) {
      score += 10;
      details.good_form_labels = true;
    } else if (labelRate >= 0.5) {
      score += 5;
    }
  } else {
    score += 5; // No forms, neutral
    details.no_forms = true;
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    details
  };
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 formula
 */
function calculateContrastRatio(color1, color2) {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 */
function getLuminance(color) {
  // Convert hex to RGB
  let r, g, b;
  
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    r = parseInt(hex.substr(0, 2), 16) / 255;
    g = parseInt(hex.substr(2, 2), 16) / 255;
    b = parseInt(hex.substr(4, 2), 16) / 255;
  } else {
    // Assume already RGB values
    return 0.5; // Neutral if can't parse
  }
  
  // Apply gamma correction
  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
