export function normalizeText(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function detectSections(rawText) {
  const sections = {
    summary: '',
    skills: '',
    experience: '',
    projects: '',
    education: '',
    certifications: '',
    uncategorized: ''
  };

  const lines = rawText.split('\n');
  let currentSection = 'uncategorized';

  for (const line of lines) {
    const lowerLine = line.trim().toLowerCase();
    // Very simple header detection (a short line containing a section keyword)
    if (lowerLine.length > 0 && lowerLine.length < 40) {
      if (lowerLine.includes('summary') || lowerLine.includes('profile') || lowerLine.includes('about')) {
        currentSection = 'summary';
      } else if (lowerLine.includes('skill') || lowerLine.includes('technologies')) {
        currentSection = 'skills';
      } else if (lowerLine.includes('experience') || lowerLine.includes('employment') || lowerLine.includes('work history') || lowerLine.includes('history')) {
        currentSection = 'experience';
      } else if (lowerLine.includes('project')) {
        currentSection = 'projects';
      } else if (lowerLine.includes('education')) {
        currentSection = 'education';
      } else if (lowerLine.includes('certification') || lowerLine.includes('certificate')) {
        currentSection = 'certifications';
      }
    }
    sections[currentSection] += line + '\n';
  }

  return sections;
}

export function findMatches(normalizedText, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?<![a-z0-9\\.\\-])${escaped}(?![a-z0-9\\+\\-])`, 'ig');

  const matches = [];
  let match;
  while ((match = regex.exec(normalizedText)) !== null) {
    matches.push(match.index);
  }
  return matches;
}

export function analyzeContext(text, term, matchIndex) {
  const windowStart = Math.max(0, matchIndex - 60);
  const contextWindow = text.substring(windowStart, matchIndex).toLowerCase();

  if (/\b(no|without|zero)\b.{0,30}$/.test(contextWindow)) return 'negated';
  if (/\b(learning|studying|preparing|interested)\b.{0,30}$/.test(contextWindow)) return 'learning';
  // Added non-tech verbs like managed, led, executed for non-tech roles
  if (/\b(built|deployed|developed|using|production|implemented|managed|led|executed|orchestrated)\b.{0,40}$/.test(contextWindow)) return 'used';

  return 'mentioned';
}

export function extractEvidence(text, matchIndex, termLength) {
  const windowStart = Math.max(0, matchIndex - 80);
  const windowEnd = Math.min(text.length, matchIndex + termLength + 80);
  let evidence = text.substring(windowStart, windowEnd).replace(/\n/g, ' ').trim();
  if (windowStart > 0) evidence = '...' + evidence;
  if (windowEnd < text.length) evidence = evidence + '...';
  return evidence;
}

export function calculateConfidence(matchDetails) {
  let score = 0.5; // Base score

  // Section boosts
  if (matchDetails.section === 'skills' || matchDetails.section === 'experience') score += 0.3;
  if (matchDetails.section === 'projects') score += 0.2;
  if (matchDetails.section === 'certifications') score += 0.25;
  // PDF text often loses section headers — don't penalize uncategorized matches
  if (matchDetails.section === 'uncategorized') score += 0.1;

  // Context boosts/penalties
  if (matchDetails.status === 'used') score += 0.2;
  if (matchDetails.status === 'learning') score -= 0.2;
  if (matchDetails.status === 'negated') score -= 0.8;

  return Math.max(0, Math.min(1, score));
}


// this is wrong approach 
export const SKILLS = {
  "JavaScript": ["javascript", "js"],
  "TypeScript": ["typescript", "ts"],
  "Python": ["python", "py"],
  "Java": ["java"],
  "C++": ["c++", "cpp"],
  "C#": ["c#", "csharp"],
  "Ruby": ["ruby"],
  "Go": ["go", "golang"],
  "Rust": ["rust"],
  "React": ["react", "reactjs", "react.js"],
  "Node.js": ["node.js", "nodejs", "node js"],
  "Next.js": ["next.js", "nextjs", "next js"],
  "Express": ["express", "expressjs", "express.js"],
  "Django": ["django"],
  "Flask": ["flask"],
  "Spring Boot": ["spring boot", "springboot"],
  "HTML": ["html", "html5"],
  "CSS": ["css", "css3"],
  "Tailwind": ["tailwind", "tailwindcss"],
  "Sass": ["sass", "scss"],
  "SQL": ["sql"],
  "PostgreSQL": ["postgresql", "postgres", "psql"],
  "MySQL": ["mysql"],
  "MongoDB": ["mongodb", "mongo"],
  "Redis": ["redis"],
  "DynamoDB": ["dynamodb", "dynamo"],
  "AWS": ["aws", "amazon web services"],
  "Azure": ["azure", "microsoft azure"],
  "Google Cloud": ["google cloud", "gcp", "google cloud platform"],
  "Docker": ["docker"],
  "Kubernetes": ["kubernetes", "k8s"],
  "CI/CD": ["ci/cd", "ci-cd", "continuous integration"],
  "Git": ["git"],
  "Machine Learning": ["machine learning", "ml"],
  "Data Analysis": ["data analysis", "data analytics"],
  "Project Management": ["project management", "pm"],
  "Financial Modeling": ["financial modeling"],
  "Data Structures": ["data structures", "dsa"],
  "Algorithms": ["algorithms"],
  "MERN": ["mern", "mern stack"],
  "FastAPI": ["fastapi", "fast api"],
  "Jira": ["jira"],
  "LangChain": ["langchain", "langgraph", "langchain/langgraph"],
  "OpenAI API": ["openai api", "openai"],
  "GitHub Copilot": ["github copilot", "copilot"],
  "Vercel": ["vercel"],
  "Agile": ["agile", "scrum", "kanban"],
  "Figma": ["figma"],
  "Power BI": ["power bi", "powerbi"],
  "Tableau": ["tableau"],
  "Excel": ["excel", "ms excel", "microsoft excel"],
  "Salesforce": ["salesforce", "sfdc"]
};

export const LANGUAGES = {
  "English": ["english"],
  "Hindi": ["hindi"],
  "Spanish": ["spanish", "español"],
  "French": ["french", "français"],
  "German": ["german", "deutsch"],
  "Mandarin": ["mandarin", "chinese"],
  "Japanese": ["japanese"],
  "Korean": ["korean"],
  "Arabic": ["arabic"],
  "Portuguese": ["portuguese"],
  "Russian": ["russian"],
  "Tamil": ["tamil"],
  "Telugu": ["telugu"],
  "Bengali": ["bengali", "bangla"],
  "Urdu": ["urdu"],
  "Marathi": ["marathi"],
  "Gujarati": ["gujarati"],
  "Kannada": ["kannada"],
  "Malayalam": ["malayalam"],
  "Punjabi": ["punjabi"]
};

export const PROJECT_TYPES = {
  "REST API": ["rest api", "restful api", "rest services", "restful services", "backend api"],
  "Microservices": ["microservices", "microservice architecture", "microservice-based"],
  "Mobile Application": ["mobile application", "android application", "ios application", "mobile app", "android app", "ios app"],
  "Full-Stack Web App": ["full-stack", "full stack", "fullstack", "web application", "web app"],
  "E-commerce Platform": ["e-commerce", "ecommerce", "online store", "shopping platform"],
  "Data Pipeline": ["data pipeline", "etl pipeline", "data ingestion"],
  "Machine Learning Model": ["ml model", "machine learning model", "deep learning model"],
  "CLI Tool": ["cli tool", "command line tool", "command-line"]
};

export const CERTIFICATIONS = {
  "AWS Certified Solutions Architect": ["aws certified solutions architect"],
  "AWS Certified Developer": ["aws certified developer"],
  "AWS Certified Cloud Practitioner": ["aws certified cloud practitioner"],
  "Certified Kubernetes Administrator": ["certified kubernetes administrator", "cka"],
  "Google Cloud Certified": ["google cloud certified", "gcp certified"],
  "CPA": ["cpa", "certified public accountant"],
  "PMP": ["pmp", "project management professional"],
  "Scrum Master": ["scrum master", "csm", "certified scrum master"]
};

function extractRichMatches(rawText, dictionary) {
  const sections = detectSections(rawText);
  const results = new Map(); // canonicalName -> best rich match

  for (const [sectionName, sectionText] of Object.entries(sections)) {
    if (!sectionText.trim()) continue;
    const normalizedSection = normalizeText(sectionText);

    for (const [canonicalName, aliases] of Object.entries(dictionary)) {
      for (const alias of aliases) {
        const matchIndices = findMatches(normalizedSection, alias);

        for (const index of matchIndices) {
          const status = analyzeContext(normalizedSection, alias, index);
          const evidence = extractEvidence(normalizedSection, index, alias.length);

          const matchDetail = {
            name: canonicalName,
            matchedAs: alias,
            section: sectionName,
            status: status,
            evidence: evidence,
            source: 'rule'
          };

          const confidence = calculateConfidence(matchDetail);
          const existingMatch = results.get(canonicalName);

          if (!existingMatch || confidence > existingMatch.confidence) {
            results.set(canonicalName, {
              ...matchDetail,
              confidence: Number(confidence.toFixed(2))
            });
          }
        }
      }
    }
  }

  // Filter by confidence >= 0.5 and sort descending so best skills are first
  return Array.from(results.values())
    .filter(m => m.confidence >= 0.5)
    .sort((a, b) => b.confidence - a.confidence);
}

export const parseResumeOffline = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return { skills: [], languages: [], projectTypes: [], certifications: [] };
  }

  return {
    skills: extractRichMatches(rawText, SKILLS),
    languages: extractRichMatches(rawText, LANGUAGES),
    projectTypes: extractRichMatches(rawText, PROJECT_TYPES),
    certifications: extractRichMatches(rawText, CERTIFICATIONS),
  };
};
