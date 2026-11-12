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
    game: {
      tabSkills: string;
      tabGame: string;
      crystal: string;
      energy: string;
      placing: string;
      cancel: string;
      upgrade: string;
      move: string;
      sell: string;
      collect: string;
      stored: string;
      perMin: string;
      max: string;
      wave: string;
      callWave: string;
      scout: { enter: string; exit: string; keys: string; touch: string; battery: string; found: string; discovered: string; names: string[]; bases: string; power: string; attack: string; cooldown: string; wave: string };
      attack: { enter: string; exit: string; go: string; keys: string; touch: string; kills: string; hp: string; wave: string; left: string; win: string; fail: string };
      repelled: string;
      raided: string;
      toast: { poor: string; max: string; full: string; nospace: string };
      names: Record<"hq" | "extractor" | "generator" | "storage" | "turret" | "wall", string>;
      info: Record<"hq" | "extractor" | "generator" | "storage" | "turret" | "wall", string>;
    };
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
      game: {
        tabSkills: "مهارت‌ها",
        tabGame: "ساخت‌وساز",
        crystal: "کریستال",
        energy: "انرژی",
        placing: "{name}: روی یک خانه‌ی خالی بزن",
        cancel: "لغو",
        upgrade: "ارتقا",
        move: "جابه‌جایی",
        sell: "فروش",
        collect: "برداشت",
        stored: "ذخیره",
        perMin: "در دقیقه",
        max: "حداکثر سطح",
        wave: "موج",
        callWave: "فراخوانی موج",
        scout: {
          enter: "پهپاد",
          exit: "فرود پهپاد",
          keys: "حرکت: WASD یا کلیدهای جهت · خروج: Esc",
          touch: "با جوی‌استیک پهپاد را حرکت بده",
          battery: "باتری",
          found: "پایگاه دشمن",
          discovered: "پایگاه دشمن پیدا شد: {name}",
          names: ["پست سرخ", "اردوگاه یخی", "دژ غارتگران"],
          bases: "پایگاه‌های دشمن",
          power: "قدرت",
          attack: "اعزام",
          cooldown: "بازسازی {m} دقیقه",
          wave: "موج در جریان است",
        },
        attack: {
          enter: "حالت حمله",
          exit: "بازگشت",
          go: "نقطه‌ی حمله",
          keys: "حرکت: WASD · هدف: ماوس · شلیک: کلیک یا Space",
          touch: "چپ: حرکت · راست: شلیک (هدف‌گیری خودکار)",
          kills: "کشتار",
          hp: "سلامت",
          wave: "موج",
          left: "مدافع",
          win: "پایگاه تصرف شد!",
          fail: "حمله شکست خورد",
        },
        repelled: "موج {n} دفع شد",
        raided: "پایگاه غارت شد؛ موج {n} دوباره می‌آید",
        toast: {
          poor: "منابع کافی نیست",
          max: "به سقف تعداد رسیدی",
          full: "انبار پر است؛ ذخیره‌گاه بساز یا ارتقا بده",
          nospace: "اینجا جا نیست",
        },
        names: { hq: "مرکز فرماندهی", extractor: "استخراج‌کننده", generator: "مولد انرژی", storage: "ذخیره‌گاه", turret: "برج دفاعی", wall: "دیوار" },
        info: {
          hq: "قلب پایگاه؛ سقف انبار را مشخص می‌کند",
          extractor: "کریستال تولید می‌کند",
          generator: "انرژی تولید می‌کند",
          storage: "سقف منابع را بالا می‌برد",
          turret: "از پایگاه دفاع می‌کند (به‌زودی)",
          wall: "راه دشمن را می‌بندد (به‌زودی)",
        },
      },
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
      game: {
        tabSkills: "Skills",
        tabGame: "Colony",
        crystal: "Crystal",
        energy: "Energy",
        placing: "{name}: tap a free cell",
        cancel: "Cancel",
        upgrade: "Upgrade",
        move: "Move",
        sell: "Sell",
        collect: "Collect",
        stored: "Stored",
        perMin: "per min",
        max: "Max level",
        wave: "Wave",
        callWave: "Call wave",
        scout: {
          enter: "Drone",
          exit: "Land drone",
          keys: "Move: WASD or arrows · Exit: Esc",
          touch: "Fly the drone with the joystick",
          battery: "Battery",
          found: "Enemy bases",
          discovered: "Enemy base found: {name}",
          names: ["Red Outpost", "Frost Camp", "Raider Fort"],
          bases: "Enemy bases",
          power: "Power",
          attack: "Deploy",
          cooldown: "rebuilding {m} min",
          wave: "A wave is attacking",
        },
        attack: {
          enter: "Attack mode",
          exit: "Back",
          go: "Go to attack",
          keys: "Move: WASD · Aim: mouse · Fire: click or Space",
          touch: "Left: move · Right: fire (auto-aim)",
          kills: "Kills",
          hp: "Health",
          wave: "Wave",
          left: "Defenders",
          win: "Base captured!",
          fail: "Assault failed",
        },
        repelled: "Wave {n} repelled",
        raided: "The base was raided; wave {n} comes again",
        toast: {
          poor: "Not enough resources",
          max: "You reached the limit for this one",
          full: "Storage is full: build or upgrade storage",
          nospace: "No room here",
        },
        names: { hq: "Command Center", extractor: "Extractor", generator: "Generator", storage: "Storage", turret: "Turret", wall: "Wall" },
        info: {
          hq: "The heart of the base; sets the storage cap",
          extractor: "Produces crystal",
          generator: "Produces energy",
          storage: "Raises the resource cap",
          turret: "Defends the base (coming soon)",
          wall: "Blocks the enemy's path (coming soon)",
        },
      },
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
