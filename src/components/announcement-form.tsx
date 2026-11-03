"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendAnnouncementAction } from "@/server/actions/account";

export function AnnouncementForm() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  const send = () =>
    startTransition(async () => {
      const result = await sendAnnouncementAction({ subject, body });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Announcement queued");
      setSubject("");
      setBody("");
    });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={subject}
          maxLength={120}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          value={body}
          maxLength={5000}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-48"
          placeholder="Plain text. Leave a blank line between paragraphs."
        />
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={pending || subject.trim().length < 3 || body.trim().length < 10}>
            {pending && <Loader2 className="animate-spin" />} Send to subscribers
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send “{subject}” to all subscribers?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone once the emails go out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={send}>Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
