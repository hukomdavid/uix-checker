import * as cheerio from 'cheerio';

/**
 * Fetch and parse HTML from URL
 * Returns structured data for scoring
 */
export async function crawlURL(url) {
  try {
    // Validate URL
    const urlObj = new URL(url);
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UXAuditorBot/1.0)'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Limit HTML size (max 400KB)
    if (html.length > 400000) {
      return { error: 'Page too large (>400KB). Try another page.' };
    }
    
    // Parse with Cheerio
    const $ = cheerio.load(html);
    
    // Extract data
    const data = {
      url,
      title: $('title').text().trim() || '',
      meta_description: $('meta[name="description"]').attr('content') || '',
      
      // Headings
      headings: {
        h1: $('h1').map((i, el) => $(el).text().trim()).get(),
        h2: $('h2').map((i, el) => $(el).text().trim()).get(),
        h3: $('h3').map((i, el) => $(el).text().trim()).get()
      },
      
      // Text content
      paragraphs: $('p').map((i, el) => $(el).text().trim()).get().filter(p => p.length > 20),
      
      // Links & Buttons (CTAs)
      links: $('a').map((i, el) => ({
        text: $(el).text().trim(),
        href: $(el).attr('href') || ''
      })).get().filter(l => l.text.length > 0),
      
      buttons: $('button, input[type="submit"], a.btn, a.button, [role="button"]')
        .map((i, el) => ({
          text: $(el).text().trim() || $(el).attr('value') || '',
          type: $(el).is('button, [role="button"]') ? 'button' : 'submit'
        })).get().filter(b => b.text.length > 0),
      
      // Forms
      forms: $('form').map((i, el) => ({
        id: $(el).attr('id') || `form_${i}`,
        inputs: $(el).find('input, textarea, select').map((j, input) => ({
          type: $(input).attr('type') || 'text',
          name: $(input).attr('name') || '',
          label: $(input).closest('label').text().trim() || 
                 $(`label[for="${$(input).attr('id')}"]`).text().trim() || '',
          hasLabel: $(input).closest('label').length > 0 || 
                   $(`label[for="${$(input).attr('id')}"]`).length > 0
        })).get()
      })).get(),
      
      // Images
      images: $('img').map((i, el) => ({
        src: $(el).attr('src') || '',
        alt: $(el).attr('alt') || ''
      })).get(),
      
      // CSS Analysis (basic)
      css_summary: extractCSSInfo($, html),
      
      // Text stats
      text_stats: {
        total_text_length: $('body').text().trim().length,
        html_length: html.length,
        text_ratio: ($('body').text().trim().length / html.length * 100).toFixed(2)
      }
    };
    
    return data;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      return { error: 'Request timeout. Page took too long to load.' };
    }
    return { error: error.message };
  }
}

/**
 * Extract CSS information for color contrast analysis
 */
function extractCSSInfo($, html) {
  const colors = new Set();
  const colorPairs = [];
  
  // Extract inline styles
  $('[style]').each((i, el) => {
    const style = $(el).attr('style');
    const colorMatches = style.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g);
    if (colorMatches) {
      colorMatches.forEach(c => colors.add(c));
    }
  });
  
  // Common color pairs to check
  const bodyBg = extractColor($('body').css('background-color')) || '#ffffff';
  const bodyColor = extractColor($('body').css('color')) || '#000000';
  
  colorPairs.push({
    fg: bodyColor,
    bg: bodyBg,
    element: 'body'
  });
  
  // Check h1, p, button colors
  ['h1', 'p', 'button', 'a'].forEach(tag => {
    const $el = $(tag).first();
    if ($el.length) {
      const fg = extractColor($el.css('color')) || bodyColor;
      const bg = extractColor($el.css('background-color')) || bodyBg;
      if (fg && bg) {
        colorPairs.push({ fg, bg, element: tag });
      }
    }
  });
  
  // Extract font size
  const bodyFontSize = parseInt($('body').css('font-size')) || 16;
  
  return {
    body_font_size_px: bodyFontSize,
    colors: Array.from(colors).slice(0, 10),
    color_pairs_sample: colorPairs
  };
}

/**
 * Extract color from CSS string
 */
function extractColor(cssColor) {
  if (!cssColor) return null;
  
  // If already hex
  if (cssColor.startsWith('#')) return cssColor;
  
  // Convert rgb/rgba to hex (simplified)
  const rgbMatch = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  
  return null;
}

/**
 * Check for common placeholder text
 */
export function hasPlaceholderText(text) {
  const placeholders = [
    'lorem ipsum',
    'dolor sit amet',
    'consectetur adipiscing',
    'placeholder',
    'sample text',
    'dummy text'
  ];
  
  const lowerText = text.toLowerCase();
  return placeholders.some(p => lowerText.includes(p));
}

/**
 * Detect action verbs in CTA text
 */
export function hasActionVerb(text) {
  const actionVerbs = [
    'start', 'mulai', 'get', 'dapatkan', 'try', 'coba',
    'join', 'gabung', 'sign up', 'daftar', 'register',
    'download', 'unduh', 'buy', 'beli', 'subscribe',
    'learn', 'pelajari', 'discover', 'temukan', 'explore',
    'create', 'buat', 'build', 'bangun', 'boost', 'tingkatkan'
  ];
  
  const lowerText = text.toLowerCase();
  return actionVerbs.some(verb => lowerText.includes(verb));
}
