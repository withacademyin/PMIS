# System Architecture: Resume Parsing Pipeline

Here is a quick, simple breakdown of our Two-Track parsing architecture.

## 1. What We Did
Instead of forcing a single parser to do everything, we split parsing into two separate tracks:

- **Track 1 (The Offline Standardizer):** We built a blazing-fast, offline deterministic parser (`fallbackParser.js`) that uses strict regular expressions and a canonical dictionary to extract exact, standardized skills (e.g., "React", "AWS").
- **Track 2 (The NLP Context Blob):** We use the `compromise` NLP library to strip the raw resume of all grammatical fluff and extract only the dense core facts, saving it as a small "context blob" in the database. When the LLM needs to generate screening questions later, it reads this tiny blob instead of the massive original PDF.

## 2. Why We Did It
- **LLMs are bad at Matchmaking:** LLMs are creative and output fuzzy tags (e.g., "Frontend Architecture"). Matchmaking databases need exact standardized tags (e.g., "React") to work effectively. Track 1 guarantees this standardization.
- **LLMs are expensive and slow:** Feeding an entire 1,500-word PDF to an LLM during onboarding forces the user to wait 8 seconds and costs a lot of tokens. Track 1 finishes in 1 millisecond.

## 3. What It Saves Us
- **Saves UX (Speed):** The user gets through onboarding instantly without waiting for an LLM to read their PDF.
- **Saves Data Integrity:** Your matching engine works flawlessly because candidates and jobs share the exact same standardized skill strings.
- **Saves 90% in Token Costs:** By feeding the LLM the condensed "Context Blob" from Track 2 instead of the raw PDF, we still get the LLM's deep intelligence for generating questions, but at a fraction of the API cost.
