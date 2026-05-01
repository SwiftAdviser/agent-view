const toggle = document.querySelector("#toggle");
const state = document.querySelector("#state");
const note = document.querySelector("#note");
const host = document.querySelector("#host");
const sourceLabel = document.querySelector("#sourceLabel");

let activeTab = null;

init();

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;

  if (!tab?.id || !isWebUrl(tab.url)) {
    host.textContent = "Unsupported page";
    state.textContent = "Unavailable";
    note.textContent = "Open an http or https page";
    sourceLabel.textContent = "Unsupported page";
    document.body.dataset.mode = "error";
    toggle.disabled = true;
    return;
  }

  host.textContent = new URL(tab.url).hostname;
  await ensureContentScript(tab.id);

  const current = await sendToTab(tab.id, { type: "AGENT_VIEW_STATUS" });
  setUi(Boolean(current?.enabled), current?.source || "");
}

toggle.addEventListener("change", async () => {
  if (!activeTab?.id) return;

  toggle.disabled = true;
  const enabled = toggle.checked;
  setUi(enabled, enabled ? "Loading" : "");

  try {
    const result = await sendToTab(activeTab.id, {
      type: "AGENT_VIEW_SET",
      enabled,
      url: activeTab.url,
    });
    setUi(Boolean(result?.enabled), result?.source || "");
  } catch (error) {
    toggle.checked = false;
    state.textContent = "Blocked";
    note.textContent = "Chrome stopped this page";
    sourceLabel.textContent = error instanceof Error ? error.message : "Agent View failed";
    document.body.dataset.mode = "error";
  } finally {
    toggle.disabled = false;
  }
});

function setUi(enabled, source) {
  toggle.checked = enabled;

  if (source === "Loading") {
    state.textContent = "Loading";
    note.textContent = "Requesting Markdown";
    sourceLabel.textContent = "Working";
    document.body.dataset.mode = "loading";
    return;
  }

  state.textContent = enabled ? "Agent view" : "Human view";
  note.textContent = enabled ? "Markdown is on" : "Flip to see what agents read";
  sourceLabel.textContent = enabled ? (source || "Markdown") : "Ready";
  document.body.dataset.mode = enabled ? "agent" : "human";
}

async function ensureContentScript(tabId) {
  try {
    await sendToTab(tabId, { type: "AGENT_VIEW_PING" });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  }
}

function sendToTab(tabId, message) {
  return chrome.tabs.sendMessage(tabId, message);
}

function isWebUrl(url) {
  return /^https?:\/\//i.test(url || "");
}
