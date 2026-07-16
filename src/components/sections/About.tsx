"use client";

import { motion } from "framer-motion";
import { EditorChrome } from "@/components/ui/EditorChrome";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/data/site";

const stats = [
  { label: "Years of experience", value: siteConfig.yearsExperience },
  { label: "Shipped projects", value: "10+" },
  { label: "Coffee, mostly tea", value: "∞" },
];

export function About() {
  return (
    <section id="about" className="mx-auto max-w-5xl px-6 py-28">
      <SectionHeading
        eyebrow="about"
        title="Someone who enjoys turning ideas into interfaces"
        description={`${siteConfig.yearsExperience} years of hands-on frontend work: shipping production UI with React and Next.js, obsessing over performance, accessibility and the small details that make an interface feel right.`}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="mt-16 overflow-hidden rounded-lg border border-ink-600 bg-ink-900 shadow-lg"
      >
        <EditorChrome fileName="stats.json" />
        <div className="grid grid-cols-1 divide-y divide-ink-600 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="p-8 text-center">
              <p className="font-display text-3xl font-bold text-accent-blue">{stat.value}</p>
              <p className="mt-2 font-mono text-xs text-paper-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
