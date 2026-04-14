export async function broadcastSessionUpdate(sessionId: string, data?: any) {
  const port = process.env.PORT || '3008';
  try {
     fetch(`http://127.0.0.1:${port}/api/internal-socket`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ sessionId, payload: data })
     }).catch(e => {
        // Ignore fetch errors to avoid crashing Next.js server actions if socket server is restarting
     });
  } catch(e) {
      console.error("Socket emit error:", e);
  }
}
