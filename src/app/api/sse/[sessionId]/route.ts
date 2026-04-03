import { NextRequest, NextResponse } from "next/server";
import { addClient, removeClient } from "@/lib/sse";

// For Edge and Node runtimes to stream responses
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  const sessionId = params.sessionId;
  
  if (!sessionId) {
    return new NextResponse("Session ID required", { status: 400 });
  }

  let currentController: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(controller) {
      currentController = controller;
      addClient(sessionId, controller);
      
      // Send an initial ping to establish connection
      controller.enqueue(new TextEncoder().encode(': connected\\n\\n'));

      // Keepalive ping every 15 seconds to prevent browser/proxy timeouts
      const interval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': ping\\n\\n'));
        } catch (e) {
          clearInterval(interval);
          removeClient(sessionId, controller);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        removeClient(sessionId, controller);
      });
    },
    cancel() {
      if (currentController) {
        removeClient(sessionId, currentController);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
