"use client";

import { type FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { Window } from "@/components/os/Window";
import { buttonClasses } from "@/components/os/button";
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
    "mt-2 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2.5 text-paper-100 outline-none transition-colors placeholder:text-paper-500 focus:border-signal";

  return (
    <section id="contact" className="mx-auto max-w-2xl scroll-mt-16 px-5 py-20 sm:px-6 sm:py-28">
      <SectionHeading index={6} eyebrow={contact.eyebrow} title={contact.title} description={contact.description} />

      <Reveal className="mt-12">
        <form onSubmit={handleSubmit}>
          <Window title="contact.sh" bodyClassName="space-y-5 p-6 text-sm">
            <label className="block">
              <span className="font-mono text-signal" dir="ltr">
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
              <span className="font-mono text-signal" dir="ltr">
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
              <button type="submit" className={buttonClasses("primary")}>
                {contact.send} <Send size={15} className="rtl:-scale-x-100" />
              </button>
              <ResumeButton lang={lang} label={t.ui.downloadResume} variant="ghost" />
            </div>
          </Window>
        </form>
      </Reveal>
    </section>
  );
}
