"use client";

import * as React from "react";
import { Mic, Send, Bot, User as UserIcon, Loader2 } from "lucide-react";
import { runVoiceTurn, type VoiceMessage } from "@/lib/voice/voice-assistant";
import type { EmergencyType } from "@/lib/ai/first-aid-protocols";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface VoiceAssistantClientProps {
  emergencyType: EmergencyType | null;
  emergencyLabel: string | null;
}

/**
 * The "voice interface" from Section 7 — a chat-style UI with a mic
 * toggle that provides a "listening" affordance (a pulsing ring, a
 * placeholder change) without ever calling a real speech-recognition
 * API. The user always types the actual message; the mic button is
 * honest about being a simulation, not a broken feature.
 */
export function VoiceAssistantClient({ emergencyType, emergencyLabel }: VoiceAssistantClientProps) {
  const [messages, setMessages] = React.useState<VoiceMessage[]>(() => [
    {
      role: "assistant",
      text: emergencyType
        ? `Hi, I'm the GuardianX Voice Assistant. I can see a possible ${emergencyLabel} on record. Ask "what do I do next" and I'll walk you through it, one step at a time.`
        : "Hi, I'm the GuardianX Voice Assistant. Run AI Emergency Detection first, then come back and I can guide you step by step.",
    },
  ]);
  const [inputText, setInputText] = React.useState("");
  const [listening, setListening] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [stepsGiven, setStepsGiven] = React.useState(0);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function toggleListening() {
    setListening((v) => !v);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInputText("");
    setListening(false);
    setSending(true);

    const result = await runVoiceTurn({
      message: trimmed,
      emergencyType,
      stepsGiven,
    });

    setStepsGiven(result.stepsGiven);
    setMessages((prev) => [...prev, { role: "assistant", text: result.reply }]);
    setSending(false);
  }

  return (
    <Card className="flex h-[560px] flex-col overflow-hidden p-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn("flex items-start gap-2.5", msg.role === "user" && "flex-row-reverse")}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "assistant"
                    ? "bg-teal/10 text-teal-strong dark:text-teal"
                    : "bg-background-alt text-foreground-muted"
                )}
              >
                {msg.role === "assistant" ? <Bot size={15} /> : <UserIcon size={15} />}
              </span>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "assistant"
                    ? "bg-background-alt text-foreground"
                    : "bg-teal-strong text-white dark:bg-teal dark:text-[#04201c]"
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal-strong dark:text-teal">
                <Bot size={15} />
              </span>
              <div className="flex items-center gap-1.5 rounded-2xl bg-background-alt px-4 py-2.5">
                <Loader2 size={13} className="animate-spin text-foreground-subtle" />
                <span className="text-xs text-foreground-subtle">Thinking…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
        <button
          type="button"
          onClick={toggleListening}
          aria-label={listening ? "Stop listening" : "Start listening"}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors",
            listening
              ? "animate-pulse-ring border-teal bg-teal/10 text-teal-strong dark:text-teal"
              : "border-border text-foreground-muted hover:border-teal hover:text-teal-strong dark:hover:text-teal"
          )}
        >
          <Mic size={16} />
        </button>
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            listening ? "Listening… (simulated — type your message)" : "Type your message…"
          }
          disabled={sending}
        />
        <Button type="submit" size="sm" disabled={sending || !inputText.trim()}>
          <Send size={15} />
        </Button>
      </form>
    </Card>
  );
}