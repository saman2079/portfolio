import type { CodeLine } from "./TypewriterCode";
import { siteConfig } from "@/data/site";

const kw = "text-accent-violet"; // keywords
const fn = "text-accent-blue"; // identifiers / functions
const str = "text-accent-green"; // string literals
const prop = "text-accent-cyan"; // object keys
const punct = "text-paper-300"; // punctuation
const bool = "text-accent-amber"; // booleans / literals

export const codeSnippet: CodeLine[] = [
  [{ text: "const", className: kw }, { text: " ", className: punct }, { text: "developer", className: fn }, { text: " = {", className: punct }],
  [{ text: "  name", className: prop }, { text: ": ", className: punct }, { text: `"${siteConfig.name}",`, className: str }],
  [{ text: "  role", className: prop }, { text: ": ", className: punct }, { text: `"${siteConfig.role}",`, className: str }],
  [{ text: "  experience", className: prop }, { text: ": ", className: punct }, { text: `"${siteConfig.yearsExperience} years",`, className: str }],
  [
    { text: "  stack", className: prop },
    { text: ": [", className: punct },
    { text: `"React", "Next.js", "TypeScript", "Tailwind"`, className: str },
    { text: "],", className: punct },
  ],
  [{ text: "  hireable", className: prop }, { text: ": ", className: punct }, { text: "true,", className: bool }],
  [{ text: "};", className: punct }],
];
