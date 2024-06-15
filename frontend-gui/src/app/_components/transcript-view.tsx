"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { toast } from "~/components/ui/use-toast";
import { type InferSelectModel } from "drizzle-orm";
import { type transcripts } from "~/server/db/schema";

const TranscriptSchema = z.object({
  id: z.number().min(1),
  sessionId: z.string().uuid(),
  conversation: z.number(),
  speaker: z.string().max(255),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.string(),
  content: z.string(),
});

type TranscriptViewProps = {
  transcript: InferSelectModel<typeof transcripts>;
};

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const router = useRouter();
  const form = useForm<InferSelectModel<typeof transcripts>>({
    resolver: zodResolver(TranscriptSchema),
    defaultValues: transcript,
  });

  const updateTranscript = api.transcripts.update.useMutation({
    onSuccess: () => {
      router.refresh();
      toast({
        title: "Success",
        description: "Transcript updated successfully",
      });
    },
  });

  function onSubmit(data: Parameters<typeof updateTranscript.mutate>[0]) {
    updateTranscript.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex">
          <FormField
            control={form.control}
            name="sessionId"
            disabled
            render={({ field }) => (
              <FormItem>
                <FormLabel>Session ID</FormLabel>
                <FormControl>
                  <Input placeholder="Session ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="conversation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conversation</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Conversation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="speaker"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Speaker</FormLabel>
                <FormControl>
                  <Input placeholder="Speaker" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" placeholder="Date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Start Time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="End Time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <FormControl>
                  <Input placeholder="Duration" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Input placeholder="Content" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={updateTranscript.isPending}>
          {updateTranscript.isPending ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
