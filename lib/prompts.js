/**
 * Prompt templates for Gemini AI
 * 3 specialized "brains": Analyzer, Storyteller, Recommender
 */

/**
 * ANALYZER: Identify issues from scores and flags
 */
export function getAnalyzerPrompt(data) {
  const { scores, flags, details, crawledData } = data;
  
  return `You are a UX Analysis Expert. Analyze this website audit data and identify specific issues.

## Website Data:
- URL: ${crawledData.url}
- Title: ${crawledData.title}
- H1: ${crawledData.headings.h1[0] || 'None'}

## Scores (0-100):
- Content Clarity: ${scores.content}
- Layout & Hierarchy: ${scores.layout}
- Actionability/CTA: ${scores.cta}
- Accessibility (WCAG-lite): ${scores.accessibility}
- TOTAL: ${scores.total}

## Detected Flags:
${Object.entries(flags).filter(([k, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## Score Details:
Content: ${JSON.stringify(details.content, null, 2)}
Layout: ${JSON.stringify(details.layout, null, 2)}
CTA: ${JSON.stringify(details.cta, null, 2)}
Accessibility: ${JSON.stringify(details.accessibility, null, 2)}

## Your Task:
Identify 5-10 specific UX issues based on:
1. Low scores (below 70)
2. Active flags
3. Missing elements or poor practices

For each issue, provide:
- category: "content" | "layout" | "cta" | "accessibility"
- severity: "critical" | "major" | "minor"
- description: Brief, specific problem (1 sentence)
- evidence: What data shows this (reference scores/flags)

Also identify 2-3 strengths/good practices.

Return ONLY valid JSON (no markdown, no explanation):
{
  "issues": [
    {
      "category": "...",
      "severity": "...",
      "description": "...",
      "evidence": "..."
    }
  ],
  "strengths": [
    {
      "category": "...",
      "description": "..."
    }
  ]
}`;
}

/**
 * STORYTELLER: Create narrative overview
 */
export function getStorytellerPrompt(data) {
  const { scores, issues, strengths, crawledData } = data;
  
  return `You are a UX Storyteller. Create a clear, friendly narrative overview for non-technical users.

## Website:
- ${crawledData.title} (${crawledData.url})

## Overall Score: ${scores.total}/100
- Content: ${scores.content}/100
- Layout: ${scores.layout}/100
- CTA: ${scores.cta}/100
- Accessibility: ${scores.accessibility}/100

## Issues Found:
${issues.map(i => `- [${i.severity}] ${i.description}`).join('\n')}

## Strengths:
${strengths.map(s => `- ${s.description}`).join('\n')}

## Your Task:
Write a 3-4 paragraph overview in Indonesian that:
1. Starts with the overall impression (good/needs improvement)
2. Highlights the main problems affecting user experience
3. Mentions what's working well
4. Ends with encouragement and next steps

Tone: Professional but friendly, empathetic, solution-focused.
Avoid jargon. Make it actionable.

Return ONLY the narrative text (no JSON, no markdown formatting):`;
}

/**
 * RECOMMENDER: Generate prioritized recommendations
 */
export function getRecommenderPrompt(data) {
  const { issues, scores, details, crawledData } = data;
  
  return `You are a UX Solutions Architect. Create actionable recommendations to fix identified issues.

## Website Context:
- URL: ${crawledData.url}
- Current Score: ${scores.total}/100

## Issues to Address:
${issues.map((i, idx) => `${idx + 1}. [${i.severity}] ${i.category}: ${i.description}`).join('\n')}

## Current State Details:
- H1 count: ${crawledData.headings.h1.length}
- CTA count: ${details.cta.primary_cta_count}
- Images with alt: ${details.accessibility.images_with_alt}/${details.accessibility.total_images}
- Font size: ${details.accessibility.body_font_size}px
- Form inputs with labels: ${details.accessibility.inputs_with_labels}/${details.accessibility.total_inputs}

## Your Task:
Generate 5-8 prioritized recommendations. For each:
- title: Clear action to take (4-8 words)
- description: Specific how-to (1-2 sentences, in Indonesian)
- category: Which area it fixes
- impact: "high" | "medium" | "low" (business/user impact)
- effort: "low" | "medium" | "high" (implementation difficulty)
- priority: Calculate as (impact score - effort score), where high=3, medium=2, low=1

Focus on:
1. Critical/major issues first
2. Quick wins (high impact, low effort)
3. Specific, actionable advice (not generic "improve UX")

Return ONLY valid JSON (no markdown):
{
  "recommendations": [
    {
      "title": "...",
      "description": "...",
      "category": "...",
      "impact": "...",
      "effort": "...",
      "priority": 0
    }
  ]
}

Sort by priority (highest first).`;
}

/**
 * Helper to parse JSON from Gemini response
 * Handles cases where model adds markdown or explanation
 */
export function parseJSONResponse(text) {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    
    // Remove ```json and ```
    cleaned = cleaned.replace(/```json\n?/g, '');
    cleaned = cleaned.replace(/```\n?/g, '');
    
    // Find first { and last }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error('No JSON object found in response');
    }
    
    const jsonStr = cleaned.substring(start, end + 1);
    return JSON.parse(jsonStr);
    
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    console.error('Raw text:', text);
    throw new Error('AI returned invalid JSON format');
  }
}
