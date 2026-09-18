import { generateJsonContent } from './aiService.js';

export const extractJdDetails = async (jdText) => {
  if (!jdText || typeof jdText !== 'string' || !jdText.trim()) {
    return null;
  }

  try {
    const prompt = `You are an expert technical recruiter analyzing a job description.
Extract the following information from the provided Job Description text:
1. "title": The most likely job title.
2. "description": A concise, engaging 1-2 paragraph summary of the role.
3. "requiredSkills": A list of technical and soft skills explicitly required or strongly preferred for the role.

Job Description Text:
"""
${jdText.slice(0, 15000)}
"""

Return ONLY a valid JSON object matching this exact structure:
{
  "title": "Senior Software Engineer",
  "description": "Short summary here...",
  "requiredSkills": ["React", "Node.js", "System Design"]
}`;

    const parsed = await generateJsonContent(prompt, 'gpt-4o');
    
    if (parsed && typeof parsed.title === 'string' && Array.isArray(parsed.requiredSkills)) {
      return {
        title: parsed.title,
        description: parsed.description || '',
        requiredSkills: parsed.requiredSkills
      };
    }
  } catch (err) {
    console.warn('[jdParserService] OpenAI api call failed for JD parsing:', err.message);
  }

  return null;
};
