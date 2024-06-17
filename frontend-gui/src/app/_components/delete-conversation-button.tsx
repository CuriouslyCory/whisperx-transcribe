"use client";

import { Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

type DeleteConversationButtonProps = {
  sessionId: string;
  conversation: number;
  onSuccess?: () => void;
  onError?: () => void;
};

export default function DeleteConversationButton({
  sessionId,
  conversation,
  onSuccess,
  onError,
}: DeleteConversationButtonProps) {
  const deleteConversationMutation =
    api.transcripts.deleteConversation.useMutation({
      onSuccess: () => {
        onSuccess?.();
      },
      onError: () => {
        onError?.();
      },
    });

  const deleteConversation = async () => {
    deleteConversationMutation.mutate({ sessionId, conversation });
  };

  return (
    <Button onClick={deleteConversation}>
      <Trash2 />
    </Button>
  );
}
