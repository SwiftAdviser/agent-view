(() => {
  if (window.__agentViewLoaded) return;
  window.__agentViewLoaded = true;

  const HOST_ID = "agent-view-root";
  const state = {
    enabled: false,
    source: "",
    host: null,
    shadow: null,
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "AGENT_VIEW_PING") {
      sendResponse({ ok: true });
      return true;
    }

    if (message?.type === "AGENT_VIEW_STATUS") {
      sendResponse({ enabled: state.enabled, source: state.source });
      return true;
    }

    if (message?.type === "AGENT_VIEW_SET") {
      setAgentView(Boolean(message.enabled), message.url)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            enabled: false,
            source: "",
            error: error instanceof Error ? error.message : "Agent View failed",
          });
        });
      return true;
    }

    return false;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.enabled) {
      setAgentView(false);
    }
  });

  async function setAgentView(enabled, url = location.href) {
    if (!enabled) {
      removeOverlay();
      state.enabled = false;
      state.source = "";
      return { enabled: false, source: "" };
    }

    state.enabled = true;
    createOverlay();
    renderShell("Loading", "Requesting Markdown", "");

    const remote = await chrome.runtime.sendMessage({
      type: "FETCH_AGENT_MARKDOWN",
      url,
    });

    if (!remote?.ok && !remote?.body) {
      state.source = "No Markdown response";
      renderNoMarkdown({
        url,
        status: remote?.error || "Fetch failed",
      });
      return { enabled: true, source: state.source };
    }

    const isServerMarkdown = /(^|;|\s)text\/markdown/i.test(remote.contentType || "");

    if (isServerMarkdown) {
      state.source = "Server Markdown";
      renderMarkdown(remote.body, {
        source: state.source,
        url: remote.url || url,
        status: [
          remote.markdownTokens ? `${remote.markdownTokens} tokens` : "",
          remote.contentSignal || "",
        ].filter(Boolean).join(" · "),
        truncated: remote.truncated,
      });
      return { enabled: true, source: state.source };
    }

    state.source = "No Markdown response";
    renderNoMarkdown({
      url,
      status: remote.status ? `HTTP ${remote.status}` : "",
      contentType: remote.contentType || "unknown content",
    });
    return { enabled: true, source: state.source };
  }

  function createOverlay() {
    if (state.host) return;

    const host = document.createElement("section");
    host.id = HOST_ID;
    host.setAttribute("aria-label", "Agent View");

    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host {
          all: initial;
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          color: #f5f2ea;
          background: #111111;
          font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
        }

        * {
          box-sizing: border-box;
        }

        .wrap {
          display: grid;
          grid-template-rows: auto 1fr;
          width: 100%;
          height: 100%;
          background: #111111;
        }

        header {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          align-items: center;
          min-height: 58px;
          padding: 12px 18px;
          border-bottom: 1px solid rgb(255 255 255 / 12%);
          background: #111111;
        }

        .title {
          min-width: 0;
        }

        .name {
          display: block;
          margin: 0 0 3px;
          color: #f5f2ea;
          font: 700 15px/1.2 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          letter-spacing: 0;
        }

        .meta {
          display: block;
          overflow: hidden;
          color: rgb(245 242 234 / 58%);
          font: 12px/1.3 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        button {
          position: relative;
          width: 34px;
          height: 34px;
          border: 1px solid rgb(255 255 255 / 18%);
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
        }

        button:hover {
          background: rgb(255 255 255 / 9%);
        }

        button::before,
        button::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 16px;
          height: 3px;
          border-radius: 999px;
          background: #f5f2ea;
          transform-origin: center;
        }

        button::before {
          transform: translate(-50%, -50%) rotate(45deg);
        }

        button::after {
          transform: translate(-50%, -50%) rotate(-45deg);
        }

        pre {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 28px;
          overflow: auto;
          color: #f5f2ea;
          background: #111111;
          font: 13px/1.58 ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
          white-space: pre-wrap;
          word-break: break-word;
        }

        @media (max-width: 640px) {
          header {
            padding: 10px 12px;
          }

          pre {
            padding: 18px 14px;
            font-size: 12px;
          }
        }
      </style>
      <div class="wrap">
        <header>
          <div class="title">
            <span class="name">Agent View</span>
            <span class="meta"></span>
          </div>
          <button type="button" aria-label="Close Agent View" title="Close"></button>
        </header>
        <pre></pre>
      </div>
    `;

    shadow.querySelector("button").addEventListener("click", () => setAgentView(false));
    document.documentElement.append(host);
    state.host = host;
    state.shadow = shadow;
  }

  function removeOverlay() {
    state.host?.remove();
    state.host = null;
    state.shadow = null;
  }

  function renderShell(source, status, markdown) {
    const meta = state.shadow.querySelector(".meta");
    const pre = state.shadow.querySelector("pre");
    meta.textContent = [source, status].filter(Boolean).join(" · ");
    pre.textContent = markdown;
  }

  function renderMarkdown(markdown, details) {
    const status = [
      details.url,
      details.status,
      details.truncated ? "truncated" : "",
    ].filter(Boolean).join(" · ");
    renderShell(details.source, status, markdown || "# Empty page\n");
  }

  function renderNoMarkdown(details) {
    const status = [
      details.url,
      details.status,
      details.contentType ? `Server returned ${details.contentType}` : "",
    ].filter(Boolean).join(" · ");
    renderShell("No Markdown response", status, [
      "# No Markdown response",
      "",
      "This page did not return `text/markdown` when requested with:",
      "",
      "```http",
      "Accept: text/markdown, text/html;q=0.8, */*;q=0.1",
      "```",
      "",
      "Agent View only shows the Markdown the server actually provides.",
      "It does not convert the page locally.",
      "",
      "## Give this to your AI agent",
      "",
      "```text",
      "Make this website support Markdown for Agents.",
      "",
      "Goal:",
      "When a request includes `Accept: text/markdown`, return a clean Markdown version of the same page instead of HTML.",
      "",
      "Requirements:",
      "1. Detect `Accept: text/markdown` on page requests.",
      "2. Return `Content-Type: text/markdown; charset=utf-8`.",
      "3. Include the page title as `# Title`.",
      "4. Preserve headings, paragraphs, links, lists, tables, and code blocks.",
      "5. Remove nav, footer, cookie banners, scripts, styles, and layout-only markup.",
      "6. Add `Vary: Accept` so caches keep HTML and Markdown separate.",
      "7. If possible, add `x-markdown-tokens` with the estimated token count.",
      "",
      "Verification:",
      "Run:",
      "curl -i \"$URL\" -H \"Accept: text/markdown\"",
      "",
      "Expected:",
      "- `content-type: text/markdown; charset=utf-8`",
      "- body starts with Markdown, not HTML",
      "- normal browser requests still return HTML",
      "```",
    ].join("\n"));
  }
})();
