import OpenAI from 'openai';
import { pipeline, env } from '@xenova/transformers';
import os from 'os';

// Automatically configure cache directory for Serverless compatibility (e.g., Vercel)
// It defaults to the OS temp directory which is writable in serverless environments.
env.cacheDir = process.env.TRANSFORMERS_CACHE || os.tmpdir();

export const getAiClient = () => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

export const withRetry = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      // Handle typical rate limit (429) or service unavailable (503) errors
      const status = error?.status || error?.response?.status || (error.message?.includes('429') ? 429 : error.message?.includes('503') ? 503 : null);
      if ((status === 429 || status === 503) && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.warn(`[aiService] OpenAI API error (${status}). Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

export const generateJsonContent = async (prompt, model = 'gpt-4o') => {
  const ai = getAiClient();
  if (!ai) return null;

  const response = await withRetry(() => ai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
  }));

  const text = response.choices[0]?.message?.content || '';
  const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson);
};

let embeddingPipeline = null;

const getEmbeddingPipeline = async () => {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embeddingPipeline;
};

// generate embeddings for semantic resolution using local onnx model
export const generateEmbedding = async (text) => {
  if (!text) return null;
  try {
    const extractor = await getEmbeddingPipeline();
    const response = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(response.data);
  } catch (err) {
    console.warn('[aiService] Local embedding generation failed:', err.message);
    return null;
  }
};

// generate targeted screening questions for candidate
export const generateScreeningQuestions = async ({
  jobTitle,
  jobDescription,
  requiredSkills = [],
  candidateSkills = [],
}) => {
  try {
    const prompt = `You are an expert technical interviewer for the role: "${jobTitle}".
Job description: "${jobDescription || 'N/A'}"
Required skills: ${requiredSkills.join(', ')}
Candidate declared skills: ${candidateSkills.join(', ')}

Generate 3 concise, practical technical screening questions tailored to evaluate the candidate on the required skills, especially focusing on overlapping or missing skills.
Return ONLY a valid JSON array of strings, for example: ["Question 1", "Question 2", "Question 3"]`;

    const questions = await generateJsonContent(prompt, 'gpt-4o');
    if (Array.isArray(questions) && questions.length > 0) {
      return questions;
    }
  } catch (err) {
    console.warn('[aiService] OpenAI api call failed, using fallback questions:', err.message);
  }

  // fallback deterministic questions for demo reliability
  const primarySkill = requiredSkills[0] || 'software development';
  const secondarySkill = requiredSkills[1] || 'system design';
  const tertiarySkill = requiredSkills[2] || 'database management';

  return [
    `How have you applied ${primarySkill} in your past projects, and what trade-offs did you consider?`,
    `Explain how you handle edge cases and performance bottlenecks when working with ${secondarySkill}.`,
    `Walk us through an end-to-end debugging scenario you solved involving ${tertiarySkill}.`,
  ];
};

// evaluate candidate answers and return score and feedback
export const evaluateAssessment = async ({
  jobTitle,
  requiredSkills = [],
  questionsAndAnswers = [],
}) => {
  if (questionsAndAnswers.length > 0) {
    try {
      const qnaText = questionsAndAnswers
        .map((item, idx) => `Q${idx + 1}: ${item.question}\nA${idx + 1}: ${item.answer}`)
        .join('\n\n');

      const prompt = `You are a senior technical hiring manager evaluating a candidate for the position: "${jobTitle}".
Required skills: ${requiredSkills.join(', ')}

Candidate questions and submitted answers:
${qnaText}

Evaluate the candidate's answers for technical accuracy, practical experience, problem solving, and relevance.
Return ONLY valid JSON matching this exact structure:
{
  "aiScore": <number between 0 and 100>,
  "aiFeedback": "<constructive summary evaluation in 2 to 3 sentences>"
}`;

      const parsed = await generateJsonContent(prompt, 'gpt-4o');

      if (parsed && typeof parsed.aiScore === 'number' && typeof parsed.aiFeedback === 'string') {
        return {
          aiScore: Math.min(100, Math.max(0, Math.round(parsed.aiScore * 10) / 10)),
          aiFeedback: parsed.aiFeedback,
        };
      }
    } catch (err) {
      console.warn('[aiService] OpenAI evaluation failed, using fallback evaluation:', err.message);
    }
  }

  // heuristic evaluation for demo stability if openai key is not set
  let totalLength = 0;
  for (const item of questionsAndAnswers) {
    totalLength += (item.answer || '').trim().length;
  }

  const baselineScore = Math.min(92, Math.max(50, Math.round(50 + totalLength / 15)));
  return {
    aiScore: baselineScore,
    aiFeedback: `Candidate demonstrated solid foundational understanding of ${requiredSkills.slice(0, 3).join(', ')}. Answers showed practical reasoning with potential for further technical depth.`,
  };
};

// generate onboarding assessment questions (1 MCQ, 1 practical per skill)
export const generateSkillAssessment = async (skills = [], contextBlob = '') => {
  const topSkills = skills.slice(0, 5); // Max 5 skills to avoid fatigue

  if (topSkills.length > 0) {
    try {
      const contextString = contextBlob ? `\nContext extracted from candidate's resume: ${contextBlob}\n` : '';
      const prompt = `You are an expert technical evaluator. Generate a short, highly contextual assessment for the following skills identified from the candidate's profile: ${topSkills.join(', ')}.
${contextString}
Instead of generic definitions, create scenario-based questions that test practical application in a real-world environment.

For EACH skill, generate exactly 2 questions:
1. One Multiple Choice Question (MCQ) describing a specific professional scenario or problem to solve. Provide 4 options.
2. One Practical/Subjective Question. For technical skills, ask for a small code snippet to solve a specific problem. For non-technical skills, ask for a short scenario response.

Return ONLY a valid JSON array matching this structure exactly (do not include markdown formatting):
[
  {
    "skill": "React",
    "questions": [
      {
        "type": "mcq",
        "question": "What is the virtual DOM?",
        "options": ["A", "B", "C", "D"]
      },
      {
        "type": "practical",
        "question": "Write a simple functional component that fetches and displays data."
      }
    ]
  }
]`;

      const assessment = await generateJsonContent(prompt, 'gpt-4o');
      if (Array.isArray(assessment) && assessment.length > 0) {
        return assessment;
      }
    } catch (err) {
      console.warn('[aiService] OpenAI api call failed for skill assessment:', err.message);
    }
  }

  // fallback logic
  return topSkills.map(skill => ({
    skill,
    questions: [
      {
        type: 'mcq',
        question: `Which of the following best describes ${skill}?`,
        options: ['A core programming concept', 'A database paradigm', 'A UI library', 'An architectural pattern']
      },
      {
        type: 'practical',
        question: `Provide a short, practical example demonstrating your proficiency in ${skill}.`
      }
    ]
  }));
};

