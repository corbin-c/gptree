import type { PlasmoCSConfig } from "plasmo";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "../components/App";
import { installInterceptor } from "../lib/interceptor";
import "../styles/global.css";

export const config: PlasmoCSConfig = {
  matches: ["https://chatgpt.com/c/*"],
  world: "MAIN",
};

// ── Mount React into ChatGPT's page ────────────────────────────────

const container = document.createElement("div");
container.id = "gptree-root";
document.body.appendChild(container);

const root = createRoot(container);
root.render(React.createElement(App));

// ── Listen for ChatGPT theme changes ────────────────────────────────

function syncTheme(): void {
  const html = document.documentElement;
  const isDark =
    html.classList.contains("dark") ||
    html.getAttribute("data-theme") === "dark";

  if (isDark) {
    container.classList.add("gptree-dark");
    container.classList.remove("gptree-light");
  } else {
    container.classList.add("gptree-light");
    container.classList.remove("gptree-dark");
  }
}

syncTheme();

installInterceptor();

const themeObserver = new MutationObserver(syncTheme);
themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class", "data-theme"],
});
