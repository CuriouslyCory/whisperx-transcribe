import { TranscriptView } from "~/app/_components/transcript-view";
import { api } from "~/trpc/server";

export default async function Page({ params }: { params: { id: string } }) {
  const transcript = await api.transcripts.getById({
    id: parseInt(params.id),
  });
  return (
    <main className="mx-10 flex flex-col">
      {transcript && <TranscriptView transcript={transcript}></TranscriptView>}
    </main>
  );
}
