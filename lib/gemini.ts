import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiPro = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export async function generateJSON<T>(prompt: string): Promise<T> {
  const result = await geminiPro.generateContent(prompt);
  const text = result.response.text().trim();
  // Strip markdown code fences if present
  const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(json) as T;
}
