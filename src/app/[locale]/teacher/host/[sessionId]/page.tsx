import { getSession } from "@/lib/auth";
import { getSessionStatus } from "@/app/actions/live";
import HostLobbyClient from "./HostLobbyClient";

export default async function HostLobbyPage({ params }: { params: Promise<{ sessionId: string, locale: string }> }) {
  const { sessionId } = await params;
  const userSession = await getSession();
  
  if (!userSession || userSession.role !== "TEACHER") {
    return <div>Unauthorized</div>;
  }

  const data = await getSessionStatus(sessionId);

  if (!data || !data.session) return <div>Live Session not found</div>;

  return <HostLobbyClient sessionId={sessionId} initialSession={data.session} initialParticipants={data.participants} />;
}
