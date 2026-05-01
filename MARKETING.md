# Agent View Marketing Plan

## Clarity

Who: developers, AI SEO consultants, and content teams checking how agents read websites.

Pain: they cannot see whether a site actually serves Markdown to agents without using curl and custom headers.

Outcome: one click shows the server-provided Markdown, or proves the site does not provide it.

Mechanism: request `Accept: text/markdown`; show only the response the server actually provides.

Why now: Cloudflare shipped Markdown for Agents, and AI crawler traffic is becoming a real discovery channel.

Next step: install the extension.

## Core Message

See the Markdown your site gives agents.

## Search Targets

- Markdown for Agents Chrome extension
- AI agent view Chrome extension
- view website as AI agent
- Accept text markdown Chrome extension
- AI SEO Markdown viewer
- Cloudflare Markdown for Agents tool

## GitHub README Title

`Agent View: Markdown for Agents Chrome Extension`

## Hooks

- Your site has a human version. What does the agent see?
- Stop guessing how AI crawlers read your page.
- One switch. See if your page serves Markdown.
- Test Markdown for Agents without curl.
- No Markdown response is a real result.

## First Channels

1. GitHub repository README
2. Chrome Web Store
3. Hacker News Show HN
4. Cloudflare community
5. AI SEO LinkedIn posts
6. Developer X threads

## Launch Post

```text
Cloudflare made Markdown a first-class format for agents.

So I made a Chrome extension for humans:

Agent View shows the Markdown your site actually gives to agents.

It requests Accept: text/markdown.
If the site supports Markdown for Agents, you see the real response.
If not, you see that no Markdown response was provided.

One switch. No dashboard.

Use it to test AI SEO and agent-readable Markdown.

GitHub:
[repo URL]

Chrome Web Store:
[store URL]
```

## Proof To Collect

- Screenshot of a Cloudflare page returning server Markdown.
- Screenshot of a normal page showing no Markdown response.
- Before and after token count where `x-markdown-tokens` is available.
- 5 testimonials from AI SEO consultants or developer advocates.
