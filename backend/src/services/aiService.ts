import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface AIResult {
  complexity: "simple" | "complex";
  aiAnswer: string | null;
}

export const analyzeQuestion = async (question: string): Promise<AIResult> => {
  try {
    const response = await groq.chat.completions.create({
model: "llama-3.3-70b-versatile",      messages: [
        {
          role: "system",
          content: `You are an AI teaching assistant. Analyze the student's question and respond in JSON format only. No extra text, no markdown, no backticks.

If the question is factual, definition-based, or simple → complexity: "simple", provide a clear short answer.
If the question needs deep explanation or critical thinking → complexity: "complex", aiAnswer: null.

Respond ONLY with raw JSON like this:
{"complexity": "simple", "aiAnswer": "your answer here"}
or
{"complexity": "complex", "aiAnswer": null}`
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || "";
    console.log("RAW AI RESPONSE:", content); // debug

    const clean = content.replace(/```json|```/g, "").trim();
    console.log("CLEANED:", clean); // debug

    const parsed = JSON.parse(clean);
    console.log("PARSED:", parsed); // debug

    return {
      complexity: parsed.complexity,
      aiAnswer: parsed.aiAnswer,
    };
  } catch (error) {
    console.error("AI SERVICE ERROR:", error);
    return { complexity: "complex", aiAnswer: null };
  }
};