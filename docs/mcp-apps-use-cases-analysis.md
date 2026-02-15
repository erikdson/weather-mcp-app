# MCP Apps: Use Cases, Value Propositions, and Limitations

An analysis of how MCP Apps are being positioned, where they deliver value, and where they fall short.

---

## Part 1: Key Value Propositions

### 1. Eliminating Context-Switching

The #1 selling point. Instead of: ask Claude -> get answer -> open another app -> do the thing -> come back to Claude, users stay in one place. A weather forecast renders *inside* the conversation, not as a link to weather.com. Asana reports **40% faster project updates** because planning discussion and task creation happen in the same window.

### 2. From "AI as Text" to "AI as Platform"

Early MCP (2024) was text-in, text-out -- the AI calls a tool, gets JSON back, describes it in words. MCP Apps change this fundamentally. The AI becomes a **runtime for interactive applications**. It's not Claude *describing* a forecast, it's Claude *rendering* a forecast UI with search, geolocation, and scrollable cards.

The framing from multiple analysts is that this is a **platform shift** comparable to the iPhone SDK (2008) or the Slack App Directory (2015). In 2026, the question isn't whether AI is embedded in your app -- it's whether your app can embed in AI.

### 3. Open Standard, Build Once

MCP Apps spec was co-authored by Anthropic and OpenAI engineers. The same MCP server works (or will work) across Claude, ChatGPT, VS Code, Goose, and other clients. This is the "solve the M x N problem" pitch -- instead of building N integrations for N platforms, you build one MCP server.

### 4. Enterprise Distribution Channel

Anthropic's enterprise market share tripled from 12% (2023) to 40% (late 2025). For companies like Asana, Figma, Slack, Salesforce -- building an MCP App puts their tool directly inside where enterprise knowledge workers are already spending time. It's the same logic as building a Slack app in 2016.

### 5. Agentic Workflows with Human-in-the-Loop UI

Plain tool calls are opaque -- the AI calls an API and you trust it did the right thing. MCP Apps give the user **interactive UI to verify, adjust, and control** what the agent is doing. The user can search a different city or use geolocation without re-prompting Claude. For enterprise use cases (deploying code, sending messages, creating invoices), this visibility and control matters enormously.

### Ecosystem Partners

| Partner | What They Do in Claude |
|---------|----------------------|
| **Asana** | Create/manage projects and tasks inline |
| **Figma** | View and interact with designs |
| **Slack** | Draft and send messages |
| **Box** | Search and preview documents |
| **Hex** | Data analysis dashboards |
| **Canva** | Design assets |
| **Salesforce** | CRM operations |
| **Amplitude, Clay, monday.com** | Analytics, data enrichment, project mgmt |

---

## Part 2: Limitations and Red Flags

### Technical Limitations

#### Sandbox and Iframe Constraints

MCP Apps render inside **sandboxed iframes** using a double-iframe architecture. This is fundamental to the security model but imposes hard constraints:

| What MCP Apps **Cannot** Do | Why |
|---|---|
| Access the parent/host DOM | Sandboxed iframe isolation |
| Read or write cookies | Opaque origin; fails same-origin checks |
| Use `localStorage` or `sessionStorage` | Opaque origin; no `allow-same-origin` |
| Open popups or new windows | No `allow-popups` sandbox flag |
| Navigate the parent page | No `allow-top-navigation` |
| Execute scripts in the host context | Sandbox boundary enforcement |
| Directly call external APIs with host credentials | All communication proxied via `postMessage` only |

#### No Persistent State Between Sessions

The current MCP Apps specification **does not support state persistence between sessions**. This is explicitly listed as a potential future enhancement, not a current capability. UIs are ephemeral and inline -- they appear when a tool is called and render in the conversation flow. They are not persistent, standalone windows.

#### Content Type Limitations

The initial spec supports **only** `text/html;profile=mcp-app` content. External URLs, native widgets, and remote DOM are not supported or are deferred.

#### No Offline Mode

MCP Apps require a **live MCP server connection** to function. Without an active server, the UI cannot be fetched or communicated with.

#### Context Window Bloat and Token Cost

One of the most impactful real-world constraints:

- A typical MCP server has 20-30 tools. Organizations connect 5+ servers. Tool definitions alone can consume **50,000+ tokens** -- 16%+ of the context window before a single user prompt.
- Poorly optimized MCP tools can cost **$0.50 per invocation** when $0.05 would suffice. One company discovered a single "summarize_document" tool was consuming **$15,000/month** in unnecessary token spend.
- Every 10,000 extra tokens adds ~2.4 seconds of latency. Sequential tool calls compound this dramatically.

