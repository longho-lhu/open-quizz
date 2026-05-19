import { NextRequest } from "next/server";
import { RECOMMENDED_MODELS, MODELS_DIR } from "@/lib/models";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const modelId = searchParams.get("modelId");

  if (!modelId) {
    return new Response("Missing modelId", { status: 400 });
  }

  const model = RECOMMENDED_MODELS.find(m => m.id === modelId);
  if (!model) {
    return new Response("Model not found", { status: 404 });
  }

  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  const absolutePath = path.join(MODELS_DIR, model.filename);
  const tempPath = absolutePath + ".download";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(model.downloadUrl);
        if (!res.ok || !res.body) throw new Error("Failed to fetch model from source");

        const contentLength = res.headers.get("content-length");
        const totalBytes = contentLength ? parseInt(contentLength, 10) : model.sizeMB * 1024 * 1024;

        const fileStream = fs.createWriteStream(tempPath);
        
        let downloadedBytes = 0;
        let lastReportedTime = Date.now();

        const reader = res.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          fileStream.write(Buffer.from(value));
          downloadedBytes += value.length;
          
          const now = Date.now();
          // Report progress every 500ms to avoid flooding SSE
          if (now - lastReportedTime > 500) {
            lastReportedTime = now;
            const percentage = Math.floor((downloadedBytes / totalBytes) * 100);
            controller.enqueue(`data: ${JSON.stringify({ percentage, downloadedBytes, totalBytes })}\n\n`);
          }
        }

        fileStream.end();
        
        // Ensure stream is fully written before renaming
        await new Promise(resolve => fileStream.on('finish', () => resolve(true)));
        
        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath);
        }
        fs.renameSync(tempPath, absolutePath);

        controller.enqueue(`data: ${JSON.stringify({ percentage: 100, done: true, absolutePath })}\n\n`);
        controller.close();

      } catch (err: any) {
        console.error("Download Error", err);
        controller.enqueue(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        controller.close();
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
