import { generateJsonContent } from './aiService.js';

export const verifyEntityContext = async (entity, candidate, evidence, section) => {
  if (!evidence) return { action: 'unresolved' };

  try {
    const prompt = `You are a technical context verifier. Your job is to determine if the candidate actually possesses or used the canonical skill based on the evidence provided from their resume.

    Original text entity found: "${entity}"
    Candidate canonical skill: "${candidate}"
    Evidence from resume: "${evidence}"
    Section: "${section}"

    Does this evidence support that the candidate possesses/used the canonical skill? 
    Return ONLY a valid JSON object with an "action" (either "accept" or "reject") and a short "reason" string.
    Example: { "action": "accept", "reason": "The candidate clearly states they used Kubernetes to deploy microservices." }`;

    const parsed = await generateJsonContent(prompt, 'gpt-4o');
    
    if (parsed) {
      return {
        action: parsed.action === 'accept' ? 'accept' : 'reject',
        reason: parsed.reason || ''
      };
    }
  } catch (err) {
    console.warn(`[llmVerifier] failed to verify entity context for ${candidate}:`, err.message);
  }
  
  return { action: 'unresolved', reason: 'LLM verification failed' };
};
