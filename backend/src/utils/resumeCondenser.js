import nlp from 'compromise';

/**
 * Strips formatting and grammatical fluff from a raw resume text, 
 * returning a highly condensed "context blob" of pure core entities.
 * This massively reduces LLM token overhead.
 * 
 * @param {string} rawText 
 * @returns {string} The condensed context blob
 */
export const condenseResume = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return '';

  // Clean raw spacing
  const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  
  const doc = nlp(cleanText);

  // Extract core concepts using generic NLP
  const topics = doc.topics().out('array');
  const nouns = doc.nouns().out('array');
  const acronyms = doc.acronyms().out('array');
  const organizations = doc.organizations().out('array');

  // Combine and deduplicate
  const uniqueEntities = new Set([
    ...topics,
    ...nouns,
    ...acronyms,
    ...organizations
  ].map(e => e.trim()).filter(e => e.length > 2 && e.length < 50)); // Filter out garbage symbols

  // Join back into a dense text blob
  return Array.from(uniqueEntities).join(', ');
};