// evaluate onboarding assessment answers
export const evaluateSkillAssessment = async (answers = []) => {
  if (answers.length > 0) {
    try {
      const answersText = answers.map(a => `Skill: ${a.skill}\nQ(${a.type}): ${a.question}\nA: ${a.answer}`).join('\n\n');
      
      const prompt = `You are a strict and objective technical evaluator grading a candidate's skill assessment.
Review the following submitted answers:
${answersText}

For each skill, evaluate the candidate's proficiency based on their answers to both the MCQ and practical questions.
CRITICAL RULE: If the answers for a skill are blank, empty, "N/A", or completely irrelevant, you MUST assign a score of 0 for that skill. Combine the MCQ and practical evaluations to form a final score.
Return ONLY a valid JSON array of objects with the exact structure (do not include markdown formatting):
[
  {
    "skill": "React",
    "score": 85
  }
]
Note: score should be an integer between 0 and 100.`;

      const scoresArray = await generateJsonContent(prompt, 'gpt-4o');
      
      // Convert array to object: { "React": 85 }
      if (Array.isArray(scoresArray)) {
        return scoresArray.reduce((acc, curr) => {
          if (curr.skill && typeof curr.score === 'number') {
            acc[curr.skill] = curr.score;
          }
          return acc;
        }, {});
      }
    } catch (err) {
      console.warn('[aiService] OpenAI api call failed for evaluating skill assessment:', err.message);
    }
  }

  // Deterministic fallback: score based on answer substance, not randomness
  const skillsSet = new Set(answers.map(a => a.skill));
  return Array.from(skillsSet).reduce((acc, skill) => {
    const skillAnswers = answers.filter(a => a.skill === skill);
    const totalLength = skillAnswers.reduce((sum, a) => sum + (a.answer ? String(a.answer).trim().length : 0), 0);
    
    if (totalLength === 0) {
      acc[skill] = 0;
    } else if (totalLength < 20) {
      acc[skill] = 25; // Very short / low-effort answers
    } else if (totalLength < 80) {
      acc[skill] = 50; // Moderate answers
    } else {
      acc[skill] = 65; // Substantive answers get a passing but not inflated score
    }
    return acc;
  }, {});
};
