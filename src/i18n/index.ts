import type { Locale } from "./config";
import type { Dictionary } from "./types";
import { fa } from "./fa";
import { en } from "./en";

const dictionaries: Record<Locale, Dictionary> = { fa, en };
export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];
