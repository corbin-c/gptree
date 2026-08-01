let requestId = 0;

export const sidebarAction = {
  toggle(): void {
    window.postMessage({ type: "gptree:bridge-toggle-sidebar" }, "*");
  },

  isOpen(): Promise<boolean> {
    const id = ++requestId;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener("message", handler);
        resolve(false);
      }, 2000);

      const handler = (event: MessageEvent) => {
        if (event.data?.id !== id) return;
        if (event.data?.type === "gptree:bridge-response") {
          clearTimeout(timeout);
          window.removeEventListener("message", handler);
          resolve(event.data.isOpen ?? false);
        }
        if (event.data?.type === "gptree:bridge-error") {
          clearTimeout(timeout);
          window.removeEventListener("message", handler);
          resolve(false);
        }
      };
      window.addEventListener("message", handler);
      window.postMessage({ type: "gptree:bridge-is-open", id }, "*");
    });
  },
};

export const runtime = {
  sendMessage(message: unknown): void {
    window.postMessage({ type: "gptree:bridge-send-message", message }, "*");
  },
};
