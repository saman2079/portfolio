"use client";

import { type FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/data/site";

/**
 * There's no backend here by design (see README): submitting the form opens
 * the visitor's mail client with a pre-filled message via a `mailto:` link.
 * Swap the handler for a real API route or a form service later if needed.
 */
export function Contact() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Portfolio inquiry from ${name || "a visitor"}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${siteConfig.email}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="mx-auto max-w-2xl px-6 py-28">
      <SectionHeading
        eyebrow="contact"
        title="Let's build something"
        description="Have a project in mind, or just want to say hi? Fill this in — it opens straight in your mail app."
      />

      <motion.form
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit}
        className="mt-16 overflow-hidden rounded-lg border border-ink-600 bg-ink-900 shadow-lg"
      >
        <div className="flex items-center gap-1.5 border-b border-ink-600 bg-ink-800 px-3 py-2">
          <span className="editor-dot bg-accent-red/70" />
          <span className="editor-dot bg-accent-amber/70" />
          <span className="editor-dot bg-accent-green/70" />
          <span className="ml-2 font-mono text-[11px] text-paper-500">bash — contact</span>
        </div>

        <div className="space-y-4 p-6 font-mono text-sm">
          <label className="block">
            <span className="text-accent-green">$</span> <span className="text-paper-300">whoami</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="your name"
              className="mt-2 w-full rounded border border-ink-600 bg-ink-950 px-3 py-2 text-paper-100 outline-none placeholder:text-paper-500 focus:border-accent-blue"
            />
          </label>

          <label className="block">
            <span className="text-accent-green">$</span>{" "}
            <span className="text-paper-300">echo &ldquo;your message&rdquo;</span>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="tell me about your project..."
              rows={4}
              className="mt-2 w-full resize-none rounded border border-ink-600 bg-ink-950 px-3 py-2 text-paper-100 outline-none placeholder:text-paper-500 focus:border-accent-blue"
            />
          </label>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent-blue px-4 py-2.5 font-semibold text-ink-950 transition-opacity hover:opacity-90 sm:w-auto"
          >
            Send message <Send size={15} />
          </button>
        </div>
      </motion.form>
    </section>
  );
}
