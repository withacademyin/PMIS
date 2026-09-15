// skill matching engine
export const evaluateSkills = (candidateSkills = [], requiredSkills = [], skillScores = {}) => {
  if (!requiredSkills.length) return { score: 100, matched: [], missing: [] };

  const candidateSet = new Set(candidateSkills.map((s) => s.toLowerCase().trim()));
  
  // Normalize skillScores keys for case-insensitive lookup
  const normalizedScores = {};
  if (skillScores && typeof skillScores === 'object') {
    for (const [key, val] of Object.entries(skillScores)) {
      normalizedScores[key.toLowerCase().trim()] = val;
    }
  }

  const matched = requiredSkills.filter((s) => candidateSet.has(s.toLowerCase().trim()));
  const missing = requiredSkills.filter((s) => !candidateSet.has(s.toLowerCase().trim()));

  let totalScore = 0;

  for (const rSkill of requiredSkills) {
    const normalizedSkill = rSkill.toLowerCase().trim();
    if (candidateSet.has(normalizedSkill)) {
      if (typeof normalizedScores[normalizedSkill] === 'number') {
        // Use verified AI test score
        totalScore += normalizedScores[normalizedSkill];
      } else {
        // Baseline score for merely declaring the skill without testing it
        totalScore += 50;
      }
    } else {
      totalScore += 0;
    }
  }

  const score = Math.round(totalScore / requiredSkills.length);
  return { score, matched, missing };
};
