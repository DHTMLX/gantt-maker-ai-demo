import { type GanttStatic } from "@dhx/trial-gantt";

export type Theme = "dark" | "light";

const MESSAGE_PREFIX = "gx-theme:";
const LIGHT_SKIN = "terrace";
const DARK_SKIN = "dark";

declare global {
  interface Window {
    __demoTheme?: string;
  }
}

function darkQuery(): MediaQueryList | null {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)");
  } catch (e) {
    return null;
  }
}

export function getInitialTheme(): Theme {
  const guess = window.__demoTheme;
  if (guess === "dark" || guess === "light") return guess;
  return darkQuery()?.matches ? "dark" : "light";
}

export function skinFor(theme: Theme): string {
  return theme === "dark" ? DARK_SKIN : LIGHT_SKIN;
}

export function initThemeSync(gantt: GanttStatic): void {
  let current = getInitialTheme();

  function apply(theme: Theme): void {
    if (theme === current) return;
    current = theme;
    gantt.setSkin(skinFor(theme));
  }

  window.addEventListener("message", (e: MessageEvent) => {
    if (typeof e.data !== "string" || e.data.indexOf(MESSAGE_PREFIX) !== 0) return;
    const value = e.data.slice(MESSAGE_PREFIX.length);
    if (value === "dark" || value === "light") apply(value);
  });

  const query = darkQuery();
  if (query) {
    const onChange = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
    if (query.addEventListener) query.addEventListener("change", onChange);
    else query.addListener(onChange);
  }
}
