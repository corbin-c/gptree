browser.action.onClicked.addListener(() => {
  browser.sidebarAction.toggle();
});

// Relay switch-to-node messages from sidebar to ChatGPT content script
browser.runtime.onMessage.addListener((message: any, sender: any) => {
  if (message.type === "gptree:switch-to-node") {
    browser.tabs.query({ url: "https://chatgpt.com/c/*" }).then((tabs) => {
      if (tabs.length > 0 && tabs[0].id != null) {
        browser.tabs.sendMessage(tabs[0].id, {
          type: "gptree:switch-to-node",
          targetId: message.targetId,
        }).catch(() => {});
      }
    }).catch(() => {});
    return false; // No async response, fire-and-forget
  }
});
