const MAX_BODY_CHARS = 1_500_000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "FETCH_AGENT_MARKDOWN") return false;

  fetchAgentMarkdown(message.url)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Fetch failed",
      });
    });

  return true;
});

async function fetchAgentMarkdown(rawUrl) {
  const url = new URL(rawUrl);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Agent View only works on http and https pages.");
  }

  const response = await fetch(url.href, {
    cache: "no-store",
    credentials: "include",
    redirect: "follow",
    headers: {
      Accept: "text/markdown, text/html;q=0.8, */*;q=0.1",
    },
  });

  const body = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    url: response.url,
    body: body.slice(0, MAX_BODY_CHARS),
    truncated: body.length > MAX_BODY_CHARS,
    contentType: response.headers.get("content-type") || "",
    contentSignal: response.headers.get("content-signal") || "",
    markdownTokens: response.headers.get("x-markdown-tokens") || "",
  };
}