Mitigation strategies exist (Redis reported reducing from 23,000 to 450 tokens per request with dynamic tool filtering; Speakeasy reported 160x reduction with dynamic toolsets), but they require significant engineering effort.

#### Stateful Connections vs. Serverless

MCP relies on **long-lived, stateful connections** which clash with serverless architectures. While the November 2025 spec update introduced stateless transport options, most production implementations still depend on stateful patterns.

### Security and Trust Concerns

The Coalition for Secure AI (CoSAI) white paper (2026) identified **12 core threat categories spanning ~40 distinct threats**:

| Attack | Description |
|---|---|
| **Prompt Injection** | Hidden instructions in data fields trick the model into executing unintended commands |
| **Tool Poisoning** | Malicious modification of tool metadata/schema; 5.5% of MCP servers in the wild exhibit this |
| **Confused Deputy** | MCP proxy servers exploited to obtain authorization without proper consent |
| **Shadow MCP Servers** | Rogue instances set up by employees without security oversight |
| **Supply Chain** | Compromised dependencies in MCP server packages |

Real-world CVEs include: CVE-2025-68145/68143/68144 (Anthropic's Git MCP server -- RCE via prompt injection), CVE-2025-6514 (CVSS 9.6, proxy configuration), and CVE-2025-49596 (MCP Inspector -- browser-based RCE). **33% of MCP servers allow unrestricted network access** in the wild.

### Use Cases That Are NOT a Good Fit

1. **Full SaaS Replacements** -- No persistent state, no cookies, no local storage, no multi-page navigation. Complex multi-page workflows are impractical.
2. **Offline/Disconnected Experiences** -- No server connection = no UI.
3. **High-Frequency Real-Time Systems** -- Latency overhead of the protocol stack (tool call -> JSON-RPC -> postMessage -> iframe render) and context window constraints make sub-second interactivity challenging.
4. **Deep Browser Integration** -- Anything needing camera/microphone, push notifications, service workers, or native browser APIs is fundamentally incompatible with the sandbox.
5. **Security-Critical Autonomous Workflows** -- Financial transactions, medical decisions, infrastructure changes without human confirmation gates are explicitly cautioned against.
6. **Regulated Environments (Without Major Investment)** -- MCP servers become data controllers/processors under GDPR and CCPA, imposing substantial compliance overhead that is not yet standardized.

---

## Part 3: Feature Parity vs. Companion Experience

### The Honest Answer: Companion Experience, Not Feature Parity

Aiming for full feature parity with a native SaaS app is **not realistic** with current MCP Apps -- and likely not the right goal even if it were possible.

### Where MCP Apps Excel (Companion Pattern)

- **Context preservation** -- UI lives inside the conversation, no tab-switching
- **Bidirectional data flow** -- Can call MCP server tools and receive pushed updates without building separate API/auth/state management
- **Cross-tool integration** -- Apps can delegate actions to the host, which routes through the user's existing connected capabilities
- **Dashboards, forms, visualizations** -- Interactive data exploration, configuration wizards, document review within the chat flow
- **"Right UI at the right moment"** -- Surface the 20% of features users need 80% of the time, in context

### Where MCP Apps Cannot Compete with Native SaaS

- No persistent windows or multi-page navigation
- No offline access
- No browser-level integration (notifications, storage, deep linking)
- No complex state management across sessions
- Ephemeral by nature -- tied to conversation lifecycle
- Performance constrained by token economics and protocol overhead
- Limited to HTML in a sandboxed iframe -- no native widgets

### The Right Mental Model

The official MCP documentation itself says: *"If your use case doesn't benefit from these properties, a regular web app might be simpler."*

MCP Apps are best understood as **companion experiences** that provide the right UI at the right moment within an AI conversation -- not as replacements for full-featured web applications. The goal is NOT to replicate every SaaS feature line-for-line, but to deliver the most valuable slice of functionality within the conversational context.

The SaaS existential question is real: companies risk becoming "undifferentiated backend infrastructure" behind AI tools. But the consensus is that MCP Apps **complement rather than replace** native experiences.

---

## Red Flags Checklist

Before building an MCP App, watch for these:

1. You need **persistent state across sessions** -- not supported yet
2. You need **offline access** -- impossible by design
3. You need **cookies, local storage, or browser APIs** -- blocked by sandbox
4. You are targeting **feature parity with a native SaaS app** -- scope as companion instead
5. Your users are in **regulated industries** -- compliance overhead is substantial
6. You need **sub-second interactivity** -- latency compounding makes this challenging
7. You need **autonomous operation without human confirmation** -- cautioned against by spec
8. You depend on **stable, unchanging protocol semantics** -- the spec is still evolving
9. Your business model depends on **controlling the user relationship** -- MCP turns SaaS into plumbing
10. You need **rich native UI** (multi-window, deep linking, notifications) -- sandbox precludes this

---

## Developer Ecosystem Reality Check

- **Protocol instability**: Frequent updates and breaking changes. Auth and remote transport only added in March 2025.
- **Debugging difficulty**: Errors are cryptic, every MCP server has different auth setup. Developers spend more time on configuration than coding.
- **Context window opacity**: You cannot guarantee what enters the model's context window.
- **Token cost as hidden tax**: 1MB of output costs ~$1 per request. Agent costs become heavily dependent on MCP integration token efficiency.
- **Ecosystem maturity**: Many MCP servers in community registries are abandoned, undocumented, or untested. Few enterprise-grade remote servers exist.
- **MCP does not replace workflows**: It solves *how context is delivered*, not when models run, how failures are handled, or how operations are orchestrated.

---

## Sources

### Value Proposition
- [Claude supports MCP Apps, presents UI within chat window - The Register](https://www.theregister.com/2026/01/26/claude_mcp_apps_arrives)
- [Anthropic extends MCP with a UI framework - The New Stack](https://thenewstack.io/anthropic-extends-mcp-with-an-app-framework/)
- [MCP Apps - Bringing UI Capabilities To MCP Clients](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [The shift from apps with AI to AI with apps - WorkOS](https://workos.com/blog/building-mcp-apps-inside-claude-chatgpt)
- [Anthropic integrates third-party apps into Claude - CIO](https://www.cio.com/article/4122735/anthropic-integrates-third-party-apps-into-claude-reshaping-enterprise-ai-workflows.html)
- [Atlassian Remote MCP Server](https://www.atlassian.com/blog/announcements/remote-mcp-server)

### Limitations and Security
- [MCP Apps Official Documentation](https://modelcontextprotocol.io/docs/extensions/apps)
- [SEP-1865 Specification](https://modelcontextprotocol.io/community/seps/1865-mcp-apps-interactive-user-interfaces-for-mcp)
- [CoSAI MCP Security White Paper](https://adversa.ai/blog/mcp-security-whitepaper-2026-cosai-top-insights/)
- [CoSAI Official Guide](https://www.coalitionforsecureai.org/securing-the-ai-agent-revolution-a-practical-guide-to-mcp-security/)
- [Red Hat - MCP Security](https://www.redhat.com/en/blog/model-context-protocol-mcp-understanding-security-risks-and-controls)
- [Palo Alto Unit 42 - MCP Attack Vectors](https://unit42.paloaltonetworks.com/model-context-protocol-attack-vectors/)
- [Pillar Security - MCP Risks](https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp)
- [CData - MCP Limitations](https://www.cdata.com/blog/navigating-the-hurdles-mcp-limitations)
- [Hidden Cost of MCP (Arsturn)](https://www.arsturn.com/blog/hidden-cost-of-mcp-monitor-reduce-token-usage)
- [Redis - Solving MCP Tool Overload](https://redis.io/blog/from-reasoning-to-retrieval-solving-the-mcp-tool-overload-problem/)
- [Everything Wrong with MCP (Shrivu Shankar)](https://blog.sshh.io/p/everything-wrong-with-mcp)
- [Cribl - MCP and the SaaS Power Struggle](https://cribl.io/blog/mcp-and-the-new-power-struggle-in-the-saas-stack/)
- [MCP Economic Impact (Sanjeev Mohan)](https://sanjmo.medium.com/to-mcp-or-not-to-mcp-part-2-economic-impact-of-the-mcp-standard-2bd0f8e961eb)
- [Glama - MCP Real Adoption Phase](https://glama.ai/blog/2026-01-20-mcp-is-not-dead)
- [Madrona - Two Ecosystems](https://www.madrona.com/what-mcps-rise-really-shows-a-tale-of-two-ecosystems/)
