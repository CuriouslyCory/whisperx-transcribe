import { TranscriptView } from "~/app/_components/transcript-view";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/server";
import { ConversationView } from "./_components/conversation-view";

export default async function Home() {
  const lastConversation = await api.transcripts.getLatest();
  const session = await getServerAuthSession();

  return (
    <main className="mx-10 mt-6">
      {lastConversation && <ConversationView transcripts={lastConversation} />}
      {false &&
        lastConversation?.map((transcript) => (
          <TranscriptView
            transcript={transcript}
            key={transcript.id}
          ></TranscriptView>
        ))}
    </main>
  );
}
