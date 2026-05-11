import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { evaluateConversation } from "@/lib/llm/evaluationService";
import { evaluateConversationRequestSchema } from "@/lib/types/evaluation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = evaluateConversationRequestSchema.parse(body);
    const feedback = await evaluateConversation(payload);

    return NextResponse.json(feedback);
  } catch (error) {
    const isValidationError = error instanceof ZodError;
    if (!isValidationError) {
      console.error("Analyze route failure:", error);
    }
    return NextResponse.json(
      {
        error: isValidationError
          ? "Invalid analysis request payload."
          : "Conversation analysis is temporarily unavailable.",
      },
      { status: isValidationError ? 422 : 500 },
    );
  }
}
