import { holo } from "@/lib/store/holoStore";

let audio: HTMLAudioElement | null = null;

/** Play or pause the cabin music. The file is only downloaded the first time it is played. */
export function toggleMusic() {
  if (typeof window === "undefined") return;
  if (!audio) {
    audio = new Audio("/audio/stay.mp3");
    audio.loop = true;
    audio.volume = 0.6;
    audio.preload = "none";
    audio.addEventListener("pause", () => {
      holo.music = false;
    });
    audio.addEventListener("playing", () => {
      holo.music = true;
    });
  }
  if (audio.paused) {
    void audio.play().catch(() => {
      holo.music = false;
    });
  } else {
    audio.pause();
  }
}
