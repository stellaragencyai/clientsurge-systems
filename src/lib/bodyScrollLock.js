const LOCK_STATE_KEY = "__clientsurgeBodyScrollLockState__";

function getLockState() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!window[LOCK_STATE_KEY]) {
    window[LOCK_STATE_KEY] = {
      tokens: new Set(),
      nextId: 0,
      scrollY: 0,
    };
  }

  return window[LOCK_STATE_KEY];
}

export function acquireBodyScrollLock(reason = "overlay") {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const body = document.body;
  const state = getLockState();
  if (!body || !state) {
    return () => {};
  }

  const token = `${reason}:${state.nextId++}`;

  // Multiple homepage overlays were each writing body overflow directly.
  // That let one cleanup undo another lock, or restore "hidden" after the
  // triggering menu had already closed. Keep one shared lock source instead.
  if (state.tokens.size === 0) {
    state.scrollY = window.scrollY || window.pageYOffset || 0;
    body.style.setProperty("--scroll-lock-top", `-${state.scrollY}px`);
    body.classList.add("nav-open");
  }

  state.tokens.add(token);

  let released = false;
  return () => {
    if (released) {
      return;
    }

    released = true;
    state.tokens.delete(token);

    if (state.tokens.size > 0) {
      return;
    }

    const restoreY = state.scrollY;
    body.classList.remove("nav-open");
    body.style.removeProperty("--scroll-lock-top");
    state.scrollY = 0;
    window.scrollTo(0, restoreY);
  };
}
