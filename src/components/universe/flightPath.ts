import { CatmullRomCurve3, Vector3 } from "three";
import { DESTINATIONS } from "@/lib/universe/destinations";

/**
 * The route: start → one docking point per planet. Each docking point sits on the
 * side facing the centre line, 3.4 radii from the planet, so the ship passes the
 * planet instead of through it and arrives with it filling the windshield.
 * Control point i is reached at u = i / (n - 1), which is what `stationU` assumes.
 */
export function buildFlightPath() {
  const points: Vector3[] = [new Vector3(0, 0, 0)];
  for (const d of DESTINATIONS) {
    const dist = d.radius * 3.4;
    const side = d.position[0] < 0 ? 1 : -1;
    points.push(
      new Vector3(
        d.position[0] + side * dist * 0.8,
        d.position[1] + d.radius * 0.5,
        d.position[2] + dist * 0.55
      )
    );
  }
  const curve = new CatmullRomCurve3(points, false, "centripetal");
  return { curve, points };
}
