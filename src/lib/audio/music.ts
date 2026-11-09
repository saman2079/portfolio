import { holo } from "@/lib/store/holoStore";

export interface MusicState {
  open: boolean;
  playing: boolean;
  time: number;
  duration: number;
  volume: number;
}

const TRACK = "/audio/interstellar.mp3";
let state: MusicState = { open: false, playing: false, time: 0, duration: 199.5, volume: 0.6 };
const listeners = new Set<() => void>();
const set = (patch: Partial<MusicState>) => {
  state = { ...state, ...patch };
  holo.music = state.playing;
  listeners.forEach((l) => l());
};

let audio: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let gain: GainNode | null = null;
let freq: Uint8Array | null = null;

function ensure() {
  if (audio) return audio;
  audio = new Audio(TRACK);
  audio.loop = true;
  audio.preload = "none";
  audio.volume = state.volume;
  audio.addEventListener("playing", () => set({ playing: true }));
  audio.addEventListener("pause", () => set({ playing: false }));
  audio.addEventListener("loadedmetadata", () => {
    if (audio && Number.isFinite(audio.duration)) set({ duration: audio.duration });
  });
  let last = 0;
  audio.addEventListener("timeupdate", () => {
    if (!audio) return;
    const now = performance.now();
    if (now - last < 250) return;
    last = now;
    set({ time: audio.currentTime });
  });
  return audio;
}

/** Routes the track through an analyser (for the visualiser) and a gain node (volume also works on iOS). */
function wire(a: HTMLAudioElement) {
  if (ctx) return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    const src = ctx.createMediaElementSource(a);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    gain = ctx.createGain();
    gain.gain.value = state.volume;
    a.volume = 1;
    src.connect(analyser);
    analyser.connect(gain);
    gain.connect(ctx.destination);
    freq = new Uint8Array(analyser.frequencyBinCount);
  } catch {
    ctx = null;
    analyser = null;
    gain = null;
  }
}

export const music = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  play() {
    const a = ensure();
    wire(a);
    void ctx?.resume();
    void a.play().catch(() => set({ playing: false }));
  },
  pause() {
    audio?.pause();
  },
  toggle() {
    if (state.playing) music.pause();
    else music.play();
  },
  /** the dash button: shows or hides the player; the track keeps playing when it is hidden */
  toggleOpen() {
    if (state.open) {
      set({ open: false });
    } else {
      set({ open: true });
      if (!state.playing) music.play();
    }
  },
  /** hide the player without touching the music */
  close() {
    set({ open: false });
  },
  seek(t: number) {
    const a = ensure();
    a.currentTime = Math.max(0, Math.min(state.duration - 0.5, t));
    set({ time: a.currentTime });
  },
  skip(delta: number) {
    music.seek((audio?.currentTime ?? state.time) + delta);
  },
  setVolume(v: number) {
    const vol = Math.max(0, Math.min(1, v));
    if (gain) gain.gain.value = vol;
    else if (audio) audio.volume = vol;
    set({ volume: vol });
  },
  /** Fills `out` with 0..1 spectrum values and returns the overall level. Real data when the analyser works. */
  spectrum(out: number[], t: number) {
    const n = out.length;
    if (analyser && freq && state.playing) {
      analyser.getByteFrequencyData(freq);
      let sum = 0;
      const step = Math.max(1, Math.floor((freq.length * 0.75) / n));
      for (let i = 0; i < n; i++) {
        const v = (freq[Math.min(freq.length - 1, i * step)] ?? 0) / 255;
        out[i] = v;
        sum += v;
      }
      return sum / n;
    }
    // no analyser (or paused): a slow breathing pattern so the screen is never dead
    const amp = state.playing ? 0.35 : 0.06;
    for (let i = 0; i < n; i++) out[i] = amp * (0.5 + 0.5 * Math.sin(t * 2 + i * 0.7)) ;
    return amp * 0.5;
  },
};

export const toggleMusic = music.toggleOpen;
