import { parseResumeOffline, detectSections } from './fallbackParser.js';
import { extractNovelEntities } from '../services/llmExtractor.js';
import { resolveEntity } from '../services/semanticResolver.js';
import { verifyEntityContext } from '../services/llmVerifier.js';

const SIMILARITY_THRESHOLD_ACCEPT = 0.90;
const SIMILARITY_THRESHOLD_AMBIGUOUS = 0.70;

export const parseResumeHybrid = async (rawText) => {
  if (!rawText) return { skills: [], languages: [], projectTypes: [], certifications: [] };

  // Phase 1: Deterministic Base
  const offlineResults = parseResumeOffline(rawText);
  
  const finalProfile = {
    skills: [...offlineResults.skills],
    languages: [...offlineResults.languages],
    projectTypes: [...offlineResults.projectTypes],
    certifications: [...offlineResults.certifications]
  };

  const sections = detectSections(rawText);
  const relevantText = [sections.skills, sections.experience, sections.projects].join('\n');

  // Phase 3: Selective LLM Extraction for Unknowns
  // We extract novel entities from the most relevant sections to save tokens
  const novelEntities = await extractNovelEntities(relevantText, 'skill');

  // Phase 4 & Semantic Recovery Orchestration
  for (const novel of novelEntities) {
    // Check if deterministic already caught it (case-insensitive check)
    const alreadyFound = finalProfile.skills.some(s => s.name.toLowerCase() === novel.name.toLowerCase() || (s.matchedAs && s.matchedAs.toLowerCase() === novel.name.toLowerCase()));
    
    if (alreadyFound) continue;

    // Phase 2: Semantic Resolution
    const vectorCandidates = await resolveEntity(novel.name, 'skill');
    
    if (!vectorCandidates || vectorCandidates.length === 0) {
      // Truly novel entity not in our taxonomy
      // We could add it to our DB as a pending taxonomy review, but for now we keep it
      finalProfile.skills.push(novel);
      continue;
    }

    const topMatch = vectorCandidates[0];

    // Confidence Gating
    if (topMatch.similarity >= SIMILARITY_THRESHOLD_ACCEPT) {
      // High confidence -> Accept
      finalProfile.skills.push({
        name: topMatch.canonical_name,
        matchedAs: novel.name,
        status: novel.status || 'mentioned',
        evidence: novel.evidence,
        source: 'semantic_search',
        confidence: topMatch.similarity
      });
    } else if (topMatch.similarity >= SIMILARITY_THRESHOLD_AMBIGUOUS) {
      // Ambiguous -> LLM Verifier
      const verification = await verifyEntityContext(novel.name, topMatch.canonical_name, novel.evidence, 'unknown');
      
      if (verification.action === 'accept') {
        finalProfile.skills.push({
          name: topMatch.canonical_name,
          matchedAs: novel.name,
          status: novel.status || 'mentioned',
          evidence: novel.evidence,
          source: 'llm_verified',
          confidence: topMatch.similarity // or boost it
        });
      }
      // if reject, we could fall back to unresolved or next candidate
    } else {
      // Unresolved -> keep original novel entity
      finalProfile.skills.push(novel);
    }
  }

  // Sort final profile by confidence (highest first)
  finalProfile.skills.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  return finalProfile;
};
