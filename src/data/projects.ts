import type { Project } from "@/types";

export const projects: Project[] = [
  {
    slug: "menuwai",
    title: "MenuWAI",
    description:
      "پلتفرم SaaS منوی دیجیتال هوشمند برای رستوران‌ها و کافه‌ها با دستیار هوش مصنوعی. امکان ثبت سفارش از طریق چت، مدیریت منو، پنل اختصاصی هر رستوران، سیستم چندمستاجره (Multi-Tenant)، مدیریت میزها و تجربه‌ای سریع و مدرن برای مشتریان.",
    stack: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Node.js",
      "PostgreSQL",
      "Docker",
      "OpenAI",
    ],
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
      "پلتفرم مدیریت خسارت خودرو که فرآیند ثبت تصادف را برای رانندگان ساده می‌کند. کاربران می‌توانند تصاویر و اطلاعات حادثه را ثبت کنند و صافکارها و تعمیرکاران پیشنهاد قیمت خود را ارسال کنند تا بهترین گزینه را برای تعمیر انتخاب کنند.",
    stack: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Node.js",
      "REST API",
    ],
    repoUrl: "https://github.com/yourusername/fixino",
    liveUrl: "https://fixino.ir",
    fileName: "fixino.tsx",
    year: "۱۴۰۴",
    status: "منتشر شده",
    featured: true,
  },
  {
    slug: "task-flow",
    title: "TaskFlow",
    description:
      "اپلیکیشن مدیریت وظایف با رابط کاربری کانبان، قابلیت Drag & Drop، بروزرسانی لحظه‌ای و تجربه کاربری روان برای مدیریت پروژه‌های تیمی.",
    stack: ["React", "TypeScript", "Tailwind", "dnd-kit"],
    repoUrl: "https://github.com/yourusername/task-flow",
    liveUrl: "https://example.com",
    fileName: "kanban-board.tsx",
    year: "۱۴۰۲",
    status: "منتشر شده",
  },
];