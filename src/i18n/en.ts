import type { Dictionary } from "./types";

export const en: Dictionary = {
  meta: {
    title: "Saman Sadegh Elahi — Frontend Engineer",
    description:
      "Portfolio of Saman Sadegh Elahi, a frontend engineer building fast, scalable interfaces with React, Next.js, TypeScript and Tailwind CSS.",
    keywords: ["Frontend Engineer", "React", "Next.js", "TypeScript", "Portfolio", "Saman Sadegh Elahi"],
    ogLocale: "en_US",
  },
  name: "Saman Sadegh Elahi",
  role: "Frontend Engineer",
  tagline: "I build fast, clean and scalable interfaces.",
  availability: "Available for new opportunities",
  nav: [
    { label: "About", href: "#about" },
    { label: "Experience", href: "#experience" },
    { label: "Skills", href: "#skills" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" },
  ],
  ui: {
    sayHi: "Say hi",
    downloadResume: "Download résumé",
    resumeHint: "English résumé (PDF)",
    contactMe: "Contact me",
    scrollToOpen: "scroll to open",
    loadingScene: "loading scene…",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    langLabel: "فا",
    switchTo: "تغییر به فارسی",
    liveDemo: "Live demo",
    source: "Source",
  },
  hero: { whoami: "whoami" },
  about: {
    eyebrow: "about",
    title: "Someone who enjoys turning ideas into interfaces",
    description:
      "1.5+ years building production web apps with React, Next.js and TypeScript, with a focus on performance, SEO and component architecture.",
    bio: [
      "I'm a frontend engineer focused on fast, scalable and maintainable interfaces — from component architecture to rendering strategies like SSR, SSG and ISR.",
      "I've shipped real products, admin dashboards and SaaS platforms, and worked alongside backend teams on full-stack projects, but frontend is where my interest and expertise lie.",
    ],
    stats: [
      { label: "Years of experience", value: "1.5+" },
      { label: "Real-world projects", value: "6+" },
      { label: "JavaScript course score", value: "98/100" },
    ],
  },
  experience: {
    eyebrow: "experience",
    title: "Where I've worked",
    description: "From WordPress sites to production Next.js products.",
    jobs: [
      {
        role: "Frontend Developer",
        company: "Kiasho",
        period: "Apr 2025 — May 2026",
        points: [
          "Built and shipped Next.js features, turning designs into performant, reusable components.",
          "Established a component architecture adopted across the product.",
          "Owned client-side state and REST API integration, reducing perceived loading time.",
          "Delivered the frontend for an AI-powered ordering feature.",
        ],
      },
      {
        role: "Frontend Developer Intern",
        company: "IdehWeb",
        period: "Sep 2024 — Mar 2025",
        points: [
          "Ramped up on React/Next.js in a live production codebase.",
          "Built pages and components under senior guidance.",
        ],
      },
      {
        role: "WordPress Developer",
        company: "Fartak Tejarat Hasti",
        period: "2020 — 2021",
        points: ["Designed and built the company website, then maintained it after launch."],
      },
    ],
  },
  skills: {
    eyebrow: "skills",
    title: "Tools I reach for",
    description: "A focused stack, not a buzzword list — everything below is something I use and ship with regularly.",
    groups: [
      {
        category: "Core",
        items: [
          { name: "HTML & CSS", level: 5 },
          { name: "JavaScript (ES6+)", level: 4 },
          { name: "TypeScript", level: 4 },
        ],
      },
      {
        category: "Frameworks & data",
        items: [
          { name: "React & Next.js", level: 4 },
          { name: "Tailwind CSS", level: 5 },
          { name: "TanStack Query & Zustand", level: 4 },
        ],
      },
      {
        category: "Tooling & backend",
        items: [
          { name: "Git & GitHub", level: 4 },
          { name: "Node.js & PostgreSQL", level: 3 },
          { name: "Docker & Nginx", level: 3 },
        ],
      },
    ],
  },
  projects: {
    eyebrow: "projects",
    title: "A few things I've built",
    description: "Selected work — from SaaS platforms to internal tools.",
    items: [
      {
        slug: "menuwai",
        title: "MenuWAI",
        description:
          "Multi-tenant restaurant SaaS with digital menus, conversational AI ordering and a dedicated management dashboard.",
        stack: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Docker"],
        repoUrl: "https://github.com/saman2079/restaurant-saas",
        liveUrl: "https://menuwai.ir",
        fileName: "menuwai.tsx",
        year: "2026",
        status: "Live",
        featured: true,
      },
      {
        slug: "fixino",
        title: "Fixino",
        description:
          "Online vehicle accident assessment platform: users upload photos and video, and repair shops send back estimates.",
        stack: ["Next.js", "TypeScript", "Tailwind CSS", "REST API"],
        liveUrl: "https://fixino.ir",
        fileName: "fixino.tsx",
        year: "2025",
        status: "Live",
        featured: true,
      },
      {
        slug: "portfolio",
        title: "Personal Portfolio",
        description: "This very site — scroll-driven laptop animation, bilingual, tuned for speed and SEO.",
        stack: ["Next.js", "TypeScript", "Framer Motion", "SEO"],
        repoUrl: "https://github.com/saman2079/portfolio",
        liveUrl: "https://samanellahi.ir",
        fileName: "portfolio.tsx",
        year: "2026",
        status: "Live",
      },
      {
        slug: "fardan",
        title: "Fardan",
        description: "Internal online learning platform: pages, reusable components and REST API integration.",
        stack: ["Next.js", "TypeScript", "REST API"],
        fileName: "fardan.tsx",
        year: "2025",
        status: "Discontinued",
      },
    ],
  },
  contact: {
    eyebrow: "contact",
    title: "Let's build something",
    description: "Have a project in mind, or just want to say hi? Fill this in — it opens straight in your mail app.",
    namePlaceholder: "your name",
    messagePlaceholder: "tell me about your project...",
    messageLabel: "echo “your message”",
    send: "Send message",
    subject: "Portfolio inquiry from",
    anonymous: "a visitor",
  },
  footer: { built: "Built with Next.js & Tailwind CSS" },
};
