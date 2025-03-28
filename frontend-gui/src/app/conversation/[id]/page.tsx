import Link from "next/link";
import { ConversationView } from "~/components/conversation-view";
import DeleteConversationButton from "~/components/delete-conversation-button";
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
        {conversation && !!conversation[0] && (
          <DeleteConversationButton
            sessionId={conversation?.[0].sessionId}
            conversation={conversation?.[0].conversation}
          />
        )}
      </div>

      {conversation && <ConversationView transcripts={conversation} />}
    </main>
  );
}
