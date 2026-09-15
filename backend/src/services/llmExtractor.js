import { getAiClient, withRetry } from './aiService.js';

export const extractNovelEntities = async (text, expectedType = 'skill') => {
  const ai = getAiClient();
  if (!ai || !text || text.length < 5) return [];

  try {
    const prompt =
     `You are a technical entity extraction tool. Extract ONLY previously unknown or highly specific ${expectedType} entities from the following resume text snippet that are NOT standard, broad categories. 
    Return ONLY a valid JSON array of objects with the entity name and the exact sentence/context (evidence) where it was found. Example:
    [
      { "name": "Temporal.io", "evidence": "Built stateful workflows using Temporal.io" }
    ]
    
    Resume text snippet:
    "${text}"`;

    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));

    const output = response.text ? response.text.trim() : '';
    const cleanJson = output.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    if (!cleanJson) return [];

    const parsed = JSON.parse(cleanJson);
    
    if (Array.isArray(parsed)) {
      return parsed.map(p => ({
        name: p.name,
        evidence: p.evidence,
        source: 'llm_extraction',
        status: 'mentioned', // default, context could be refined later
        confidence: 0.7
      }));
    }
  } catch (err) {
    console.warn(`[llmExtractor] failed to extract novel entities for type ${expectedType}:`, err.message);
  }
  
  return [];
};
