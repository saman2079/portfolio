"use client";

import { type FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { EditorChrome } from "@/components/ui/EditorChrome";
import { ResumeButton } from "@/components/ui/ResumeButton";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/i18n/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

/** No backend by design: submitting opens the visitor's mail client via a `mailto:` link. */
export function Contact({ t, lang }: { t: Dictionary; lang: Locale }) {
  const { contact } = t;
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent(`${contact.subject} ${name || contact.anonymous}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${siteConfig.email}?subject=${subject}&body=${body}`;
  };

  const field =
    "mt-2 w-full rounded-lg border border-ink-600 bg-ink-950 px-3 py-2.5 text-paper-100 outline-none transition-colors placeholder:text-paper-500 focus:border-accent-blue";

  return (
    <section id="contact" className="mx-auto max-w-2xl scroll-mt-16 px-5 py-20 sm:px-6 sm:py-28">
      <SectionHeading eyebrow={contact.eyebrow} title={contact.title} description={contact.description} />

      <Reveal className="mt-12">
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-xl border border-ink-600 bg-ink-900/80 shadow-lg">
          <EditorChrome fileName="contact.sh" />

          <div className="space-y-5 p-6 text-sm">
            <label className="block">
              <span className="font-mono text-accent-green" dir="ltr">
                $ <span className="text-paper-300">whoami</span>
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={contact.namePlaceholder}
                autoComplete="name"
                className={field}
              />
            </label>

            <label className="block">
              <span className="font-mono text-accent-green" dir="ltr">
                $ <span className="text-paper-300">{contact.messageLabel}</span>
              </span>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={contact.messagePlaceholder}
                rows={4}
                className={`${field} resize-none`}
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-blue px-5 py-2.5 font-semibold text-ink-950 transition-all hover:-translate-y-0.5 hover:shadow-glow"
              >
                {contact.send} <Send size={15} className="rtl:-scale-x-100" />
              </button>
              <ResumeButton lang={lang} label={t.ui.downloadResume} variant="ghost" />
            </div>
          </div>
        </form>
      </Reveal>
    </section>
  );
}
