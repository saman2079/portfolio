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
  outsideView: string;
  cockpitView: string;
  flightSpeed: string;
  lookHint: string;
  arrived: string;
  enter: string;
  fullscreen: string;
  exitFullscreen: string;
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
    outsideView: "نمای بیرون",
    cockpitView: "نمای کابین",
    flightSpeed: "سرعت پرواز",
    lookHint: "بکش تا داخل کابین را ببینی",
    arrived: "رسیدی به",
    enter: "ورود",
    fullscreen: "تمام‌صفحه",
    exitFullscreen: "خروج از تمام‌صفحه",
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
    outsideView: "Outside view",
    cockpitView: "Cockpit view",
    flightSpeed: "Flight speed",
    lookHint: "Drag to look around the cabin",
    arrived: "Arrived at",
    enter: "Enter",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
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
