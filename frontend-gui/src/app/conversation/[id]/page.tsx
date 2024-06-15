import Link from "next/link";
import { ConversationView } from "~/app/_components/conversation-view";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";

export default async function Page({ params }: { params: { id: string } }) {
  const conversation = await api.transcripts.getByIndex({
    id: parseInt(params.id),
  });
  return (
    <main className="mx-10 flex flex-col">
      <div className="flex gap-x-2">
        <Link href={`/conversation/${parseInt(params.id) - 1}`}>
          <Button>Prev</Button>
        </Link>
        <Link href={`/conversation/${parseInt(params.id) + 1}`}>
          <Button>Next</Button>
        </Link>
      </div>

      {conversation && <ConversationView transcripts={conversation} />}
    </main>
  );
}
