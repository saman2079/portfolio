"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";

/** Local time in Tehran. Empty on first render so server and client markup match. */
export function StatusClock({ lang, label }: { lang: Locale; label: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const format = new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tehran",
    });
    const tick = () => setTime(format.format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [lang]);

  return (
    <span className="hidden items-center gap-1.5 font-mono text-[11px] text-paper-500 md:inline-flex">
      <span>{label}</span>
      <span dir="ltr" className="text-paper-300">
        {time}
      </span>
    </span>
  );
}
