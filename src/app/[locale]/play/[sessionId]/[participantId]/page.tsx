import PlayClient from "./PlayClient";

export default async function PlaySessionPage({ params }: { params: Promise<{ sessionId: string, participantId: string, locale: string }> }) {
  const { sessionId, participantId } = await params;
  
  return <PlayClient sessionId={sessionId} participantId={participantId} />;
}
