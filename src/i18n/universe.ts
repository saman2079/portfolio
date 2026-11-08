import type { Locale } from "./config";
import type { DestinationId } from "@/lib/universe/destinations";

export interface UniverseText {
  logoSub: string;
  navExplore: string;
  navResume: string;
  explore: string;
  viewResume: string;
  destinations: string;
  scroll: string;
  location: string;
  deepSpace: string;
  distance: string;
  speed: string;
  takeOff: string;
  info: string;
  landing: string;
  lite: string;
  back3d: string;
  close: string;
  email: string;
  telegram: string;
  github: string;
  outsideView: string;
  cockpitView: string;
  flightSpeed: string;
  lookHint: string;
  arrived: string;
  enter: string;
  fullscreen: string;
  exitFullscreen: string;
  labIntro: string;
  builder: {
    start: string;
    exit: string;
    reset: string;
    hint: string;
    power: string;
    online: string;
    level: string;
    complete: string;
    completeSub: string;
    names: string[];
  };
  places: Record<DestinationId, { title: string; sub: string }>;
}

export const universeText: Record<Locale, UniverseText> = {
  fa: {
    logoSub: "جهان من را کاوش کن",
    navExplore: "کاوش",
    navResume: "رزومه",
    explore: "ورود به جهان",
    viewResume: "مشاهده رزومه",
    destinations: "مقصدها",
    scroll: "اسکرول کن تا کاوش کنی",
    location: "موقعیت",
    deepSpace: "فضای عمیق",
    distance: "فاصله",
    speed: "سرعت",
    takeOff: "برخاستن",
    info: "اطلاعات",
    landing: "ورود به جو سیاره…",
    lite: "نسخه ساده",
    back3d: "بازگشت به جهان سه‌بعدی",
    close: "بستن",
    email: "ایمیل",
    telegram: "تلگرام",
    github: "گیت‌هاب",
    outsideView: "نمای بیرون",
    cockpitView: "نمای کابین",
    flightSpeed: "سرعت پرواز",
    lookHint: "بکش تا داخل کابین را ببینی",
    arrived: "رسیدی به",
    enter: "ورود",
    fullscreen: "تمام‌صفحه",
    exitFullscreen: "خروج از تمام‌صفحه",
    labIntro: "پایگاه خودت را با مهارت‌های من بساز. هر ساختمان یکی از مهارت‌های واقعی من است و سطح مهارت، اندازه‌ی ساختمان را تعیین می‌کند.",
    builder: {
      start: "ساخت پایگاه",
      exit: "خروج",
      reset: "بازنشانی",
      hint: "ساختمان‌ها را از نوار پایین بکش و روی شبکه بگذار. دوباره بکش تا جابه‌جا شود؛ برگرداندنش روی نوار، حذفش می‌کند.",
      power: "قدرت پایگاه",
      online: "فعال",
      level: "سطح",
      complete: "پایگاه فول‌استک آنلاین شد",
      completeSub: "همه‌ی {n} مهارت سر جایشان نشسته‌اند و به هم وصل‌اند.",
      names: ["تالار پایه", "مولد انرژی", "برج سپر", "راکتور هسته", "آنتن موجی", "سیلوی داده", "گره شاخه", "خزانه سرور", "حیاط کانتینر"],
    },
    places: {
      about: { title: "درباره من", sub: "من کیستم" },
      lab: { title: "آزمایشگاه", sub: "هسته تعاملی" },
      experience: { title: "سوابق", sub: "مسیر کاری من" },
      skills: { title: "مهارت‌ها", sub: "ابزارهای من" },
      projects: { title: "نمونه‌کارها", sub: "کارهایم را ببین" },
      contact: { title: "تماس", sub: "بیا حرف بزنیم" },
    },
  },
  en: {
    logoSub: "Explore my universe",
    navExplore: "Explore",
    navResume: "Resume",
    explore: "Explore universe",
    viewResume: "View resume",
    destinations: "Destinations",
    scroll: "Scroll to explore",
    location: "Location",
    deepSpace: "Deep space",
    distance: "Distance",
    speed: "Speed",
    takeOff: "Take off",
    info: "Info",
    landing: "Entering the atmosphere…",
    lite: "Lite version",
    back3d: "Back to the 3D universe",
    close: "Close",
    email: "Email",
    telegram: "Telegram",
    github: "GitHub",
    outsideView: "Outside view",
    cockpitView: "Cockpit view",
    flightSpeed: "Flight speed",
    lookHint: "Drag to look around the cabin",
    arrived: "Arrived at",
    enter: "Enter",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    labIntro: "Build your own base out of my skills. Every building is one of my real skills, and the skill level sets the building's size.",
    builder: {
      start: "Build the base",
      exit: "Exit",
      reset: "Reset",
      hint: "Drag buildings from the bar onto the grid. Drag again to move one; drop it back on the bar to remove it.",
      power: "Base power",
      online: "Online",
      level: "Level",
      complete: "Full-stack base online",
      completeSub: "All {n} skills are in place and linked.",
      names: ["Foundation Hall", "Power Generator", "Shield Tower", "Core Reactor", "Wave Antenna", "Data Silo", "Branch Node", "Server Vault", "Container Yard"],
    },
    places: {
      about: { title: "About", sub: "Who I am" },
      lab: { title: "Lab", sub: "The interactive core" },
      experience: { title: "Experience", sub: "Where I've worked" },
      skills: { title: "Skills", sub: "Tools I reach for" },
      projects: { title: "Projects", sub: "Explore my work" },
      contact: { title: "Contact", sub: "Let's talk" },
    },
  },
};
