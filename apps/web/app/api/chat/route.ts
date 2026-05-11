import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { streamNpcResponse } from "@/lib/llm/chatService";
import { chatRequestSchema } from "@/lib/types/chat";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = chatRequestSchema.parse(body);

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const token of streamNpcResponse(payload)) {
            controller.enqueue(encoder.encode(`${JSON.stringify({ token })}\n`));
          }
          controller.enqueue(encoder.encode(`${JSON.stringify({ done: true })}\n`));
        } catch (error) {
          console.error("Chat stream failure:", error);
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({
                error: "Chat response failed. Please try again.",
              })}\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    const isValidationError = error instanceof ZodError;
    if (!isValidationError) {
      console.error("Chat route failure:", error);
    }
    return NextResponse.json(
      {
        error: isValidationError
          ? "Invalid chat request payload."
          : "Chat service is temporarily unavailable.",
      },
      { status: isValidationError ? 422 : 500 },
    );
  }
}
