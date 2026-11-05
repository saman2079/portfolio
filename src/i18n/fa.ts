import type { Dictionary } from "./types";

export const fa: Dictionary = {
  meta: {
    title: "سامان صدیق الهی — توسعه‌دهنده فرانت‌اند",
    description:
      "پرتفولیوی سامان صدیق الهی، توسعه‌دهنده فرانت‌اند با تمرکز بر React، Next.js، TypeScript و Tailwind CSS.",
    keywords: ["توسعه‌دهنده فرانت‌اند", "React", "Next.js", "TypeScript", "پرتفولیو", "سامان صدیق الهی"],
    ogLocale: "fa_IR",
  },
  name: "سامان صدیق الهی",
  role: "توسعه‌دهنده فرانت‌اند",
  tagline: "رابط‌های سریع، تمیز و مقیاس‌پذیر می‌سازم.",
  availability: "برای همکاری‌های جدید در دسترسم",
  nav: [
    { label: "درباره من", href: "#about" },
    { label: "سوابق", href: "#experience" },
    { label: "مهارت‌ها", href: "#skills" },
    { label: "نمونه‌کارها", href: "#projects" },
    { label: "تماس", href: "#contact" },
  ],
  ui: {
    sayHi: "سلام بگو",
    downloadResume: "دانلود رزومه",
    resumeHint: "رزومه فارسی (PDF)",
    contactMe: "تماس با من",
    scrollToOpen: "اسکرول کن تا باز شود",
    loadingScene: "در حال بارگذاری صحنه…",
    menuOpen: "باز کردن منو",
    menuClose: "بستن منو",
    langLabel: "EN",
    switchTo: "Switch to English",
    liveDemo: "مشاهده سایت",
    source: "سورس",
  },
  hero: { whoami: "whoami" },
  about: {
    eyebrow: "درباره من",
    title: "کسی که عاشق تبدیل ایده به رابط کاربری است",
    description:
      "بیش از یک سال و نیم تجربه در ساخت اپلیکیشن‌های وب با React، Next.js و TypeScript؛ با تمرکز بر عملکرد، SEO و معماری کامپوننت.",
    bio: [
      "توسعه‌دهنده فرانت‌اند هستم و روی رابط‌های سریع، مقیاس‌پذیر و قابل نگهداری کار می‌کنم؛ از معماری کامپوننت تا استراتژی‌های رندرینگ مثل SSR، SSG و ISR.",
      "تجربه ساخت محصولات واقعی، داشبوردهای مدیریتی و پروژه‌های SaaS را دارم و در پروژه‌های فول‌استک با تیم بک‌اند همکاری کرده‌ام؛ اما علاقه و تخصص اصلی‌ام فرانت‌اند است.",
    ],
    stats: [
      { label: "سال تجربه", value: "۱.۵+" },
      { label: "پروژه واقعی", value: "۶+" },
      { label: "نمره دوره جاوااسکریپت", value: "۹۸/۱۰۰" },
    ],
  },
  experience: {
    eyebrow: "سوابق",
    title: "مسیر کاری من",
    description: "از وردپرس تا ساخت محصولات Production با Next.js.",
    jobs: [
      {
        role: "توسعه‌دهنده فرانت‌اند",
        company: "کیاشو",
        period: "فروردین ۱۴۰۴ — اردیبهشت ۱۴۰۵",
        points: [
          "توسعه قابلیت‌ها و صفحات جدید با Next.js و TypeScript.",
          "طراحی کامپوننت‌های قابل استفاده مجدد و استانداردسازی ساختار رابط کاربری.",
          "مدیریت state، اتصال به REST API و بهینه‌سازی تجربه کاربری.",
          "توسعه رابط کاربری قابلیت سفارش‌گیری هوشمند مبتنی بر هوش مصنوعی.",
        ],
      },
      {
        role: "کارآموز فرانت‌اند",
        company: "ایده وب",
        period: "شهریور ۱۴۰۳ — اسفند ۱۴۰۳",
        points: [
          "یادگیری React و Next.js در یک کدبیس واقعی.",
          "توسعه صفحات و کامپوننت‌ها زیر نظر برنامه‌نویسان ارشد.",
        ],
      },
      {
        role: "توسعه‌دهنده وردپرس",
        company: "فرتاک تجارت هستی",
        period: "۱۳۹۹ — ۱۴۰۰",
        points: ["طراحی و توسعه وب‌سایت شرکتی و نگهداری آن پس از راه‌اندازی."],
      },
    ],
  },
  skills: {
    eyebrow: "مهارت‌ها",
    title: "ابزارهایی که هر روز استفاده می‌کنم",
    description: "یک استک متمرکز، نه فهرستی از کلمات پرزرق‌وبرق؛ هرچه اینجا هست در پروژه‌ها استفاده کرده‌ام.",
    groups: [
      {
        category: "بنیادی",
        items: [
          { name: "HTML و CSS", level: 5 },
          { name: "JavaScript (ES6+)", level: 4 },
          { name: "TypeScript", level: 4 },
        ],
      },
      {
        category: "فریم‌ورک و داده",
        items: [
          { name: "React و Next.js", level: 4 },
          { name: "Tailwind CSS", level: 5 },
          { name: "TanStack Query و Zustand", level: 4 },
        ],
      },
      {
        category: "ابزار و بک‌اند",
        items: [
          { name: "Git و GitHub", level: 4 },
          { name: "Node.js و PostgreSQL", level: 3 },
          { name: "Docker و Nginx", level: 3 },
        ],
      },
    ],
  },
  projects: {
    eyebrow: "نمونه‌کارها",
    title: "چند چیزی که ساخته‌ام",
    description: "پروژه‌های منتخب؛ از پلتفرم‌های SaaS تا ابزارهای داخلی.",
    items: [
      {
        slug: "menuwai",
        title: "MenuWAI",
        description:
          "پلتفرم SaaS چندمستاجره برای منوی دیجیتال رستوران‌ها با سفارش‌گیری مکالمه‌ای مبتنی بر هوش مصنوعی و پنل مدیریت اختصاصی.",
        stack: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Docker"],
        repoUrl: "https://github.com/saman2079/restaurant-saas",
        liveUrl: "https://menuwai.ir",
        fileName: "menuwai.tsx",
        year: "۱۴۰۵",
        status: "منتشر شده",
        featured: true,
      },
      {
        slug: "fixino",
        title: "Fixino",
        description:
          "سامانه آنلاین ارزیابی خسارت خودرو؛ کاربر تصویر و ویدئو بارگذاری می‌کند و پیشنهاد قیمت تعمیرکاران را می‌بیند.",
        stack: ["Next.js", "TypeScript", "Tailwind CSS", "REST API"],
        liveUrl: "https://fixino.ir",
        fileName: "fixino.tsx",
        year: "۱۴۰۴",
        status: "منتشر شده",
        featured: true,
      },
      {
        slug: "portfolio",
        title: "Personal Portfolio",
        description: "همین وب‌سایت؛ با انیمیشن اسکرول‌محور لپ‌تاپ، دوزبانه و بهینه برای سرعت و SEO.",
        stack: ["Next.js", "TypeScript", "Framer Motion", "SEO"],
        repoUrl: "https://github.com/saman2079/portfolio",
        liveUrl: "https://samanellahi.ir",
        fileName: "portfolio.tsx",
        year: "۱۴۰۵",
        status: "منتشر شده",
      },
      {
        slug: "fardan",
        title: "Fardan",
        description: "پلتفرم آموزش آنلاین داخلی؛ صفحات، کامپوننت‌های قابل استفاده مجدد و اتصال به REST API.",
        stack: ["Next.js", "TypeScript", "REST API"],
        fileName: "fardan.tsx",
        year: "۱۴۰۴",
        status: "متوقف شده",
      },
    ],
  },
  contact: {
    eyebrow: "تماس",
    title: "بیا چیزی بسازیم",
    description: "پروژه‌ای در ذهن دارید یا فقط می‌خواهید سلام کنید؟ پیام بنویسید؛ در برنامه ایمیل شما باز می‌شود.",
    namePlaceholder: "نام شما",
    messagePlaceholder: "درباره پروژه‌تان بگویید…",
    messageLabel: "echo “پیام شما”",
    send: "ارسال پیام",
    subject: "پیام از پرتفولیو",
    anonymous: "یک بازدیدکننده",
  },
  footer: { built: "ساخته‌شده با Next.js و Tailwind CSS" },
};
