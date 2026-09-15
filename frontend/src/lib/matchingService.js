// skill matching engine
export const evaluateSkills = (candidateSkills = [], requiredSkills = []) => {
  if (!requiredSkills.length) return { score: 100, matched: [], missing: [] };

  const candidateSet = new Set(candidateSkills.map((s) => s.toLowerCase().trim()));
  const matched = requiredSkills.filter((s) => candidateSet.has(s.toLowerCase().trim()));
  const missing = requiredSkills.filter((s) => !candidateSet.has(s.toLowerCase().trim()));

  const score = Math.round((matched.length / requiredSkills.length) * 100);
  return { score, matched, missing };
};
