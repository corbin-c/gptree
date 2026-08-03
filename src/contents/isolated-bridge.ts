import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["https://chatgpt.com/c/*", "https://chatgpt.com/g/*/c/*"],
};

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type === "gptree:send") {
    browser.runtime.sendMessage(event.data.message).catch(() => {});
  }
});

type GptreeMessage =
  | { type: "gptree:switch-to-node"; targetId: string }
  | { type: "gptree:get-conversation" };

browser.runtime.onMessage.addListener((message: GptreeMessage) => {
  console.log("[gptree-bridge] runtime.onMessage received:", message?.type);
  if (message.type === "gptree:switch-to-node") {
    console.log("[gptree-bridge] forwarding switch-to-node:", message.targetId);
    window.postMessage({ type: "gptree:switch-to-node", targetId: message.targetId }, "*");
    return;
  }
  if (message.type === "gptree:get-conversation") {
    window.postMessage({ type: "gptree:get-conversation" }, "*");
    return;
  }
});
