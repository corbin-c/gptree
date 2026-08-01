import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["https://chatgpt.com/c/*"],
};

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type === "gptree:send") {
    browser.runtime.sendMessage(event.data.message).catch(() => {});
  }
});
