import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { content } = (await request.json()) as { content?: string };

    if (typeof content !== "string" || !content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ text: `Please summarize the following text concisely:\n\n${content}` }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      }
    });

    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (error: unknown) {
    console.error("Summarization API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || "Failed to summarize" }, { status: 500 });
  }
}