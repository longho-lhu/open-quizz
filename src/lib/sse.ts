const globalForSse = global as unknown as { sseClients: Map<string, Set<ReadableStreamDefaultController>> };
export const sseClients = globalForSse.sseClients || new Map<string, Set<ReadableStreamDefaultController>>();
if (process.env.NODE_ENV !== "production") globalForSse.sseClients = sseClients;

export function addClient(sessionId: string, controller: ReadableStreamDefaultController) {
  if (!sseClients.has(sessionId)) {
    sseClients.set(sessionId, new Set());
  }
  sseClients.get(sessionId)!.add(controller);
}

export function removeClient(sessionId: string, controller: ReadableStreamDefaultController) {
  const clients = sseClients.get(sessionId);
  if (clients) {
    clients.delete(controller);
    if (clients.size === 0) sseClients.delete(sessionId);
  }
}

export function broadcastSessionUpdate(sessionId: string, data?: any) {
  const clients = sseClients.get(sessionId);
  if (!clients || clients.size === 0) return;

  const payload = { type: 'UPDATE', data };
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  const encoder = new TextEncoder();
  
  clients.forEach(client => {
    try {
      client.enqueue(encoder.encode(message));
    } catch (e) {
      removeClient(sessionId, client);
    }
  });
}
