import PlayClient from "./PlayClient";
import PingDisplay from "@/components/PingDisplay";

export default async function PlaySessionPage({ params }: { params: Promise<{ sessionId: string, participantId: string, locale: string }> }) {
  const { sessionId, participantId } = await params;
  
  return (
    <>
      <PingDisplay />
      <PlayClient sessionId={sessionId} participantId={participantId} />
    </>
  );
}
