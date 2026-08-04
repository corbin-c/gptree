browser.action.onClicked.addListener(() => {
  browser.sidebarAction.toggle();
});

// Relay switch-to-node messages from sidebar to ChatGPT content script
browser.runtime.onMessage.addListener((message: any, sender: any) => {
  if (message.type === "gptree:switch-to-node") {
    console.log("[gptree-bg] received switch-to-node, targetId:", message.targetId);

    // Helper: send to a specific tab
    const sendToTab = (tab: any) => {
      if (tab?.id == null) return;
      console.log("[gptree-bg] sending to tab", tab.id);
      browser.tabs.sendMessage(tab.id, {
        type: "gptree:switch-to-node",
        targetId: message.targetId,
      }).then(() => {
        console.log("[gptree-bg] sent successfully to tab", tab.id);
      }).catch((err: any) => {
        console.log("[gptree-bg] sendMessage failed:", err?.message || err);
      });
    };

    // Step 1: Try the currently active tab
    browser.tabs.query({ active: true, currentWindow: true }).then((activeTabs) => {
      console.log("[gptree-bg] active tab:", activeTabs[0]?.id, activeTabs[0]?.url);
      if (activeTabs.length > 0 && (activeTabs[0].url ?? "").includes("chatgpt.com")) {
        // Active tab is a ChatGPT tab — use it
        sendToTab(activeTabs[0]);
      } else {
        // Step 2: Fall back to all ChatGPT tabs, pick the first
        console.log("[gptree-bg] active tab is not ChatGPT, falling back to all ChatGPT tabs");
        browser.tabs.query({ url: "*://chatgpt.com/*" }).then((tabs) => {
          console.log("[gptree-bg] tabs.query returned", tabs.length, "tabs:", tabs.map((t: any) => `${t.id}:${t.url}`));
          if (tabs.length > 0) {
            sendToTab(tabs[0]);
          } else {
            console.log("[gptree-bg] no ChatGPT tabs found!");
          }
        }).catch((err: any) => {
          console.log("[gptree-bg] tabs.query failed:", err?.message || err);
        });
      }
    }).catch((err: any) => {
      console.log("[gptree-bg] tabs.query (active) failed:", err?.message || err);
    });
    return false;
  }
  console.log("[gptree-bg] unhandled message type:", message?.type);
});
