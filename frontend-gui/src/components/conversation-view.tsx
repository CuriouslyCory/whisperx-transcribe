"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

import { toast } from "~/components/ui/use-toast";
import { type InferSelectModel } from "drizzle-orm";
import { type transcripts } from "~/server/db/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Copy, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { copyToClipboard } from "~/lib/clipboard";

const SpeakerUpdateSchema = z.object({
  currentSpeakerName: z.string().max(255),
  newSpeakerName: z.string().max(255),
  sessionId: z.string().uuid(),
  conversation: z.number(),
});

type ConversationViewProps = {
  transcripts: InferSelectModel<typeof transcripts>[];
};

export function ConversationView({ transcripts }: ConversationViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [lastSelected, setLastSelected] = useState<number | null>(null);

  const form = useForm<z.infer<typeof SpeakerUpdateSchema>>({
    resolver: zodResolver(SpeakerUpdateSchema),
    defaultValues: {
      newSpeakerName: "",
      currentSpeakerName: transcripts[0]?.speaker,
      sessionId: transcripts[0]?.sessionId,
      conversation: transcripts[0]?.conversation,
    },
  });

  const deleteTranscripts = api.transcripts.deleteByIds.useMutation({
    onSuccess: () => {
      router.refresh();
      setSelected([]);
      toast({
        title: "Success",
        description: "Records deleted successfully",
      });
    },
  });

  const updateSpeaker = api.transcripts.switchSpeakerName.useMutation({
    onSuccess: () => {
      router.refresh();
      toast({
        title: "Success",
        description: "Speaker updated successfully",
      });
    },
  });

  const updateSpeakerByIds = api.transcripts.updateSpeakerByIds.useMutation({
    onSuccess: () => {
      router.refresh();
      toast({
        title: "Success",
        description: "Speaker updated successfully",
      });
    },
  });

  function updateSpeakerOnSelectedRecords() {
    updateSpeakerByIds.mutate({
      newSpeakerName: form.getValues("newSpeakerName"),
      transcriptIds: selected,
    });
  }

  function onSubmit(data: Parameters<typeof updateSpeaker.mutate>[0]) {
    updateSpeaker.mutate(data);
  }

  function deleteSelected() {
    deleteTranscripts.mutate(selected);
  }

  function copyConversation() {
    copyToClipboard(
      transcripts.map((t) => `${t.speaker}: ${t.content}`).join("\n"),
    )
      .then(() => {
        toast({
          title: "Success",
          description: "Conversation copied to clipboard",
        });
      })
      .catch((e) => console.error(e));
  }

  function clickRow(evt: React.MouseEvent<HTMLDivElement>, tsId: number) {
    if (evt.shiftKey) {
      if (!lastSelected) return;
      const newSelected = [];

      if (tsId < lastSelected) {
        for (let i = tsId; i <= lastSelected; i++) {
          newSelected.push(i);
        }
      } else if (tsId > lastSelected) {
        for (let i = lastSelected; i <= tsId; i++) {
          newSelected.push(i);
        }
      }

      setSelected([...selected, ...newSelected]);
    } else {
      if (selected.includes(tsId)) {
        setSelected(selected.filter((id) => id !== tsId));
      } else {
        setSelected([...selected, tsId]);
      }
    }
    setLastSelected(tsId);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {transcripts?.length === 0 && <p>No transcripts found</p>}
        {transcripts?.length > 0 && (
          <div>
            <div className="mb-6 rounded-lg border border-opacity-40 p-4">
              <h1>Conversation</h1>
              <div className="flex">
                <span>SessionId: {transcripts[0]?.sessionId}</span>
                <span>Conversation: {transcripts[0]?.conversation}</span>
              </div>
              <div className="flex flex-col gap-x-2">
                <div className="flex items-center gap-x-2">
                  <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Selected Speaker Name:
                  </span>
                  <span className="py-2">
                    {form.getValues("currentSpeakerName")}
                  </span>
                </div>

                <FormField
                  control={form.control}
                  name="newSpeakerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Speaker Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Speaker" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentSpeakerName"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormLabel>Current Speaker Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Current Speaker Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sessionId"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormLabel>SessionId</FormLabel>
                      <FormControl>
                        <Input placeholder="Session Id" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conversation"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormLabel>Conversation Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Conversation Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-2 flex gap-x-2">
                <Button type="submit" disabled={updateSpeaker.isPending}>
                  {updateSpeaker.isPending
                    ? "Submitting..."
                    : "Selected Speaker Name to New Speaker Name"}
                </Button>
                {selected.length > 0 && (
                  <Button
                    type="button"
                    onClick={updateSpeakerOnSelectedRecords}
                    disabled={updateSpeakerByIds.isPending}
                  >
                    {updateSpeakerByIds.isPending
                      ? "Submitting..."
                      : "Update Selected Records"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-y-2">
          <div className="bg-background sticky top-0 flex items-center gap-x-2 py-2">
            <Button onClick={copyConversation} type="button">
              <Copy />
            </Button>
            {selected.length > 0 && (
              <>
                <Button onClick={deleteSelected} type="button">
                  Delete selected
                </Button>
                <Button type="button" onClick={() => setSelected([])}>
                  Clear Selection
                </Button>
              </>
            )}
          </div>
          {transcripts?.map((transcript) => (
            <div key={transcript.id} className="flex items-center gap-x-2">
              <div
                onClick={(evt) => clickRow(evt, transcript.id)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  selected.includes(transcript.id)
                    ? "bg-blue-300"
                    : "bg-slate-300 dark:bg-slate-700",
                )}
              >
                {transcript.speaker.substring(0, 2)}
              </div>
              <Link href={`/transcript/${transcript.id}`}>
                <Settings size={16} />
              </Link>
              <h2
                className="cursor-pointer hover:underline"
                onClick={() =>
                  form.setValue("currentSpeakerName", transcript.speaker, {
                    shouldDirty: true,
                  })
                }
              >
                [{transcript.speaker}]:
              </h2>
              <span className="flex-1">{transcript.content}</span>
            </div>
          ))}
        </div>
      </form>
    </Form>
  );
}
