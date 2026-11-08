const KEY = "universe-mode";

/** The visitor's own choice between the 3D universe and the plain page (remembered on this device). */
export function prefersLite(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "lite";
  } catch {
    return false;
  }
}

export function setLitePreference(lite: boolean) {
  try {
    if (lite) window.localStorage.setItem(KEY, "lite");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage can be blocked: the choice then only lasts for this visit */
  }
}
