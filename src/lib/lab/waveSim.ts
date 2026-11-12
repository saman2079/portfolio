import { CELL, ORIGIN, PLATFORM } from "@/lib/lab/baseStore";
import { TYPES, gameStore, type Building, type BuildingType } from "@/lib/lab/gameStore";

/**
 * Strategy mode: enemy waves that raid the colony while the base builder is open.
 * Pure simulation (no three.js): WaveLayer reads this state every frame and draws it.
 * Positions are surface-local x/z, the same space the buildings use.
 *
 *  - a wave starts on a timer (or "call wave"); enemies come from the edge of the plate
 *  - they walk to the nearest building (walls last) and hit whatever blocks them
 *  - turrets and the command centre shoot back; a building at 0 HP is down until the raid ends
 *  - repel everything: reward and the next wave is stronger; lose the command centre: 30% of resources
 *    are stolen and the same wave comes again. Nothing is ever permanently lost.
 */
export type EnemyKind = "scout" | "brute";
export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  z: number;
  hp: number;
  max: number;
  speed: number;
  dps: number;
  target: string | null;
  face: number;
}
export interface Shot {
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
  t: number;
}
export interface RaidResult {
  win: boolean;
  wave: number;
  c: number;
  e: number;
  at: number;
}

export const HP_BASE: Record<BuildingType, number> = { hq: 400, extractor: 120, generator: 120, storage: 150, turret: 160, wall: 200 };
export const maxHp = (b: Building) => HP_BASE[b.type] * (1 + 0.5 * (b.level - 1));

const FIRST_WAIT = 90;
const NEXT_WAIT = 75;
const SPAWN_R = 27;
const KIND = {
  scout: { hp: 30, speed: 4.2, dps: 5 },
  brute: { hp: 140, speed: 2.2, dps: 16 },
} as const;

export const sim = {
  running: false,
  active: false,
  timer: FIRST_WAIT,
  queue: [] as EnemyKind[],
  spawnCd: 0,
  hpMul: 1,
  dpsMul: 1,
  enemies: [] as Enemy[],
  /** garrisons of the enemy bases near the player in attack mode (raidSim owns and moves them) */
  defenders: [] as Enemy[],
  /** the enemy base the current wave comes from (-1 = unknown), set by raidSim's picker */
  origin: -1,
  originAngle: null as number | null,
  /** chooses where a wave comes from; null = every enemy base is down, so no wave for now */
  pickOrigin: null as null | (() => { id: number; angle: number; mul: number } | null),
  hp: {} as Record<string, number>,
  cd: {} as Record<string, number>,
  shots: [] as Shot[],
  result: null as RaidResult | null,
  nextId: 1,
};

export function resetSim() {
  sim.running = false;
  sim.active = false;
  sim.timer = FIRST_WAIT;
  sim.queue = [];
  sim.enemies = [];
  sim.defenders = [];
  sim.shots = [];
  sim.hp = {};
  sim.cd = {};
}

export const centreOf = (b: Building): [number, number] => {
  const t = TYPES[b.type];
  return [ORIGIN.x + (b.gx + t.w / 2) * CELL, ORIGIN.z + (b.gz + t.h / 2) * CELL];
};
const alive = (b: Building) => (sim.hp[b.id] ?? 1) > 0;

/** wave n: more scouts every wave, a brute every third wave, everything a little tougher */
function startWave() {
  const n = gameStore.get().wave;
  let mul = 1;
  sim.origin = -1;
  sim.originAngle = null;
  if (sim.pickOrigin) {
    const o = sim.pickOrigin();
    if (!o) {
      // every enemy base is down: a quiet spell
      sim.timer = NEXT_WAIT;
      return;
    }
    sim.origin = o.id;
    sim.originAngle = o.angle;
    mul = o.mul;
  }
  const scouts = Math.max(1, Math.round((2 + Math.floor(n * 1.2)) * mul));
  const brutes = Math.floor((n - 1) / 3);
  const q: EnemyKind[] = Array.from({ length: scouts }, () => "scout");
  for (let i = 0; i < brutes; i++) q.splice(Math.min(q.length, 2 + i * 3), 0, "brute");
  sim.queue = q;
  sim.spawnCd = 0;
  sim.hpMul = 1 + 0.18 * (n - 1);
  sim.dpsMul = 1 + 0.1 * (n - 1);
  sim.active = true;
  sim.result = null;
}

function finish(win: boolean, bs: Building[]) {
  const wave = gameStore.get().wave;
  const got = gameStore.endRaid(win);
  sim.result = { win, wave, c: got.c, e: got.e, at: Date.now() };
  sim.active = false;
  sim.enemies = [];
  sim.queue = [];
  sim.shots = [];
  sim.timer = NEXT_WAIT;
  for (const b of bs) sim.hp[b.id] = maxHp(b);
}

export function callWave() {
  if (!sim.active) sim.timer = 0;
}

