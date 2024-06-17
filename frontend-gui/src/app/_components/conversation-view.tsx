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
import { Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "~/lib/utils";

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

  const updateSpeaker = api.transcripts.updateSpeaker.useMutation({
    onSuccess: () => {
      router.refresh();
      toast({
        title: "Success",
        description: "Speaker updated successfully",
      });
    },
  });

  function onSubmit(data: Parameters<typeof updateSpeaker.mutate>[0]) {
    updateSpeaker.mutate(data);
  }

  function deleteSelected() {
    deleteTranscripts.mutate(selected);
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
              <div className="flex gap-x-2">
                <div className="flex flex-col justify-center gap-y-2">
                  <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Selected Speaker:
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
                      <FormLabel>Set to...</FormLabel>
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
              <Button type="submit" disabled={updateSpeaker.isPending}>
                {updateSpeaker.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-y-2">
          {selected.length > 0 && (
            <div>
              <Button onClick={deleteSelected}>Delete selected</Button>
            </div>
          )}
          {transcripts?.map((transcript) => (
            <div key={transcript.id} className="flex items-center gap-x-2">
              <div
                onClick={() => {
                  if (selected.includes(transcript.id)) {
                    setSelected(selected.filter((id) => id !== transcript.id));
                  } else {
                    setSelected([...selected, transcript.id]);
                  }
                }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full ",
                  selected.includes(transcript.id)
                    ? "bg-blue-300"
                    : "bg-slate-300",
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
              <span>{transcript.content}</span>
            </div>
          ))}
        </div>
      </form>
    </Form>
  );
}
