const STORAGE_KEY = "ai_copilot_theme";

let currentTheme = "dark";

export function getTheme() {
  return currentTheme;
}

function apply(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  currentTheme = theme;
}

export function initTheme() {
  let initial = "dark";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      initial = saved;
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      initial = "light";
    }
  } catch {

  }
  apply(initial);
  return initial;
}

export function setTheme(theme) {
  if (theme !== "dark" && theme !== "light") return;
  apply(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {

  }
}

export function toggleTheme() {
  setTheme(currentTheme === "dark" ? "light" : "dark");
  return currentTheme;
}