export function updateSim(rawDt: number) {
  const dt = Math.min(rawDt, 0.05);
  const bs = gameStore.get().buildings;
  const hq = bs.find((b) => b.type === "hq");
  if (!hq) return;
  sim.running = true;

  // keep the hit-point table in step with the buildings (new, upgraded, sold)
  const ids = new Set<string>();
  for (const b of bs) {
    ids.add(b.id);
    const mx = maxHp(b);
    if (sim.hp[b.id] === undefined || !sim.active) sim.hp[b.id] = mx;
    else if (sim.hp[b.id]! > mx) sim.hp[b.id] = mx;
  }
  for (const id of Object.keys(sim.hp)) if (!ids.has(id)) delete sim.hp[id];

  for (let i = sim.shots.length - 1; i >= 0; i--) {
    sim.shots[i]!.t -= dt;
    if (sim.shots[i]!.t <= 0) sim.shots.splice(i, 1);
  }

  if (!sim.active) {
    sim.timer -= dt;
    if (sim.timer <= 0) startWave();
    return;
  }

  // spawn one enemy at a time from a random point on the rim of the plate
  sim.spawnCd -= dt;
  if (sim.queue.length && sim.spawnCd <= 0) {
    const kind = sim.queue.shift()!;
    // raiders come from the side of the base that sent the wave, if known
    const a = sim.originAngle === null ? Math.random() * Math.PI * 2 : sim.originAngle + (Math.random() - 0.5) * 0.9;
    const k = KIND[kind];
    const hp = k.hp * sim.hpMul;
    sim.enemies.push({
      id: sim.nextId++,
      kind,
      x: PLATFORM.x + Math.cos(a) * SPAWN_R,
      z: PLATFORM.z + Math.sin(a) * SPAWN_R,
      hp,
      max: hp,
      speed: k.speed,
      dps: k.dps * sim.dpsMul,
      target: null,
      face: 0,
    });
    sim.spawnCd = 0.8;
  }

  const live = bs.filter(alive);
  const walls = live.filter((b) => b.type === "wall");
  for (const e of sim.enemies) {
    let t = e.target ? live.find((b) => b.id === e.target) : undefined;
    if (!t) {
      let best = Infinity;
      for (const b of live) {
        const [cx, cz] = centreOf(b);
        const d = Math.hypot(cx - e.x, cz - e.z) + (b.type === "wall" ? 40 : 0); // walls only when nothing else is left
        if (d < best) {
          best = d;
          t = b;
        }
      }
      e.target = t?.id ?? null;
    }
    if (!t) continue;
    const [tx, tz] = centreOf(t);
    const dx = tx - e.x;
    const dz = tz - e.z;
    const dist = Math.hypot(dx, dz) || 1;
    e.face = Math.atan2(dx, dz);
    // a wall in the way gets hit first
    let att = t;
    for (const w of walls) {
      const [wx, wz] = centreOf(w);
      const wd = Math.hypot(wx - e.x, wz - e.z);
      if (wd < 2.4 && ((wx - e.x) * dx + (wz - e.z) * dz) / (wd * dist || 1) > 0.4) {
        att = w;
        break;
      }
    }
    const [ax, az] = centreOf(att);
    const reach = (Math.max(TYPES[att.type].w, TYPES[att.type].h) * CELL) / 2 + 0.8;
    if (Math.hypot(ax - e.x, az - e.z) > reach) {
      e.x += (dx / dist) * e.speed * dt;
      e.z += (dz / dist) * e.speed * dt;
    } else {
      sim.hp[att.id] = (sim.hp[att.id] ?? 0) - e.dps * dt;
      if ((sim.hp[att.id] ?? 0) <= 0) e.target = null;
    }
  }

  // turrets shoot the nearest enemy in range; the command centre has a weak gun of its own
  for (const b of live) {
    if (b.type !== "turret" && b.type !== "hq") continue;
    sim.cd[b.id] = (sim.cd[b.id] ?? 0) - dt;
    if ((sim.cd[b.id] ?? 0) > 0) continue;
    const [cx, cz] = centreOf(b);
    const range = b.type === "turret" ? 15 : 9;
    let target: Enemy | null = null;
    let best = range;
    for (const e of sim.enemies) {
      const d = Math.hypot(e.x - cx, e.z - cz);
      if (d < best) {
        best = d;
        target = e;
      }
    }
    if (!target) continue;
    target.hp -= (b.type === "turret" ? 10 : 5) * b.level;
    sim.cd[b.id] = b.type === "turret" ? 0.9 : 1.2;
    sim.shots.push({ x1: cx, y1: b.type === "turret" ? 2.6 : 6, z1: cz, x2: target.x, y2: 0.9, z2: target.z, t: 0.12 });
  }
  sim.enemies = sim.enemies.filter((e) => e.hp > 0);

  if ((sim.hp[hq.id] ?? 1) <= 0) finish(false, bs);
  else if (!sim.queue.length && !sim.enemies.length) finish(true, bs);
}
