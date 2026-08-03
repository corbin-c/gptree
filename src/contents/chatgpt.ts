import type { PlasmoCSConfig } from "plasmo";
import { installInterceptor } from "../lib/interceptor";

export const config: PlasmoCSConfig = {
  matches: ["https://chatgpt.com/c/*", "https://chatgpt.com/g/*/c/*"],
  world: "MAIN",
};

installInterceptor();

// ── Conversation data captured from the interceptor ────────────────
let conversationMapping: Record<string, any> | null = null;
let conversationId: string | null = null;

window.addEventListener("message", (event) => {
  if (event.data?.message?.type !== "gptree:conversation") return;

  const payload = event.data.message.payload;
  if (!payload) return;

  conversationMapping = payload.mapping ?? null;
  conversationId = payload.conversation_id ?? null;
});

let lastCurrentNode: string | null = null;

setInterval(() => {
  const containers = document.querySelectorAll("[data-turn-id-container]");
  if (containers.length === 0) return;

  const lastContainer = containers[containers.length - 1];
  const currentTurnId = lastContainer.getAttribute("data-turn-id-container");
  if (currentTurnId === lastCurrentNode) return;
  if (currentTurnId === null) return;

  lastCurrentNode = currentTurnId;

  window.postMessage({
    type: "gptree:send",
    message: {
      type: "gptree:current-node-changed",
      payload: { current_node: currentTurnId },
    },
  });
}, 500);

// ── Remote navigation from sidebar ─────────────────────────────────
window.addEventListener("message", (event) => {
  if (event.data?.type !== "gptree:switch-to-node") return;
  const targetId = event.data?.targetId;
  console.log("[gptree-main] switch-to-node received, targetId:", targetId, "mapping:", !!conversationMapping);
  if (targetId) switchToNode(targetId);
});

async function switchToNode(targetId: string): Promise<void> {
  const mapping = conversationMapping;
  if (!mapping) {
    console.log("[gptree-main] switchToNode: no mapping available");
    return;
  }

  const currentId = getCurrentNodeFromDOM();
  console.log("[gptree-main] switchToNode: currentId:", currentId, "targetId:", targetId);
  if (!currentId || currentId === targetId) return;

  const currentPath = buildPath(mapping, currentId);
  const targetPath = buildPath(mapping, targetId);
  if (currentPath.length === 0 || targetPath.length === 0) return;

  // Find LCA (lowest common ancestor) by comparing paths from the root
  let lcaIndex = -1;
  const minLen = Math.min(currentPath.length, targetPath.length);
  for (let i = 0; i < minLen; i++) {
    if (currentPath[currentPath.length - 1 - i] === targetPath[targetPath.length - 1 - i]) {
      lcaIndex = i;
    } else {
      break;
    }
  }

  // Walk from LCA down the target path, cycling branches at each level
  const lcaPosInTarget = targetPath.length - 1 - lcaIndex;
  for (let i = lcaPosInTarget - 1; i >= 0; i--) {
    const parentId = targetPath[i + 1];
    const childId = targetPath[i];
    await cycleToChild(mapping, parentId, childId);
    await sleep(300);
  }
}

function buildPath(mapping: Record<string, any>, nodeId: string): string[] {
  const path: string[] = [];
  let cursor: string | null = nodeId;
  while (cursor && mapping[cursor]) {
    path.push(cursor);
    cursor = mapping[cursor].parent;
  }
  return path;
}

function getCurrentNodeFromDOM(): string | null {
  const containers = document.querySelectorAll("[data-turn-id-container]");
  if (containers.length === 0) return null;
  return containers[containers.length - 1].getAttribute("data-turn-id-container");
}

async function cycleToChild(
  mapping: Record<string, any>,
  parentId: string,
  targetChildId: string,
): Promise<void> {
  console.log("[gptree-main] cycleToChild: parentId:", parentId, "targetChildId:", targetChildId);

  const siblings = mapping[parentId]?.children as string[] | undefined;
  const maxClicks = siblings ? siblings.length : 10;

  for (let i = 0; i < maxClicks; i++) {
    // Check if target already visible
    if (document.querySelector(`[data-turn-id-container="${targetChildId}"]`)) {
      console.log("[gptree-main] cycleToChild: target found after", i, "clicks");
      return;
    }

    // Re-walk up from leaf to find current sibling each iteration (DOM changes after click)
    let currentSiblingId: string | null = getCurrentNodeFromDOM();
    while (currentSiblingId && mapping[currentSiblingId]?.parent !== parentId) {
      currentSiblingId = mapping[currentSiblingId]?.parent ?? null;
    }
    if (!currentSiblingId) currentSiblingId = getCurrentNodeFromDOM();
    if (!currentSiblingId) {
      console.log("[gptree-main] cycleToChild: no sibling found at iteration", i);
      return;
    }

    const currentEl = document.querySelector(`[data-turn-id-container="${currentSiblingId}"]`);
    if (!currentEl) {
      console.log("[gptree-main] cycleToChild: sibling element not in DOM at iteration", i);
      return;
    }

    const prevBtn = currentEl.querySelector('[aria-label="Previous response"]') as HTMLButtonElement | null;
    const nextBtn = currentEl.querySelector('[aria-label="Next response"]') as HTMLButtonElement | null;

    // Prefer the direction towards the target
    const currentIdx = siblings ? siblings.indexOf(currentSiblingId) : -1;
    const targetIdx = siblings ? siblings.indexOf(targetChildId) : -1;
    const preferNext = currentIdx !== -1 && targetIdx !== -1 && targetIdx > currentIdx;

    const activeBtn = preferNext
      ? ((nextBtn && !nextBtn.disabled) ? nextBtn : (prevBtn && !prevBtn.disabled) ? prevBtn : null)
      : ((prevBtn && !prevBtn.disabled) ? prevBtn : (nextBtn && !nextBtn.disabled) ? nextBtn : null);

    if (!activeBtn) {
      console.log("[gptree-main] cycleToChild: no enabled button at iteration", i);
      return;
    }

    console.log("[gptree-main] cycleToChild: click", i + 1, "/", maxClicks,
      activeBtn.ariaLabel, "on sibling:", currentSiblingId);
    activeBtn.click();
    await sleep(500);

    const newLeaf = getCurrentNodeFromDOM();
    console.log("[gptree-main] cycleToChild: after click, leaf:", newLeaf);
  }
  console.log("[gptree-main] cycleToChild: exhausted all clicks, target not found");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
