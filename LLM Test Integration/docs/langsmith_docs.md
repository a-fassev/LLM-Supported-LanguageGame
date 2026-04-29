# LangSmith

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Tracing quickstart

> Add LangSmith tracing to an LLM application in minutes.

LangSmith gives you end-to-end visibility into your LLM application by capturing *[traces](/langsmith/observability-concepts#traces)*; a complete record of every step that ran during a request, from the inputs passed in to the final output returned.

In this quickstart, you will add tracing to an AI assistant and view the results in LangSmith.

  If you're building with [LangChain]([https://docs.langchain.com/oss/python/langchain/overview](https://docs.langchain.com/oss/python/langchain/overview)) or [LangGraph]([https://docs.langchain.com/oss/python/langgraph/overview](https://docs.langchain.com/oss/python/langgraph/overview)), you can enable LangSmith tracing with a single environment variable. Refer to [trace with LangChain](/langsmith/trace-with-langchain) or [trace with LangGraph](/langsmith/trace-with-langgraph).

## Prerequisites

Before you begin, make sure you have:

- **A LangSmith account**: Sign up or log in at [smith.langchain.com]([https://smith.langchain.com](https://smith.langchain.com)).
- **A LangSmith API key**: Follow the [Create an API key](/langsmith/create-account-api-key) guide.
- **An OpenAI API key**: Generate this from the [OpenAI dashboard]([https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)).

This example uses OpenAI as the LLM provider. You can adapt it for your own provider.

## 1. Set up your environment

1. Create a project directory, install the dependencies, and configure the required environment variables:
2. Export your environment variables in your shell:
  ```bash theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

   export LANGSMITH_TRACING=true

   export LANGSMITH_API_KEY="<your-langsmith-api-key>"

   export OPENAI_API_KEY="<your-openai-api-key>"

  ```
     To send traces to a specific project, use the `LANGSMITH_PROJECT` environment variable](/langsmith/log-traces-to-project). If this is not set, LangSmith will create a default tracing project automatically on trace ingestion.
   If you are using Anthropic, use the [Anthropic wrapper](/langsmith/trace-anthropic). If you are using Google Gemini, use the [Gemini wrapper](/langsmith/trace-with-google-gemini). For other providers, use the `@traceable` decorator](/langsmith/annotate-code#use-%40traceable-%2F-traceable) to trace calls manually.

## 2. Build the app

The following app uses two LangSmith tools to add tracing:

- *`wrap_openai`**: wraps the OpenAI client so every LLM call is automatically logged as a nested span.
- *`@traceable`**: wraps a function so its inputs, outputs, and any nested spans appear as a single trace in LangSmith.

The `assistant` function calls a tool `get_context`) to retrieve relevant context, then passes that context to the model. Using `@traceable` on both functions captures the full pipeline in one trace, with the tool call and LLM call as nested spans.

Create a file called `app.py` (or `index.ts`) with the following code:

## 3. Run the app

## 4. View your trace

In the [LangSmith UI]([https://smith.langchain.com](https://smith.langchain.com)), go to **Tracing** and select your **default** project. Click the `assistant` row to open the **Trace** details panel, which shows the `assistant` function with the `get_context` tool call and the OpenAI call nested inside it.

The outer span captures your `assistant` function's inputs and outputs. The nested **getcontext** span records the tool call, and the **ChatOpenAI** span records the exact prompt sent to the model and the response returned.

  You can also inspect traces from the terminal using the [LangSmith CLI](/langsmith/langsmith-cli).

## Next steps

- [Tracing integrations](/langsmith/integrations): LangChain, LangGraph, Anthropic, and other providers.
- [Trace an LLM application](/langsmith/observability-llm-tutorial): a full lifecycle tutorial, from prototyping through production.
- [Filter traces](/langsmith/filter-traces-in-application): search and navigate large tracing projects.

 *[Log to a specific project](/langsmith/log-traces-to-project): send traces to a named project instead of* *default**.

  After logging traces, use **[Polly](/langsmith/polly)** to analyze them and get AI-powered insights into your application's performance.

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/langsmith/observability-quickstart.mdx](https://github.com/langchain-ai/docs/edit/main/src/langsmith/observability-quickstart.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Observability concepts

LangSmith Observability lets you record, inspect, and analyze every step your LLM application takes. This page explains how data is structured in LangSmith and how to send traces.

## How LangSmith structures data

LangSmith groups multiple *[traces](#traces)* within a [*project](#projects)*. Each trace records the sequence of steps your application takes for a single operation, which are made up of individual [runs](#runs). You can link together traces from multi-turn conversations as a *[thread](#threads)*.

```mermaid actions={false} theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

graph TB

    Project -->|contains| Trace1[Trace]

    Project -->|contains| Trace2[Trace]

    Trace1 -->|contains| Run1[Run]

    Trace1 -->|contains| Run2[Run]

    Trace1 -->|contains| Run3[Run]

    Trace1 -->|part of| Thread

    Trace2 -->|part of| Thread

```

### Projects

A *project* is a container for all the traces related to a single application or service.

[Log traces to a project](/langsmith/log-traces-to-project).

### Traces

A *trace* is a collection of runs for a single operation. For example, if a user request triggers a chain that calls an LLM and then an output parser, all of those runs belong to the same trace. Runs are bound to a trace by a unique trace ID. If you are familiar with [OpenTelemetry]([https://opentelemetry.io/](https://opentelemetry.io/)), you can think of a LangSmith trace as a collection of spans.

  Each trace is limited to a maximum of 25,000 runs. Once the trace reaches this limit, LangSmith will reject any additional runs that you send for that trace.

### Runs

A *run* is a span representing a single unit of work within your LLM application: a call to an LLM, a prompt formatting step, a retrieval call, or any other discrete operation. If you are familiar with [OpenTelemetry]([https://opentelemetry.io/](https://opentelemetry.io/)), you can think of a run as a span.

### Threads

A *thread* is a sequence of traces representing a single conversation. Each turn in a multi-turn conversation is its own trace, but traces are linked by a shared identifier. To group traces into threads, pass a special metadata key `session_id`, `thread_id`, or `conversation_id`) with a unique value.

[Learn how to configure threads](/langsmith/threads).

  Use **[Polly](/langsmith/polly)** to analyze traces, runs, and threads. Polly helps you understand agent performance, debug issues, and gain insights from conversation threads without manually digging through data.

## Trace enrichment

### Feedback

*Feedback* allows you to score an individual run based on certain criteria. Each feedback entry consists of a tag and a score, and is bound to a run by a unique run ID. Feedback can be continuous or discrete (categorical), and tags can be reused across runs within an organization.

For more on how feedback is stored, refer to the [Feedback data format guide](/langsmith/feedback-data-format).

### Tags

*Tags* are strings you can attach to runs to categorize, filter, and group them in the LangSmith UI.

[Learn how to attach tags to your traces](/langsmith/add-metadata-tags).

### Metadata

*Metadata* is a collection of key-value pairs you can attach to runs. For example, application version, environment, or any other contextual information. Similarly to tags, you can use metadata to filter and group runs.

[Learn how to add metadata to your traces](/langsmith/add-metadata-tags).

## Sending traces

There are two ways to send trace data to LangSmith.

### Integrations

LangSmith *integrations* provide automatic tracing for popular LLM providers and agent frameworks (the equivalent of auto-instrumentation in general observability). When you use a supported framework such as LangChain, LangGraph, OpenAI, Anthropic, or CrewAI, the integration captures inputs, outputs, and metadata without requiring manual code changes.

[Browse all integrations](/langsmith/integrations).

### Manual instrumentation

*Manual instrumentation* lets you add tracing to any code, regardless of the framework. Use it when you're not using a supported integration or when you need granular control over what gets traced. LangSmith provides three mechanisms:

- `@traceable` / `traceable`: a decorator to trace any function
- `trace` context manager (Python): wrap specific code blocks
- `RunTree` API: low-level, explicit trace construction

[Learn how to add manual instrumentation](/langsmith/annotate-code).

## Data retention

LangSmith (SaaS) retains trace data for 400 days from ingestion. After that, traces are permanently deleted, with limited metadata retained for usage statistics. For details on retention tiers and pricing, refer to [Usage and billing: Data retention](/langsmith/administration-overview#data-retention).

  To keep data beyond the retention period, add it to a [dataset](/langsmith/manage-datasets). Datasets persist indefinitely, even after the source trace is deleted.

To delete traces before their expiration date, see [Manage a trace](/langsmith/manage-trace#delete-a-trace).

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/langsmith/observability-concepts.mdx](https://github.com/langchain-ai/docs/edit/main/src/langsmith/observability-concepts.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```



> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Prebuilt middleware

> Prebuilt middleware for common agent use cases

LangChain and [Deep Agents](/oss/javascript/deepagents/overview) provide prebuilt middleware for common use cases. Each middleware is production-ready and configurable for your specific needs.

## Provider-agnostic middleware

The following middleware work with any LLM provider:

| Middleware                              | Description                                                                  |

| --------------------------------------- | ---------------------------------------------------------------------------- |

| [Summarization](#summarization)         | Automatically summarize conversation history when approaching token limits.  |

| [Human-in-the-loop](#human-in-the-loop) | Pause execution for human approval of tool calls.                            |

| [Model call limit](#model-call-limit)   | Limit the number of model calls to prevent excessive costs.                  |

| [Tool call limit](#tool-call-limit)     | Control tool execution by limiting call counts.                              |

| [Model fallback](#model-fallback)       | Automatically fallback to alternative models when primary fails.             |

| [PII detection](#pii-detection)         | Detect and handle Personally Identifiable Information (PII).                 |

| [To-do list](#to-do-list)               | Equip agents with task planning and tracking capabilities.                   |

| [LLM tool selector](#llm-tool-selector) | Use an LLM to select relevant tools before calling main model.               |

| [Tool retry](#tool-retry)               | Automatically retry failed tool calls with exponential backoff.              |

| [Model retry](#model-retry)             | Automatically retry failed model calls with exponential backoff.             |

| [LLM tool emulator](#llm-tool-emulator) | Emulate tool execution using an LLM for testing purposes.                    |

| [Context editing](#context-editing)     | Manage conversation context by trimming or clearing tool uses.               |

| [Filesystem](#filesystem-middleware)    | Provide agents with a filesystem for storing context and long-term memories. |

| [Subagent middleware](#subagent)        | Add the ability to spawn subagents.                                          |

### Summarization

Automatically summarize conversation history when approaching token limits, preserving recent messages while compressing older context. Summarization is useful for the following:

* Long-running conversations that exceed context windows.

* Multi-turn dialogues with extensive history.

* Applications where preserving full conversation context matters.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, summarizationMiddleware } from "langchain";

const agent = createAgent({

  model: "gpt-5.4",

  tools: [weatherTool, calculatorTool],

  middleware: [

    summarizationMiddleware({

      model: "gpt-5.4-mini",

      trigger: { tokens: 4000 },

      keep: { messages: 20 },

    }),

  ],

});

```

<Accordion title="Configuration options">

  <Tip>

    The `fraction` conditions for `trigger` and `keep` (shown below) rely on a chat model's [profile data](/oss/javascript/langchain/models#model-profiles) if using `langchain@1.1.0`. If data are not available, use another condition or specify manually:

    ```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

    const customProfile: ModelProfile = {

        maxInputTokens: 100_000,

        // ...

    }

    model = await initChatModel("...", {

        profile: customProfile,

    });

    ```

  </Tip>

  <ParamField body="model" type="string | BaseChatModel" required>

    Model for generating summaries. Can be a model identifier string (e.g., `'openai:gpt-5.4-mini'`) or a `BaseChatModel` instance.

  </ParamField>

  <ParamField body="trigger" type="object | object[]">

    Conditions for triggering summarization. Can be:

    * A single condition object (all properties must be met - AND logic)

    * An array of condition objects (any condition must be met - OR logic)

    Each condition can include:

    * `fraction` (number): Fraction of model's context size (0-1)

    * `tokens` (number): Absolute token count

    * `messages` (number): Message count

    At least one property must be specified per condition. If not provided, summarization will not trigger automatically.

  </ParamField>

  <ParamField body="keep" type="object" default="{messages: 20}">

    How much context to preserve after summarization. Specify exactly one of:

    * `fraction` (number): Fraction of model's context size to keep (0-1)

    * `tokens` (number): Absolute token count to keep

    * `messages` (number): Number of recent messages to keep

  </ParamField>

  <ParamField body="tokenCounter" type="function">

    Custom token counting function. Defaults to character-based counting.

  </ParamField>

  <ParamField body="summaryPrompt" type="string">

    Custom prompt template for summarization. Uses built-in template if not specified. The template should include `{messages}` placeholder where conversation history will be inserted.

  </ParamField>

  <ParamField body="trimTokensToSummarize" type="number" default="4000">

    Maximum number of tokens to include when generating the summary. Messages will be trimmed to fit this limit before summarization.

  </ParamField>

  <ParamField body="summaryPrefix" type="string">

    Prefix to add to the summary message. If not provided, a default prefix is used.

  </ParamField>

  <ParamField body="maxTokensBeforeSummary" type="number" deprecated>

    **Deprecated:** Use `trigger: { tokens: value }` instead. Token threshold for triggering summarization.

  </ParamField>

  <ParamField body="messagesToKeep" type="number" deprecated>

    **Deprecated:** Use `keep: { messages: value }` instead. Recent messages to preserve.

  </ParamField>

</Accordion>

<Accordion title="Full example">

  The summarization middleware monitors message token counts and automatically summarizes older messages when thresholds are reached.

  **Trigger conditions** control when summarization runs:

  * Single condition object (specified must be met)

  * Array of conditions (any condition must be met - OR logic)

  * Each condition can use `fraction` (of model's context size), `tokens` (absolute count), or `messages` (message count)

  **Keep condition** control how much context to preserve (specify exactly one):

  * `fraction` - Fraction of model's context size to keep

  * `tokens` - Absolute token count to keep

  * `messages` - Number of recent messages to keep

  ```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import { createAgent, summarizationMiddleware } from "langchain";

  // Single condition

  const agent = createAgent({

    model: "gpt-5.4",

    tools: [weatherTool, calculatorTool],

    middleware: [

      summarizationMiddleware({

        model: "gpt-5.4-mini",

        trigger: { tokens: 4000, messages: 10 },

        keep: { messages: 20 },

      }),

    ],

  });

  // Multiple conditions

  const agent2 = createAgent({

    model: "gpt-5.4",

    tools: [weatherTool, calculatorTool],

    middleware: [

      summarizationMiddleware({

        model: "gpt-5.4-mini",

        trigger: [

          { tokens: 3000, messages: 6 },

        ],

        keep: { messages: 20 },

      }),

    ],

  });

  // Using fractional limits

  const agent3 = createAgent({

    model: "gpt-5.4",

    tools: [weatherTool, calculatorTool],

    middleware: [

      summarizationMiddleware({

        model: "gpt-5.4-mini",

        trigger: { fraction: 0.8 },

        keep: { fraction: 0.3 },

      }),

    ],

  });

  ```

</Accordion>

### Human-in-the-loop

Pause agent execution for human approval, editing, or rejection of tool calls before they execute. [Human-in-the-loop](/oss/javascript/langchain/human-in-the-loop) is useful for the following:

* High-stakes operations requiring human approval (e.g. database writes, financial transactions).

* Compliance workflows where human oversight is mandatory.

* Long-running conversations where human feedback guides the agent.

<Warning>

  Human-in-the-loop middleware requires a [checkpointer](/oss/javascript/langgraph/persistence#checkpoints) to maintain state across interruptions.

</Warning>

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, humanInTheLoopMiddleware } from "langchain";

function readEmailTool(emailId: string): string {

  /** Mock function to read an email by its ID. */

  return `Email content for ID: ${emailId}`;

}

function sendEmailTool(recipient: string, subject: string, body: string): string {

  /** Mock function to send an email. */

  return `Email sent to ${recipient} with subject '${subject}'`;

}

const agent = createAgent({

  model: "gpt-5.4",

  tools: [readEmailTool, sendEmailTool],

  middleware: [

    humanInTheLoopMiddleware({

      interruptOn: {

        sendEmailTool: {

          allowedDecisions: ["approve", "edit", "reject"],

        },

        readEmailTool: false,

      }

    })

  ]

});

```

<Tip>

  For complete examples, configuration options, and integration patterns, see the [Human-in-the-loop documentation](/oss/javascript/langchain/human-in-the-loop).

</Tip>

<Callout icon="player-play" iconType="solid">

  Watch this [video guide]([https://www.youtube.com/watch?v=tdOeUVERukA](https://www.youtube.com/watch?v=tdOeUVERukA)) demonstrating Human-in-the-loop middleware behavior.

</Callout>

### Model call limit

Limit the number of model calls to prevent infinite loops or excessive costs. Model call limit is useful for the following:

* Preventing runaway agents from making too many API calls.

* Enforcing cost controls on production deployments.

* Testing agent behavior within specific call budgets.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, modelCallLimitMiddleware } from "langchain";

import { MemorySaver } from "@langchain/langgraph";

const agent = createAgent({

  model: "gpt-5.4",

  checkpointer: new MemorySaver(), // Required for thread limiting

  tools: [],

  middleware: [

    modelCallLimitMiddleware({

      threadLimit: 10,

      runLimit: 5,

      exitBehavior: "end",

    }),

  ],

});

```

<Callout icon="player-play" iconType="solid">

  Watch this [video guide]([https://www.youtube.com/watch?v=x5jLQTFXR0Y](https://www.youtube.com/watch?v=x5jLQTFXR0Y)) demonstrating Model Call Limit middleware behavior.

</Callout>

<Accordion title="Configuration options">

  <ParamField body="threadLimit" type="number">

    Maximum model calls across all runs in a thread. Defaults to no limit.

  </ParamField>

  <ParamField body="runLimit" type="number">

    Maximum model calls per single invocation. Defaults to no limit.

  </ParamField>

  <ParamField body="exitBehavior" type="string" default="end">

    Behavior when limit is reached. Options: `'end'` (graceful termination) or `'error'` (throw exception)

  </ParamField>

</Accordion>

### Tool call limit

Control agent execution by limiting the number of tool calls, either globally across all tools or for specific tools. Tool call limits are useful for the following:

* Preventing excessive calls to expensive external APIs.

* Limiting web searches or database queries.

* Enforcing rate limits on specific tool usage.

* Protecting against runaway agent loops.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, toolCallLimitMiddleware } from "langchain";

const agent = createAgent({

  model: "gpt-5.4",

  tools: [searchTool, databaseTool],

  middleware: [

    toolCallLimitMiddleware({ threadLimit: 20, runLimit: 10 }),

    toolCallLimitMiddleware({

      toolName: "search",

      threadLimit: 5,

      runLimit: 3,

    }),

  ],

});

```

<Callout icon="player-play" iconType="solid">

  Watch this [video guide]([https://www.youtube.com/watch?v=oL6am5UqODY](https://www.youtube.com/watch?v=oL6am5UqODY)) demonstrating Tool Call Limit middleware behavior.

</Callout>

<Accordion title="Configuration options">

  <ParamField body="toolName" type="string">

    Name of specific tool to limit. If not provided, limits apply to **all tools globally**.

  </ParamField>

  <ParamField body="threadLimit" type="number">

    Maximum tool calls across all runs in a thread (conversation). Persists across multiple invocations with the same thread ID. Requires a checkpointer to maintain state. `undefined` means no thread limit.

  </ParamField>

  <ParamField body="runLimit" type="number">

    Maximum tool calls per single invocation (one user message → response cycle). Resets with each new user message. `undefined` means no run limit.

    **Note:** At least one of `threadLimit` or `runLimit` must be specified.

  </ParamField>

  <ParamField body="exitBehavior" type="string" default="continue">

    Behavior when limit is reached:

    * `'continue'` (default) - Block exceeded tool calls with error messages, let other tools and the model continue. The model decides when to end based on the error messages.

    * `'error'` - Throw a `ToolCallLimitExceededError` exception, stopping execution immediately

    * `'end'` - Stop execution immediately with a ToolMessage and AI message for the exceeded tool call. Only works when limiting a single tool; throws error if other tools have pending calls.

  </ParamField>

</Accordion>

<Accordion title="Full example">

  Specify limits with:

  * **Thread limit** - Max calls across all runs in a conversation (requires checkpointer)

  * **Run limit** - Max calls per single invocation (resets each turn)

  Exit behaviors:

  * `'continue'` (default) - Block exceeded calls with error messages, agent continues

  * `'error'` - Raise exception immediately

  * `'end'` - Stop with ToolMessage + AI message (single-tool scenarios only)

  ```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import { createAgent, toolCallLimitMiddleware } from "langchain";

  const globalLimiter = toolCallLimitMiddleware({ threadLimit: 20, runLimit: 10 });

  const searchLimiter = toolCallLimitMiddleware({ toolName: "search", threadLimit: 5, runLimit: 3 });

  const databaseLimiter = toolCallLimitMiddleware({ toolName: "query_database", threadLimit: 10 });

  const strictLimiter = toolCallLimitMiddleware({ toolName: "scrape_webpage", runLimit: 2, exitBehavior: "error" });

  const agent = createAgent({

    model: "gpt-5.4",

    tools: [searchTool, databaseTool, scraperTool],

    middleware: [globalLimiter, searchLimiter, databaseLimiter, strictLimiter],

  });

  ```

</Accordion>

### Model fallback

Automatically fallback to alternative models when the primary model fails. Model fallback is useful for the following:

* Building resilient agents that handle model outages.

* Cost optimization by falling back to cheaper models.

* Provider redundancy across OpenAI, Anthropic, etc.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, modelFallbackMiddleware } from "langchain";

const agent = createAgent({

  model: "gpt-5.4",

  tools: [],

  middleware: [

    modelFallbackMiddleware(

      "gpt-5.4-mini",

      "claude-3-5-sonnet-20241022"

    ),

  ],

});

```

<Accordion title="Configuration options">

  The middleware accepts a variable number of string arguments representing fallback models in order:

  <ParamField body="...models" type="string[]" required>

    One or more fallback model strings to try in order when the primary model fails

    ```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

    modelFallbackMiddleware(

      "first-fallback-model",

      "second-fallback-model",

      // ... more models

    )

    ```

  </ParamField>

</Accordion>

### PII detection

Detect and handle Personally Identifiable Information (PII) in conversations using configurable strategies. PII detection is useful for the following:

* Healthcare and financial applications with compliance requirements.

* Customer service agents that need to sanitize logs.

* Any application handling sensitive user data.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, piiMiddleware } from "langchain";

const agent = createAgent({

  model: "gpt-5.4",

  tools: [],

  middleware: [

    piiMiddleware("email", { strategy: "redact", applyToInput: true }),

    piiMiddleware("credit_card", { strategy: "mask", applyToInput: true }),

  ],

});

```

#### Custom PII types

You can create custom PII types by providing a `detector` parameter. This allows you to detect patterns specific to your use case beyond the built-in types.

**Three ways to create custom detectors:**

1. **Regex pattern string** - Simple pattern matching

2. **RegExp object** - More control over regex flags

3. **Custom function** - Complex detection logic with validation

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, piiMiddleware, type PIIMatch } from "langchain";

// Method 1: Regex pattern string

const agent1 = createAgent({

  model: "gpt-5.4",

  tools: [],

  middleware: [

    piiMiddleware("api_key", {

      detector: "sk-[a-zA-Z0-9]{32}",

      strategy: "block",

    }),

  ],

});

// Method 2: RegExp object

const agent2 = createAgent({

  model: "gpt-5.4",

  tools: [],

  middleware: [

    piiMiddleware("phone_number", {

      detector: /\+?\d{1,3}[\s.-]?\d{3,4}[\s.-]?\d{4}/,

      strategy: "mask",

    }),

  ],

});

// Method 3: Custom detector function

function detectSSN(content: string): PIIMatch[] {

  const matches: PIIMatch[] = [];

  const pattern = /\d{3}-\d{2}-\d{4}/g;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {

    const ssn = match[0];

    // Validate: first 3 digits shouldn't be 000, 666, or 900-999

    const firstThree = parseInt(ssn.substring(0, 3), 10);

    if (firstThree !== 0 && firstThree !== 666 && !(firstThree >= 900 && firstThree <= 999)) {

      matches.push({

        text: ssn,

        start: match.index ?? 0,

        end: (match.index ?? 0) + ssn.length,

      });

    }

  }

  return matches;

}

const agent3 = createAgent({

  model: "gpt-5.4",

  tools: [],

  middleware: [

    piiMiddleware("ssn", {

      detector: detectSSN,

      strategy: "hash",

    }),

  ],

});

```

**Custom detector function signature:**

The detector function must accept a string (content) and return matches:

Returns an array of `PIIMatch` objects:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

interface PIIMatch {

  text: string;    // The matched text

  start: number;   // Start index in content

  end: number;      // End index in content

}

function detector(content: string): PIIMatch[] {

  return [

    { text: "matched_text", start: 0, end: 12 },

    // ... more matches

  ];

}

```

<Tip>

  For custom detectors:

  * Use regex strings for simple patterns

  * Use RegExp objects when you need flags (e.g., case-insensitive matching)

  * Use custom functions when you need validation logic beyond pattern matching

  * Custom functions give you full control over detection logic and can implement complex validation rules

</Tip>

<Accordion title="Configuration options">

  <ParamField body="piiType" type="string" required>

    Type of PII to detect. Can be a built-in type `email`, `credit_card`, `ip`, `mac_address`, `url`) or a custom type name.

  </ParamField>

  <ParamField body="strategy" type="string" default="redact">

    How to handle detected PII. Options:

    * `'block'` - Throw error when detected

    * `'redact'` - Replace with `[REDACTED_TYPE]`

     **`'mask'` *- Partially mask (e.g.,* `***-****-****-1234`)

    * `'hash'` - Replace with deterministic hash (e.g., `<email_hash:a1b2c3d4>`)

  </ParamField>

  <ParamField body="detector" type="RegExp | string | function">

    Custom detector. Can be:

    * `RegExp` - Regex pattern for matching

    * `string` - Regex pattern string (e.g., `"sk-[a-zA-Z0-9]{32}"`)

    * `function` - Custom detector function `(content: string) => PIIMatch[]`

    If not provided, uses built-in detector for the PII type.

  </ParamField>

  <ParamField body="applyToInput" type="boolean" default="true">

    Check user messages before model call

  </ParamField>

  <ParamField body="applyToOutput" type="boolean" default="false">

    Check AI messages after model call

  </ParamField>

  <ParamField body="applyToToolResults" type="boolean" default="false">

    Check tool result messages after execution

  </ParamField>

</Accordion>

### To-do list

Equip agents with task planning and tracking capabilities for complex multi-step tasks. To-do lists are useful for the following:

* Complex multi-step tasks requiring coordination across multiple tools.

* Long-running operations where progress visibility is important.

<Note>

  This middleware automatically provides agents with a `write_todos` tool and system prompts to guide effective task planning.

</Note>

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, todoListMiddleware } from "langchain";

const agent = createAgent({

  model: "gpt-5.4",

  tools: [readFile, writeFile, runTests],

  middleware: [todoListMiddleware()],

});

```

<Callout icon="player-play" iconType="solid">

  Watch this [video guide]([https://www.youtube.com/watch?v=dwvhZ1z_Pas](https://www.youtube.com/watch?v=dwvhZ1z_Pas)) demonstrating To-do List middleware behavior.

</Callout>

<Accordion title="Configuration options">

  No configuration options available (uses defaults).

</Accordion>

### LLM tool selector

Use an LLM to intelligently select relevant tools before calling the main model. LLM tool selectors are useful for the following:

* Agents with many tools (10+) where most aren't relevant per query.

* Reducing token usage by filtering irrelevant tools.

* Improving model focus and accuracy.

This middleware uses structured output to ask an LLM which tools are most relevant for the current query. The structured output schema defines the available tool names and descriptions. Model providers often add this structured output information to the system prompt behind the scenes.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, llmToolSelectorMiddleware } from "langchain";

const agent = createAgent({

  model: "gpt-5.4",

  tools: [tool1, tool2, tool3, tool4, tool5, ...],

  middleware: [

    llmToolSelectorMiddleware({

      model: "gpt-5.4-mini",

      maxTools: 3,

      alwaysInclude: ["search"],

    }),

  ],

});

```

<Accordion title="Configuration options">

  <ParamField body="model" type="string | BaseChatModel">

    Model for tool selection. Can be a model identifier string (e.g., `'openai:gpt-5.4-mini'`) or a `BaseChatModel` instance. Defaults to the agent's main model.

  </ParamField>

  <ParamField body="systemPrompt" type="string">

    Instructions for the selection model. Uses built-in prompt if not specified.

  </ParamField>

  <ParamField body="maxTools" type="number">

    Maximum number of tools to select. If the model selects more, only the first maxTools will be used. No limit if not specified.

  </ParamField>

  <ParamField body="alwaysInclude" type="string[]">

    Tool names to always include regardless of selection. These do not count against the maxTools limit.

  </ParamField>

</Accordion>

### Tool retry

Automatically retry failed tool calls with configurable exponential backoff. Tool retry is useful for the following:

* Handling transient failures in external API calls.

* Improving reliability of network-dependent tools.

* Building resilient agents that gracefully handle temporary errors.

**API reference:** `toolRetryMiddleware`]([https://reference.langchain.com/javascript/langchain/index/toolRetryMiddleware](https://reference.langchain.com/javascript/langchain/index/toolRetryMiddleware))

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, toolRetryMiddleware } from "langchain";

const agent = createAgent({

  model: "gpt-5.4",

  tools: [searchTool, databaseTool],

  middleware: [

    toolRetryMiddleware({

      maxRetries: 3,

      backoffFactor: 2.0,

      initialDelayMs: 1000,

    }),

  ],

});

```

<Accordion title="Configuration options">

  <ParamField body="maxRetries" type="number" default="2">

    Maximum number of retry attempts after the initial call (3 total attempts with default). Must be >= 0.

  </ParamField>

  <ParamField body="tools" type="(ClientTool | ServerTool | string)[]">

    Optional array of tools or tool names to apply retry logic to. Can be a list of `BaseTool` instances or tool name strings. If `undefined`, applies to all tools.

  </ParamField>

  <ParamField body="retryOn" type="((error: Error) => boolean) | (new (...args: any[]) => Error)[]" default="() => true">

    Either an array of error constructors to retry on, or a function that takes an error and returns `true` if it should be retried. Default is to retry on all errors.

  </ParamField>

  <ParamField body="onFailure" type="'error' | 'continue' | ((error: Error) => string)" default="continue">

    Behavior when all retries are exhausted. Options:

    * `'continue'` (default) - Return a `ToolMessage` with error details, allowing the LLM to handle the failure and potentially recover

    * `'error'` - Re-raise the exception, stopping agent execution

    * Custom function - Function that takes the exception and returns a string for the `ToolMessage` content, allowing custom error formatting

    **Deprecated values:** `'raise'` (use `'error'` instead) and `'return_message'` (use `'continue'` instead). These deprecated values still work but will show a warning.

  </ParamField>

  <ParamField body="backoffFactor" type="number" default="2.0">

    Multiplier for exponential backoff. Each retry waits `initialDelayMs  (backoffFactor * retryNumber)` milliseconds. Set to `0.0` for constant delay. Must be >= 0.

  </ParamField>

  <ParamField body="initialDelayMs" type="number" default="1000">

    Initial delay in milliseconds before first retry. Must be >= 0.

  </ParamField>

  <ParamField body="maxDelayMs" type="number" default="60000">

    Maximum delay in milliseconds between retries (caps exponential backoff growth). Must be >= 0.

  </ParamField>

  <ParamField body="jitter" type="boolean" default="true">

    Whether to add random jitter `±25%`) to delay to avoid thundering herd

  </ParamField>

</Accordion>

<Accordion title="Full example">

  The middleware automatically retries failed tool calls with exponential backoff.

  **Key configuration:**

  * `maxRetries` - Number of retry attempts (default: 2)

  * `backoffFactor` - Multiplier for exponential backoff (default: 2.0)

  * `initialDelayMs` - Starting delay in milliseconds (default: 1000ms)

  * `maxDelayMs` - Cap on delay growth (default: 60000ms)

  * `jitter` - Add random variation (default: true)

  **Failure handling:**

  * `onFailure: "continue"` (default) - Return error message

  * `onFailure: "error"` - Re-raise exception

  * Custom function - Function returning error message

  ```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import { createAgent, toolRetryMiddleware } from "langchain";

  import { tool } from "@langchain/core/tools";

  import { z } from "zod";

  // Basic usage with default settings (2 retries, exponential backoff)

  const agent = createAgent({

    model: "gpt-5.4",

    tools: [searchTool, databaseTool],

    middleware: [toolRetryMiddleware()],

  });

  // Retry specific exceptions only

  const retry = toolRetryMiddleware({

    maxRetries: 4,

    retryOn: [TimeoutError, NetworkError],

    backoffFactor: 1.5,

  });

  // Custom exception filtering

  function shouldRetry(error: Error): boolean {

    // Only retry on 5xx errors

    if ([error.name](http://error.name) === "HTTPError" && "statusCode" in error) {

      const statusCode = (error as any).statusCode;

      return 500 <= statusCode && statusCode < 600;

    }

    return false;

  }

  const retryWithFilter = toolRetryMiddleware({

    maxRetries: 3,

    retryOn: shouldRetry,

  });

  // Apply to specific tools with custom error handling

  const formatError = (error: Error) =>

    "Database temporarily unavailable. Please try again later.";

  const retrySpecificTools = toolRetryMiddleware({

    maxRetries: 4,

    tools: ["search_database"],

    onFailure: formatError,

  });

  // Apply to specific tools using BaseTool instances

  const searchDatabase = tool(

    async ({ query }) => {

      // Search implementation

      return results;

    },

    {

      name: "search_database",

      description: "Search the database",

      schema: z.object({ query: z.string() }),

    }

  );

  const retryWithToolInstance = toolRetryMiddleware({

    maxRetries: 4,

    tools: [searchDatabase], // Pass BaseTool instance

  });

  // Constant backoff (no exponential growth)

  const constantBackoff = toolRetryMiddleware({

    maxRetries: 5,

    backoffFactor: 0.0, // No exponential growth

    initialDelayMs: 2000, // Always wait 2 seconds

  });

  // Raise exception on failure

  const strictRetry = toolRetryMiddleware({

    maxRetries: 2,

    onFailure: "error", // Re-raise exception instead of returning message

  });

  ```

</Accordion>

### Model retry

Automatically retry failed model calls with configurable exponential backoff. Model retry is useful for the following:

* Handling transient failures in model API calls.

* Improving reliability of network-dependent model requests.

* Building resilient agents that gracefully handle temporary model errors.

**API reference:** `modelRetryMiddleware`]([https://reference.langchain.com/javascript/langchain/index/modelRetryMiddleware](https://reference.langchain.com/javascript/langchain/index/modelRetryMiddleware))

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, modelRetryMiddleware } from "langchain";

const agent = createAgent({

  model: "gpt-5.4",

  tools: [searchTool, databaseTool],

  middleware: [

    modelRetryMiddleware({

      maxRetries: 3,

      backoffFactor: 2.0,

      initialDelayMs: 1000,

    }),

  ],

});

```

<Accordion title="Configuration options">

  <ParamField body="maxRetries" type="number" default="2">

    Maximum number of retry attempts after the initial call (3 total attempts with default). Must be >= 0.

  </ParamField>

  <ParamField body="retryOn" type="((error: Error) => boolean) | (new (...args: any[]) => Error)[]" default="() => true">

    Either an array of error constructors to retry on, or a function that takes an error and returns `true` if it should be retried. Default is to retry on all errors.

  </ParamField>

  <ParamField body="onFailure" type="'error' | 'continue' | ((error: Error) => string)" default="continue">

    Behavior when all retries are exhausted. Options:

    * `'continue'` (default) - Return an `AIMessage` with error details, allowing the agent to potentially handle the failure gracefully

    * `'error'` - Re-raise the exception, stopping agent execution

    * Custom function - Function that takes the exception and returns a string for the `AIMessage` content, allowing custom error formatting

  </ParamField>

  <ParamField body="backoffFactor" type="number" default="2.0">

    Multiplier for exponential backoff. Each retry waits `initialDelayMs  (backoffFactor * retryNumber)` milliseconds. Set to `0.0` for constant delay. Must be >= 0.

  </ParamField>

  <ParamField body="initialDelayMs" type="number" default="1000">

    Initial delay in milliseconds before first retry. Must be >= 0.

  </ParamField>

  <ParamField body="maxDelayMs" type="number" default="60000">

    Maximum delay in milliseconds between retries (caps exponential backoff growth). Must be >= 0.

  </ParamField>

  <ParamField body="jitter" type="boolean" default="true">

    Whether to add random jitter `±25%`) to delay to avoid thundering herd

  </ParamField>

</Accordion>

<Accordion title="Full example">

  The middleware automatically retries failed model calls with exponential backoff.

  ```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import { createAgent, modelRetryMiddleware } from "langchain";

  // Basic usage with default settings (2 retries, exponential backoff)

  const agent = createAgent({

    model: "gpt-5.4",

    tools: [searchTool],

    middleware: [modelRetryMiddleware()],

  });

  class TimeoutError extends Error {

      // ...

  }

  class NetworkError extends Error {

      // ...

  }

  // Retry specific exceptions only

  const retry = modelRetryMiddleware({

    maxRetries: 4,

    retryOn: [TimeoutError, NetworkError],

    backoffFactor: 1.5,

  });

  // Custom exception filtering

  function shouldRetry(error: Error): boolean {

    // Only retry on rate limit errors

    if ([error.name](http://error.name) === "RateLimitError") {

      return true;

    }

    // Or check for specific HTTP status codes

    if ([error.name](http://error.name) === "HTTPError" && "statusCode" in error) {

      const statusCode = (error as any).statusCode;

      return statusCode === 429 || statusCode === 503;

    }

    return false;

  }

  const retryWithFilter = modelRetryMiddleware({

    maxRetries: 3,

    retryOn: shouldRetry,

  });

  // Return error message instead of raising

  const retryContinue = modelRetryMiddleware({

    maxRetries: 4,

    onFailure: "continue", // Return AIMessage with error instead of throwing

  });

  // Custom error message formatting

  const formatError = (error: Error) =>

    `Model call failed: ${error.message}. Please try again later.`;

  const retryWithFormatter = modelRetryMiddleware({

    maxRetries: 4,

    onFailure: formatError,

  });

  // Constant backoff (no exponential growth)

  const constantBackoff = modelRetryMiddleware({

    maxRetries: 5,

    backoffFactor: 0.0, // No exponential growth

    initialDelayMs: 2000, // Always wait 2 seconds

  });

  // Raise exception on failure

  const strictRetry = modelRetryMiddleware({

    maxRetries: 2,

    onFailure: "error", // Re-raise exception instead of returning message

  });

  ```

</Accordion>

### LLM tool emulator

Emulate tool execution using an LLM for testing purposes, replacing actual tool calls with AI-generated responses. LLM tool emulators are useful for the following:

* Testing agent behavior without executing real tools.

* Developing agents when external tools are unavailable or expensive.

* Prototyping agent workflows before implementing actual tools.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, toolEmulatorMiddleware } from "langchain";

const agent = createAgent({

  model: "gpt-5.4",

  tools: [getWeather, searchDatabase, sendEmail],

  middleware: [

    toolEmulatorMiddleware(), // Emulate all tools

  ],

});

```

<Accordion title="Configuration options">

  <ParamField body="tools" type="(string | ClientTool | ServerTool)[]">

    List of tool names (string) or tool instances to emulate. If `undefined` (default), ALL tools will be emulated. If empty array `[]`, no tools will be emulated. If array with tool names/instances, only those tools will be emulated.

  </ParamField>

  <ParamField body="model" type="string | BaseChatModel">

    Model to use for generating emulated tool responses. Can be a model identifier string (e.g., `'google_genai:gemini-3.1-pro-preview'`) or a `BaseChatModel` instance. Defaults to the agent's model if not specified.

  </ParamField>

</Accordion>

<Accordion title="Full example">

  The middleware uses an LLM to generate plausible responses for tool calls instead of executing the actual tools.

  ```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import { createAgent, toolEmulatorMiddleware, tool } from "langchain";

  import * as z from "zod";

  const getWeather = tool(

    async ({ location }) => `Weather in ${location}`,

    {

      name: "get_weather",

      description: "Get the current weather for a location",

      schema: z.object({ location: z.string() }),

    }

  );

  const sendEmail = tool(

    async ({ to, subject, body }) => "Email sent",

    {

      name: "send_email",

      description: "Send an email",

      schema: z.object({

        to: z.string(),

        subject: z.string(),

        body: z.string(),

      }),

    }

  );

  // Emulate all tools (default behavior)

  const agent = createAgent({

    model: "gpt-5.4",

    tools: [getWeather, sendEmail],

    middleware: [toolEmulatorMiddleware()],

  });

  // Emulate specific tools by name

  const agent2 = createAgent({

    model: "gpt-5.4",

    tools: [getWeather, sendEmail],

    middleware: [

      toolEmulatorMiddleware({

        tools: ["get_weather"],

      }),

    ],

  });

  // Emulate specific tools by passing tool instances

  const agent3 = createAgent({

    model: "gpt-5.4",

    tools: [getWeather, sendEmail],

    middleware: [

      toolEmulatorMiddleware({

        tools: [getWeather],

      }),

    ],

  });

  // Use custom model for emulation

  const agent5 = createAgent({

    model: "gpt-5.4",

    tools: [getWeather, sendEmail],

    middleware: [

      toolEmulatorMiddleware({

        model: "claude-sonnet-4-6",

      }),

    ],

  });

  ```

</Accordion>

### Context editing

Manage conversation context by clearing older tool call outputs when token limits are reached, while preserving recent results. This helps keep context windows manageable in long conversations with many tool calls. Context editing is useful for the following:

* Long conversations with many tool calls that exceed token limits

* Reducing token costs by removing older tool outputs that are no longer relevant

* Maintaining only the most recent N tool results in context

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, contextEditingMiddleware, ClearToolUsesEdit } from "langchain";

const agent = createAgent({

  model: "gpt-5.4",

  tools: [],

  middleware: [

    contextEditingMiddleware({

      edits: [

        new ClearToolUsesEdit({

          triggerTokens: 100000,

          keep: 3,

        }),

      ],

    }),

  ],

});

```

<Accordion title="Configuration options">

  <ParamField body="edits" type="ContextEdit[]" default="[new ClearToolUsesEdit()]">

    Array of `ContextEdit`]([https://reference.langchain.com/javascript/langchain/index/ContextEdit](https://reference.langchain.com/javascript/langchain/index/ContextEdit)) strategies to apply

  </ParamField>

  **`ClearToolUsesEdit`]([https://reference.langchain.com/javascript/langchain/index/ClearToolUsesEdit](https://reference.langchain.com/javascript/langchain/index/ClearToolUsesEdit)) options:**

  <ParamField body="triggerTokens" type="number" default="100000">

    Token count that triggers the edit. When the conversation exceeds this token count, older tool outputs will be cleared.

  </ParamField>

  <ParamField body="clearAtLeast" type="number" default="0">

    Minimum number of tokens to reclaim when the edit runs. If set to 0, clears as much as needed.

  </ParamField>

  <ParamField body="keep" type="number" default="3">

    Number of most recent tool results that must be preserved. These will never be cleared.

  </ParamField>

  <ParamField body="clearToolInputs" type="boolean" default="false">

    Whether to clear the originating tool call parameters on the AI message. When `true`, tool call arguments are replaced with empty objects.

  </ParamField>

  <ParamField body="excludeTools" type="string[]" default="[]">

    List of tool names to exclude from clearing. These tools will never have their outputs cleared.

  </ParamField>

  <ParamField body="placeholder" type="string" default="[cleared]">

    Placeholder text inserted for cleared tool outputs. This replaces the original tool message content.

  </ParamField>

</Accordion>

<Accordion title="Full example">

  The middleware applies context editing strategies when token limits are reached. The most common strategy is `ClearToolUsesEdit`, which clears older tool results while preserving recent ones.

  **How it works:**

  1. Monitor token count in conversation

  2. When threshold is reached, clear older tool outputs

  3. Keep most recent N tool results

  4. Optionally preserve tool call arguments for context

  ```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import { createAgent, contextEditingMiddleware, ClearToolUsesEdit } from "langchain";

  const agent = createAgent({

    model: "gpt-5.4",

    tools: [searchTool, calculatorTool, databaseTool],

    middleware: [

      contextEditingMiddleware({

        edits: [

          new ClearToolUsesEdit({

            triggerTokens: 2000,

            keep: 3,

            clearToolInputs: false,

            excludeTools: [],

            placeholder: "[cleared]",

          }),

        ],

      }),

    ],

  });

  ```

</Accordion>

### Filesystem middleware

Context engineering is a main challenge in building effective agents. This is particularly difficult when using tools that return variable-length results (for example, `web_search` and RAG), as long tool results can quickly fill your context window.

`FilesystemMiddleware` from [Deep Agents](/oss/javascript/deepagents/overview) provides four tools for interacting with both short-term and long-term memory:

* `ls`: List the files in the filesystem

* `read_file`: Read an entire file or a certain number of lines from a file

* `write_file`: Write a new file to the filesystem

* `edit_file`: Edit an existing file in the filesystem

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent } from "langchain";

import { createFilesystemMiddleware } from "deepagents";

// FilesystemMiddleware is included by default in createDeepAgent

// You can customize it if building a custom agent

const agent = createAgent({

  model: "claude-sonnet-4-6",

  middleware: [

    createFilesystemMiddleware({

      backend: undefined,  // Optional: custom backend (defaults to StateBackend)

      systemPrompt: "Write to the filesystem when...",  // Optional custom system prompt override

      customToolDescriptions: {

        ls: "Use the ls tool when...",

        read_file: "Use the read_file tool to...",

      },  // Optional: Custom descriptions for filesystem tools

    }),

  ],

});

```

#### Short-term vs. long-term filesystem

By default, these tools write to a local "filesystem" in your graph state. To enable persistent storage across threads, configure a `CompositeBackend` that routes specific paths (like `/memories/`) to a `StoreBackend`.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent } from "langchain";

import { createFilesystemMiddleware, CompositeBackend, StateBackend, StoreBackend } from "deepagents";

import { InMemoryStore } from "@langchain/langgraph-checkpoint";

const store = new InMemoryStore();

const agent = createAgent({

  model: "claude-sonnet-4-6",

  store,

  middleware: [

    createFilesystemMiddleware({

      backend: new CompositeBackend(

        new StateBackend(),

        { "/memories/": new StoreBackend() }

      ),

      systemPrompt: "Write to the filesystem when...", // Optional custom system prompt override

      customToolDescriptions: {

        ls: "Use the ls tool when...",

        read_file: "Use the read_file tool to...",

      }, // Optional: Custom descriptions for filesystem tools

    }),

  ],

});

```

When you configure a `CompositeBackend` with a `StoreBackend` for `/memories/`, any files prefixed with **/memories/** are saved to persistent storage and survive across different threads. Files without this prefix remain in ephemeral state storage.

### Subagent

Handing off tasks to subagents isolates context, keeping the main (supervisor) agent's context window clean while still going deep on a task.

The subagents middleware from [Deep Agents](/oss/javascript/deepagents/overview) allows you to supply subagents through a `task` tool.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { tool } from "langchain";

import { createAgent } from "langchain";

import { createSubAgentMiddleware } from "deepagents";

import { z } from "zod";

const getWeather = tool(

  async ({ city }: { city: string }) => {

    return `The weather in ${city} is sunny.`;

  },

  {

    name: "get_weather",

    description: "Get the weather in a city.",

    schema: z.object({

      city: z.string(),

    }),

  },

);

const agent = createAgent({

  model: "claude-sonnet-4-6",

  middleware: [

    createSubAgentMiddleware({

      defaultModel: "claude-sonnet-4-6",

      defaultTools: [],

      subagents: [

        {

          name: "weather",

          description: "This subagent can get weather in cities.",

          systemPrompt: "Use the get_weather tool to get the weather in a city.",

          tools: [getWeather],

          model: "gpt-5.4",

          middleware: [],

        },

      ],

    }),

  ],

});

```

A subagent is defined with a **name**, **description**, **system prompt**, and **tools**. You can also provide a subagent with a custom **model**, or with additional **middleware**. This can be particularly useful when you want to give the subagent an additional state key to share with the main agent.

For more complex use cases, you can also provide your own prebuilt LangGraph graph as a subagent.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { tool, createAgent } from "langchain";

import { createSubAgentMiddleware, type SubAgent } from "deepagents";

import { z } from "zod";

const getWeather = tool(

  async ({ city }: { city: string }) => {

    return `The weather in ${city} is sunny.`;

  },

  {

    name: "get_weather",

    description: "Get the weather in a city.",

    schema: z.object({

      city: z.string(),

    }),

  },

);

const weatherSubagent: SubAgent = {

  name: "weather",

  description: "This subagent can get weather in cities.",

  systemPrompt: "Use the get_weather tool to get the weather in a city.",

  tools: [getWeather],

  model: "gpt-5.4",

  middleware: [],

};

const agent = createAgent({

  model: "claude-sonnet-4-6",

  middleware: [

    createSubAgentMiddleware({

      defaultModel: "claude-sonnet-4-6",

      defaultTools: [],

      subagents: [weatherSubagent],

    }),

  ],

});

```

In addition to any user-defined subagents, the main agent has access to a `general-purpose` subagent at all times. This subagent has the same instructions as the main agent and all the tools it has access to. The primary purpose of the `general-purpose` subagent is context isolation—the main agent can delegate a complex task to this subagent and get a concise answer back without bloat from intermediate tool calls.

## Provider-specific middleware

These middleware are optimized for specific LLM providers. See each provider's documentation for full details and examples.

<Columns cols={2}>

  <Card title="Anthropic" href="/oss/javascript/integrations/middleware/anthropic" icon="[https://mintcdn.com/langchain-5e9cc07a/y4fKEo7ANyWBQMjp/images/providers/anthropic-icon.svg?fit=max&auto=format&n=y4fKEo7ANyWBQMjp&q=85&s=9212db764598a2d3f02f471b5436ae9e](https://mintcdn.com/langchain-5e9cc07a/y4fKEo7ANyWBQMjp/images/providers/anthropic-icon.svg?fit=max&auto=format&n=y4fKEo7ANyWBQMjp&q=85&s=9212db764598a2d3f02f471b5436ae9e)" arrow width="65" height="65" data-path="images/providers/anthropic-icon.svg">

    Prompt caching, bash tool, text editor, memory, and file search middleware for Claude models.

  </Card>

</Columns>

***

<div className="source-links">

  <Callout icon="terminal-2">

    [Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.

  </Callout>

  <Callout icon="edit">

    [Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/middleware/built-in.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/middleware/built-in.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).

  </Callout>

</div>

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Manage prompts programmatically

You can use the LangSmith Python and TypeScript SDK to manage prompts programmatically.

<Note>

  Previously this functionality lived in the `langchainhub` package which is now deprecated. All functionality going forward will live in the `langsmith` package.

</Note>

## Install packages

In Python, you can directly use the LangSmith SDK (*recommended, full functionality*) or you can use through the LangChain package (limited to pushing and pulling prompts).

In TypeScript, you must use the LangChain npm package for pulling prompts (it also allows pushing). For all other functionality, use the LangSmith package.

<CodeGroup>

  ```bash pip theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  pip install -U langsmith # version >= 0.1.99

  ```

  ```bash uv theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  uv add langsmith  # version >= 0.1.99

  ```

  ```bash TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  yarn add langsmith langchain # langsmith version >= 0.1.99 and langchain version >= 0.2.14

  ```

</CodeGroup>

## Configure environment variables

If you already have `LANGSMITH_API_KEY` set to your current workspace's api key from LangSmith, you can skip this step.

Otherwise, get an API key for your workspace by navigating to `Settings > API Keys > Create API Key` in LangSmith.

Set your environment variable.

```bash theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

export LANGSMITH_API_KEY="lsv2_..."

```

<Note>

  What we refer to as "prompts" used to be called "repos", so any references to "repo" in the code are referring to a prompt.

</Note>

## Push a prompt

To create a new prompt or update an existing prompt, you can use the `push prompt` method.

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langsmith import Client

  from langchain_core.prompts import ChatPromptTemplate

  client = Client()

  prompt = ChatPromptTemplate.from_template("tell me a joke about {topic}")

  url = client.push_prompt("joke-generator", object=prompt)

  # url is a link to the prompt in the UI

  print(url)

  ```

  ```python LangChain (Python) theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langchain_classic import hub as prompts

  from langchain_core.prompts import ChatPromptTemplate

  prompt = ChatPromptTemplate.from_template("tell me a joke about {topic}")

  url = prompts.push("joke-generator", prompt)

  # url is a link to the prompt in the UI

  print(url)

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  import { ChatPromptTemplate } from "@langchain/core/prompts";

  const prompt = ChatPromptTemplate.fromTemplate("tell me a joke about {topic}");

  const url = hub.push("joke-generator", {

    object: prompt,

  });

  // url is a link to the prompt in the UI

  console.log(url);

  ```

  ```java Java theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import com.langchain.smith.models.prompts.PromptPushParams;

  import com.langchain.smith.models.prompts.Prompt;

  Prompt prompt = Prompt.builder()

      .name("joke-generator")

      .object(prompt)

      .build();

  var url = client.prompts().push(prompt);

  ```

</CodeGroup>

You can also push a prompt as a RunnableSequence of a prompt and a model. This is useful for storing the model configuration you want to use with this prompt. The provider must be supported by the Playground, see [supported model providers](/langsmith/playground-model-providers).

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langsmith import Client

  from langchain_core.prompts import ChatPromptTemplate

  from langchain_openai import ChatOpenAI

  client = Client()

  model = ChatOpenAI(model="gpt-5.4-mini")

  prompt = ChatPromptTemplate.from_template("tell me a joke about {topic}")

  chain = prompt | model

  client.push_prompt("joke-generator-with-model", object=chain)

  ```

  ```python LangChain (Python) theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langchain_classic import hub as prompts

  from langchain_core.prompts import ChatPromptTemplate

  from langchain_openai import ChatOpenAI

  model = ChatOpenAI(model="gpt-5.4-mini")

  prompt = ChatPromptTemplate.from_template("tell me a joke about {topic}")

  chain = prompt | model

  url = prompts.push("joke-generator-with-model", chain)

  # url is a link to the prompt in the UI

  print(url)

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  import { ChatPromptTemplate } from "@langchain/core/prompts";

  import { ChatOpenAI } from "@langchain/openai";

  const model = new ChatOpenAI({ model: "gpt-5.4-mini" });

  const prompt = ChatPromptTemplate.fromTemplate("tell me a joke about {topic}");

  const chain = prompt.pipe(model);

  await hub.push("joke-generator-with-model", {

    object: chain,

  });

  ```

</CodeGroup>

## Push a StructuredPrompt

A `StructuredPrompt` combines a prompt template with an output schema, ensuring the model returns data in a defined structure. Use `StructuredPrompt.from_messages_and_schema` (Python) or `StructuredPrompt.fromMessagesAndSchema` (TypeScript) to create one, then push it to the hub like any other prompt.

### Without a model

Push the structured prompt on its own when you want to store the template and schema independently of any model configuration.

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langsmith import Client

  from langchain_core.prompts.structured import StructuredPrompt

  from pydantic import BaseModel, Field

  class ResponseSchema(BaseModel):

      positive_sentiment: bool = Field(description="Was the user sentiment positive?")

  prompt = StructuredPrompt.from_messages_and_schema(

      [

          ("system", "Evaluate the sentiment of the following conversation."),

          ("human", "{conversation}"),

      ],

      schema=ResponseSchema.model_json_schema(),

  )

  client = Client()

  url = client.push_prompt("sentiment-evaluator", object=prompt)

  print(url)

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  import { StructuredPrompt } from "@langchain/core/prompts";

  const schema = {

    title: "ResponseSchema",

    type: "object",

    properties: {

      positive_sentiment: {

        type: "boolean",

        description: "Was the user sentiment positive?",

      },

    },

    required: ["positive_sentiment"],

  };

  const prompt = StructuredPrompt.fromMessagesAndSchema(

    [

      ["system", "Evaluate the sentiment of the following conversation."],

      ["human", "{conversation}"],

    ],

    schema

  );

  const url = await hub.push("sentiment-evaluator", prompt);

  console.log(url);

  ```

</CodeGroup>

### With a model

Push the structured prompt as a RunnableSequence with a model to store the full pipeline, including model configuration, in the hub.

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langsmith import Client

  from langchain_core.prompts.structured import StructuredPrompt

  from langchain_openai import ChatOpenAI

  from pydantic import BaseModel, Field

  class ResponseSchema(BaseModel):

      positive_sentiment: bool = Field(description="Was the user sentiment positive?")

  prompt = StructuredPrompt.from_messages_and_schema(

      [

          ("system", "Evaluate the sentiment of the following conversation."),

          ("human", "{conversation}"),

      ],

      schema=ResponseSchema.model_json_schema(),

  )

  model = ChatOpenAI(model="gpt-4o-mini")

  chain = prompt | model

  client = Client()

  url = client.push_prompt("sentiment-evaluator-with-model", object=chain)

  print(url)

  ```

</CodeGroup>

## Pull a prompt

To pull a prompt, you can use the `pull prompt` method, which returns the prompt as a langchain `PromptTemplate`.

To pull a **private prompt** you do not need to specify the owner handle (though you can, if you have one set).

To pull a **public prompt** from the LangChain Hub, you need to specify the handle of the prompt's author.

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langsmith import Client

  from langchain_openai import ChatOpenAI

  client = Client()

  prompt = client.pull_prompt("joke-generator")

  model = ChatOpenAI(model="gpt-5.4-mini")

  chain = prompt | model

  chain.invoke({"topic": "cats"})

  ```

  ```python LangChain (Python) theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langchain_classic import hub as prompts

  from langchain_openai import ChatOpenAI

  prompt = prompts.pull("joke-generator")

  model = ChatOpenAI(model="gpt-5.4-mini")

  chain = prompt | model

  chain.invoke({"topic": "cats"})

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  import { ChatOpenAI } from "@langchain/openai";

  const prompt = await hub.pull("joke-generator");

  const model = new ChatOpenAI({ model: "gpt-5.4-mini" });

  const chain = prompt.pipe(model);

  await chain.invoke({"topic": "cats"});

  ```

  ```java Java theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  RepoListPage jokePrompts = client.repos().list(

      RepoListParams.builder()

          .query("joke")

          .isPublic(RepoListParams.IsPublic.FALSE)

          .build()

  );

  ```

</CodeGroup>

Similar to pushing a prompt, you can also pull a prompt as a RunnableSequence of a prompt and a model. Just specify include\_model when pulling the prompt. If the stored prompt includes a model, it will be returned as a RunnableSequence. Make sure you have the proper environment variables set for the model you are using.

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langsmith import Client

  client = Client()

  chain = client.pull_prompt("joke-generator-with-model", include_model=True)

  chain.invoke({"topic": "cats"})

  ```

  ```python LangChain (Python) theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langchain_classic import hub as prompts

  chain = prompts.pull("joke-generator-with-model", include_model=True)

  chain.invoke({"topic": "cats"})

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  import { Runnable } from "@langchain/core/runnables";

  const chain = await hub.pull<Runnable>("joke-generator-with-model", { includeModel: true });

  await chain.invoke({"topic": "cats"});

  ```

</CodeGroup>

When pulling a prompt, you can also specify a specific commit hash or [commit tag](/langsmith/manage-prompts#commit-tags) to pull a specific version of the prompt.

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  prompt = client.pull_prompt("joke-generator:12344e88")

  ```

  ```python LangChain (Python) theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  prompt = prompts.pull("joke-generator:12344e88")

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  const prompt = await hub.pull("joke-generator:12344e88")

  ```

</CodeGroup>

To pull a public prompt from the LangChain Hub, you need to specify the handle of the prompt's author.

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  prompt = client.pull_prompt("efriis/my-first-prompt")

  ```

  ```python LangChain (Python) theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  prompt = prompts.pull("efriis/my-first-prompt")

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  const prompt = await hub.pull("efriis/my-first-prompt")

  ```

</CodeGroup>

<Note>

  For pulling prompts, if you are using Node.js or an environment that supports dynamic imports, we recommend using the `langchain/hub/node` entrypoint, as it handles deserialization of models associated with your prompt configuration automatically.

  If you are in a non-Node environment, "includeModel" is not supported for non-OpenAI models and you should use the base `langchain/hub` entrypoint.

</Note>

## Prompt caching

The LangSmith SDK includes built-in in-memory caching for prompts. When enabled, LangSmith will cache pulled prompts in memory, reducing latency and API calls for frequently used prompts. The cache uses a global singleton instance that is shared across all clients and persists for the lifetime of the process. It implements a stale-while-revalidate pattern, ensuring your application always gets a fast response while keeping prompts up-to-date in the background.

**Requirements:**

* Python SDK: `langsmith >= 0.7.0`

* TypeScript SDK: `langsmith >= 0.5.0`

### Default behavior

Caching is **enabled by default**. When enabled, the default settings are:

| Setting                    | Default         | Description                                                             |

| -------------------------- | --------------- | ----------------------------------------------------------------------- |

| `max_size`                 | 100             | Maximum number of prompts to cache                                      |

| `ttl_seconds`              | 300 (5 minutes) | Time before a cached prompt is considered stale                         |

| `refresh_interval_seconds` | 60              | How often to check for stale prompts and refresh them in the background |

When refreshing, the global cache will use the last client that requested a given prompt to fetch new data.

### Using the cache

By default, all clients use the global prompt cache. No configuration is needed:

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langsmith import Client

  # Obtain a reference to the global cache just for logging metrics

  from langsmith.prompt_cache import prompt_cache_singleton

  # Caching is enabled by default using the global singleton

  client = Client()

  # First pull - fetches from API and caches

  prompt = client.pull_prompt("joke-generator")

  # Subsequent pulls - returns cached version instantly

  prompt = client.pull_prompt("joke-generator")

  # Check cache metrics

  print(f"Cache hits: {prompt_cache_singleton.metrics.hits}")

  print(f"Cache misses: {prompt_cache_singleton.metrics.misses}")

  print(f"Hit rate: {prompt_cache_singleton.metrics.hit_rate:.1%}")

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  // Obtain a reference to the global cache just for logging metrics

  import { promptCacheSingleton } from "langsmith";

  // Caching is enabled by default

  // First pull - fetches from API and caches

  const prompt = await hub.pull("joke-generator");

  // Subsequent pulls - returns cached version instantly

  const prompt2 = await hub.pull("joke-generator");

  // Check cache metrics

  console.log`Cache hits: ${promptCacheSingleton.metrics.hits}`);

  console.log`Cache misses: ${promptCacheSingleton.metrics.misses}`);

  console.log`Hit rate: ${(promptCacheSingleton.hitRate * 100).toFixed(1)}%`);

  ```

</CodeGroup>

### Configuring the global cache

You can configure the global prompt cache that all clients use by default. This is useful when you want to customize caching behavior across your entire application:

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langsmith import Client

  from langsmith.prompt_cache import (

      configure_global_prompt_cache,

      prompt_cache_singleton,

  )

  # Configure global cache before creating any clients

  configure_global_prompt_cache(

      max_size=200,  # Cache up to 200 prompts

      ttl_seconds=7200,  # Consider prompts stale after 2 hours

      refresh_interval_seconds=600,  # Check for stale prompts every 10 minutes

  )

  # All clients will use these settings

  client1 = Client()

  client2 = Client()

  # Both clients share the same global cache with your custom settings

  prompt1 = client1.pull_prompt("prompt-1")

  prompt2 = client2.pull_prompt("prompt-2")

  # Check global cache metrics

  print(f"Global cache hits: {prompt_cache_singleton.metrics.hits}")

  print(f"Global cache misses: {prompt_cache_singleton.metrics.misses}")

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  import {

    configureGlobalPromptCache,

    promptCacheSingleton,

  } from "langsmith";

  // Configure global cache before pulling prompts

  configureGlobalPromptCache({

    maxSize: 200,  // Cache up to 200 prompts

    ttlSeconds: 7200,  // Consider prompts stale after 2 hours

    refreshIntervalSeconds: 600,  // Check for stale prompts every 10 minutes

  });

  // All hub.pull calls will use these settings

  const prompt1 = await hub.pull("prompt-1");

  const prompt2 = await hub.pull("prompt-2");

  // Check global cache metrics

  console.log`Global cache hits: ${promptCacheSingleton.metrics.hits}`);

  console.log`Global cache misses: ${promptCacheSingleton.metrics.misses}`);

  ```

</CodeGroup>

### Disabling the cache

To disable caching for a specific client, pass `disable_prompt_cache=True`. You can also configure a max size of zero globally:

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langsmith import Client

  # Disable caching for this client

  client = Client(disable_prompt_cache=True)

  # Every pull will fetch from the API

  prompt = client.pull_prompt("joke-generator")

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  import { configureGlobalPromptCache } from "langsmith";

  // Disable caching globally

  configureGlobalPromptCache({ maxSize: 0 });

  // Every pull will fetch from the API

  const prompt = await hub.pull("joke-generator");

  ```

</CodeGroup>

### Skipping the cache

To bypass the cache and fetch a fresh prompt from the API for an individual request, use the `skip_cache` parameter:

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  # Force a fresh fetch, ignoring any cached version

  prompt = client.pull_prompt("joke-generator", skip_cache=True)

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  // Force a fresh fetch, ignoring any cached version

  const prompt = await hub.pull("joke-generator", { skipCache: true });

  ```

</CodeGroup>

This is useful when you need to ensure you have the latest version of a prompt, such as after making changes in the LangSmith UI.

### Offline mode

For environments with limited or no network connectivity, you can pre-populate the cache and use it offline. Set `ttl_seconds` to `None` (Python) or `null` (TypeScript) to prevent cache entries from expiring and disable background refresh.

**Step 1: Export your prompts to a cache file (while online)**

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langsmith import Client

  from langsmith.prompt_cache import prompt_cache_singleton

  # Create client (caching is enabled by default)

  client = Client()

  # Pull the prompts you need

  client.pull_prompt("prompt-1")

  client.pull_prompt("prompt-2")

  client.pull_prompt("prompt-3")

  # Export cache to a file

  prompt_cache_singleton.dump("prompts_cache.json")

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  import { promptCacheSingleton } from "langsmith";

  // Caching is enabled by default

  // Pull the prompts you need

  await hub.pull("prompt-1");

  await hub.pull("prompt-2");

  await hub.pull("prompt-3");

  // Export cache to a file

  promptCacheSingleton.dump("prompts_cache.json");

  ```

</CodeGroup>

**Step 2: Load the cache file in your offline environment**

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langsmith import Client

  from langsmith.prompt_cache import (

      configure_global_prompt_cache,

      prompt_cache_singleton,

  )

  # Configure cache with infinite TTL (never expire, no background refresh)

  configure_global_prompt_cache(ttl_seconds=None)

  # Load the cache file

  prompt_cache_singleton.load("prompts_cache.json")

  # Create client (uses the loaded cache)

  client = Client()

  # Uses cached version without any API calls

  prompt = client.pull_prompt("prompt-1")

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  import {

    configureGlobalPromptCache,

    promptCacheSingleton,

  } from "langsmith";

  // Configure cache with infinite TTL (never expire, no background refresh)

  configureGlobalPromptCache({ ttlSeconds: null });

  // Load the cache file

  promptCacheSingleton.load("prompts_cache.json");

  // Uses cached version without any API calls

  const prompt = await hub.pull("prompt-1");

  ```

</CodeGroup>

### Cache operations

The cache supports several operations for managing cached prompts:

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from langsmith import Client

  from langsmith.prompt_cache import prompt_cache_singleton

  client = Client()

  # Invalidate a specific prompt from cache

  prompt_cache_singleton.invalidate("joke-generator:latest")

  # Clear all cached prompts

  prompt_cache_singleton.clear()

  # Reset metrics

  prompt_cache_singleton.reset_metrics()

  # Check if cache is running background refresh

  # (only runs if ttl_seconds is not None)

  if prompt_cache_singleton._refresh_thread is not None:

      print("Background refresh is active")

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import { promptCacheSingleton } from "langsmith";

  // Invalidate a specific prompt from cache

  promptCacheSingleton.invalidate("joke-generator:latest");

  // Clear all cached prompts

  promptCacheSingleton.clear();

  // Reset metrics

  promptCacheSingleton.resetMetrics();

  ```

</CodeGroup>

### Cleanup

You can manually call `stop()` to stop the background refresh task:

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  prompt_cache_singleton.stop()

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  promptCacheSingleton.stop();

  ```

</CodeGroup>

<Note>

  The background refresh task is only started when you first set a value in the cache, and only if `ttl_seconds` is not `None`. If `ttl_seconds` is `None` (offline mode), no background task is created.

</Note>

## Use a prompt without LangChain

If you want to store your prompts in LangSmith but use them directly with a model provider's API, you can use our conversion methods. These convert your prompt into the payload required for the OpenAI or Anthropic API.

These conversion methods rely on logic from within LangChain integration packages, and you will need to install the appropriate package as a dependency in addition to your official SDK of choice. Here are some examples:

### OpenAI

<CodeGroup>

  ```bash Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  pip install -U langchain_openai

  ```

  ```bash TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  yarn add @langchain/openai @langchain/core # @langchain/openai version >= 0.3.2

  ```

</CodeGroup>

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from openai import OpenAI

  from langsmith.client import Client, convert_prompt_to_openai_format

  # langsmith client

  client = Client()

  # openai client

  oai_client = OpenAI()

  # pull prompt and invoke to populate the variables

  prompt = client.pull_prompt("joke-generator")

  prompt_value = prompt.invoke({"topic": "cats"})

  openai_payload = convert_prompt_to_openai_format(prompt_value)

  openai_response = oai_[client.chat](http://client.chat).completions.create(**openai_payload)

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  import { convertPromptToOpenAI } from "@langchain/openai";

  import OpenAI from "openai";

  const prompt = await hub.pull("jacob/joke-generator");

  const formattedPrompt = await prompt.invoke({

    topic: "cats",

  });

  const { messages } = convertPromptToOpenAI(formattedPrompt);

  const openAIClient = new OpenAI();

  const openAIResponse = await [openAIClient.chat](http://openAIClient.chat).completions.create({

    model: "gpt-5.4-mini",

    messages,

  });

  ```

</CodeGroup>

### Anthropic

<CodeGroup>

  ```bash Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  pip install -U langchain_anthropic

  ```

  ```bash TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  yarn add @langchain/anthropic @langchain/core # @langchain/anthropic version >= 0.3.3

  ```

</CodeGroup>

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  from anthropic import Anthropic

  from langsmith.client import Client, convert_prompt_to_anthropic_format

  # langsmith client

  client = Client()

  # anthropic client

  anthropic_client = Anthropic()

  # pull prompt and invoke to populate the variables

  prompt = client.pull_prompt("joke-generator")

  prompt_value = prompt.invoke({"topic": "cats"})

  anthropic_payload = convert_prompt_to_anthropic_format(prompt_value)

  anthropic_response = anthropic_client.messages.create(**anthropic_payload)

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import * as hub from "langchain/hub";

  import { convertPromptToAnthropic } from "@langchain/anthropic";

  import Anthropic from "@anthropic-ai/sdk";

  const prompt = await hub.pull("jacob/joke-generator");

  const formattedPrompt = await prompt.invoke({

    topic: "cats",

  });

  const { messages, system } = convertPromptToAnthropic(formattedPrompt);

  const anthropicClient = new Anthropic();

  const anthropicResponse = await anthropicClient.messages.create({

    model: "claude-haiku-4-5-20251001",

    system,

    messages,

    max_tokens: 1024,

    stream: false,

  });

  ```

</CodeGroup>

## List, delete, and like prompts

You can also list, delete, and like/unlike prompts using the `list prompts`, `delete prompt`, `like prompt` and `unlike prompt` methods. See the [LangSmith SDK client]([https://github.com/langchain-ai/langsmith-sdk](https://github.com/langchain-ai/langsmith-sdk)) for extensive documentation on these methods.

<CodeGroup>

  ```python Python theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  # List all prompts in my workspace

  prompts = client.list_prompts()

  # List my private prompts that include "joke"

  prompts = client.list_prompts(query="joke", is_public=False)

  # Delete a prompt

  client.delete_prompt("joke-generator")

  # Like a prompt

  [client.like](http://client.like)_prompt("efriis/my-first-prompt")

  # Unlike a prompt

  client.unlike_prompt("efriis/my-first-prompt")

  ```

  ```typescript TypeScript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  // List all prompts in my workspace

  import Client from "langsmith";

  const client = new Client({ apiKey: "lsv2_..." });

  const prompts = client.listPrompts();

  for await (const prompt of prompts) {

    console.log(prompt);

  }

  // List my private prompts that include "joke"

  const private_joke_prompts = client.listPrompts({ query: "joke", isPublic: false});

  // Delete a prompt

  client.deletePrompt("joke-generator");

  // Like a prompt

  client.likePrompt("efriis/my-first-prompt");

  // Unlike a prompt

  client.unlikePrompt("efriis/my-first-prompt");

  ```

  ```java Java theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  // List all prompts in my workspace

  RepoListPage prompts = client.repos().list();

  for (RepoWithLookups prompt : prompts.repos()) {

      System.out.println(prompt.repoHandle());

  }

  // List my private prompts that include "joke"

  RepoListPage jokePrompts = client.repos().list(

      RepoListParams.builder()

          .query("joke")

          .isPublic(RepoListParams.IsPublic.FALSE)

          .build()

  );

  // Delete a prompt

  String promptId = "joke-generator";

  String[] parts = promptId.split("/", 2);

  String owner = parts.length > 1 ? parts[0] : "-";

  String repo = parts.length > 1 ? parts[1] : promptId;

  client.repos().delete(

      RepoDeleteParams.builder()

          .owner(owner)

          .repo(repo)

          .build()

  );

  ```

</CodeGroup>

***

<div className="source-links">

  <Callout icon="terminal-2">

    [Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.

  </Callout>

  <Callout icon="edit">

    [Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/langsmith/manage-prompts-programmatically.mdx](https://github.com/langchain-ai/docs/edit/main/src/langsmith/manage-prompts-programmatically.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).

  </Callout>

</div>



