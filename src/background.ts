browser.action.onClicked.addListener(() => {
  browser.sidebarAction.toggle();
});

// Relay switch-to-node messages from sidebar to ChatGPT content script
browser.runtime.onMessage.addListener((message: any, sender: any) => {
  if (message.type === "gptree:switch-to-node") {
    console.log("[gptree-bg] received switch-to-node, targetId:", message.targetId);
    browser.tabs.query({ url: "*://chatgpt.com/*" }).then((tabs) => {
      console.log("[gptree-bg] tabs.query returned", tabs.length, "tabs:", tabs.map((t: any) => `${t.id}:${t.url}`));
      if (tabs.length > 0 && tabs[0].id != null) {
        console.log("[gptree-bg] sending to tab", tabs[0].id);
        browser.tabs.sendMessage(tabs[0].id, {
          type: "gptree:switch-to-node",
          targetId: message.targetId,
        }).then(() => {
          console.log("[gptree-bg] sent successfully to tab", tabs[0].id);
        }).catch((err: any) => {
          console.log("[gptree-bg] sendMessage failed:", err?.message || err);
        });
      } else {
        console.log("[gptree-bg] no ChatGPT tabs found!");
      }
    }).catch((err: any) => {
      console.log("[gptree-bg] tabs.query failed:", err?.message || err);
    });
    return false; // No async response, fire-and-forget
  }
  console.log("[gptree-bg] unhandled message type:", message?.type);
});
