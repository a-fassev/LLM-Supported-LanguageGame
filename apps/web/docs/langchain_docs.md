# LangChain

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# LangChain overview

> LangChain is an open source framework with a prebuilt agent architecture and integrations for any model or tool—so you can build agents that adapt as fast as the ecosystem evolves

Build completely custom agents and applications powered by LLMs in under 10 lines of code, with integrations for [OpenAI, Anthropic, Google, and more](/oss/javascript/integrations/providers/overview).

LangChain provides a prebuilt agent architecture and model integrations to help you get started quickly and seamlessly incorporate LLMs into your agents and applications.

  **LangChain vs. LangGraph vs. Deep Agents**

  Start with [Deep Agents](/oss/javascript/deepagents/overview/) for a "batteries-included" agent with features like automatic context compression, a virtual filesystem, and subagent-spawning. Deep Agents are built on LangChain [agents](/oss/javascript/langchain/agents/) which you can also use LangChain directly.

  Use [LangGraph](/oss/javascript/langgraph/overview), our low-level orchestration framework, for advanced needs combining deterministic and agentic workflows.

## Create an agent

See the [Installation instructions](/oss/javascript/langchain/install) and [Quickstart guide](/oss/javascript/langchain/quickstart) to get started building your own agents and applications with LangChain.

  Use [LangSmith](/langsmith/home) to trace requests, debug agent behavior, and evaluate outputs. Set `LANGSMITH_TRACING=true` and your API key to get started.

## Core benefits

```
Different providers have unique APIs for interacting with models, including the format of responses. LangChain standardizes how you interact with models so that you can seamlessly swap providers and avoid lock-in.
```

```
LangChain's agent abstraction is designed to be easy to get started with, letting you build a simple agent in under 10 lines of code. But it also provides enough flexibility to allow you to do all the context engineering your heart desires.
```

```
LangChain's agents are built on top of LangGraph. This allows us to take advantage of LangGraph's durable execution, human-in-the-loop support, persistence, and more.
```

```
Gain deep visibility into complex agent behavior with visualization tools that trace execution paths, capture state transitions, and provide detailed runtime metrics.
```

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/overview.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/overview.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Install LangChain

To install the LangChain package:

LangChain provides integrations to hundreds of LLMs and thousands of other integrations. These live in independent provider packages.

  See the [Integrations tab](/oss/javascript/integrations/providers/overview) for a full list of available integrations.

Now that you have LangChain installed, you can get started by following the [Quickstart guide](/oss/javascript/langchain/quickstart).

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/install.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/install.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Quickstart

> Build your first agent in minutes

This quickstart shows you how to create a fully functional AI agent in just a few minutes.

  **Using an AI coding assistant?**

- Install the [LangChain Docs MCP server](/use-these-docs) to give your agent access to up-to-date LangChain documentation and examples.
- Install [LangChain Skills]([https://github.com/langchain-ai/langchain-skills](https://github.com/langchain-ai/langchain-skills)) to improve your agent's performance on LangChain ecosystem tasks.

## Install dependencies

Install the following packages to follow along:

## Set up API keys

Get an API key from [any supported model provider](/oss/javascript/integrations/providers/overview) (for example, Google Gemini or OpenAI).

Set the API keys, for example:

```
```bash theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

export OPENAI_API_KEY="your-api-key"

```

```





```

```bash theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

export GOOGLE_API_KEY="your-api-key"

```

```





```

```bash theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

export ANTHROPIC_API_KEY="your-api-key"

```

```





```

```bash theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

export OPENROUTER_API_KEY="your-api-key"

```

```





```

```bash theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

export FIREWORKS_API_KEY="your-api-key"

```

```





```

```bash theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

export BASETEN_API_KEY="your-api-key"

```

```





```

```bash theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

# Local: Ollama must be running ([https://ollama.com](https://ollama.com))

# Cloud: Set your Ollama API key for hosted inference

export OLLAMA_API_KEY="your-api-key"

```

```





```

```bash theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

export AZURE_OPENAI_API_KEY="your-api-key"

export AZURE_OPENAI_ENDPOINT="[https://your-resource.openai.azure.com](https://your-resource.openai.azure.com)"

export AZURE_OPENAI_DEPLOYMENT_NAME="your-deployment"

```

```





```

```bash theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

export AWS_ACCESS_KEY_ID="your-access-key"

export AWS_SECRET_ACCESS_KEY="your-secret-key"

export AWS_REGION="us-east-1"

```

```





```

```bash theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

export HUGGINGFACEHUB_API_TOKEN="hf_..."

```

```





```

See the full list of supported [chat model integrations](/oss/javascript/integrations/chat).

```





## Build a basic agent

Start by creating a simple agent that can answer questions and call tools. The agent in this example uses the chosen language model, a basic weather function as a tool, and a simple prompt to guide its behavior:





When you run the code and prompt the agent to tell you about the weather in San Francisco, the agent uses that input and its available context.

The agent understands that you are asking about the weather for the city San Francisco and therefore calls the weather tool with the provided city name.



  You can use [any supported model](/oss/javascript/integrations/providers/overview) by changing the model name in the code and setting up the appropriate API key.



## Build a real-world agent

In the following example you will build a research agent that can answer questions about text files.

Along the way you will explore the following concepts:

1. **Detailed system prompts** for better agent behavior
2. **Create tools** that integrate with external data
3. **Model configuration** for consistent responses
4. **Conversational memory** for chat-like interactions
5. **Deep Agents** for built-in features
6. **Testing** your agent





```

The system prompt defines your agent’s role and behavior. Keep it specific and actionable:

```ts wrap theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const SYSTEM_PROMPT = `You are a literary data assistant.

## Capabilities

- `fetch_text_from_url\`: loads document text from a URL into the conversation.

Do not guess line counts or positions—ground them in tool results from the saved file.`;

```

```





```

[Tools](/oss/javascript/langchain/tools) let a model interact with external systems by calling functions you define.

Tools can depend on [runtime context](/oss/javascript/langchain/runtime) and also interact with [agent memory](/oss/javascript/langchain/short-term-memory).

This example uses a tool to load a document from a given URL:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { tool } from "@langchain/core/tools";

import { createAgent, initChatModel } from "langchain";

import { z } from "zod";

const fetchTextFromUrl = tool(

    async ({ url }: { url: string }): Promise<string> => {

        const controller = new AbortController();

        const timeoutId = setTimeout(() => controller.abort(), 120_000);

        try {

            const resp = await fetch(url, {

                headers: {

                "User-Agent": "Mozilla/5.0 (compatible; quickstart-research/1.0)",

                },

                signal: controller.signal,

            });

            if (!resp.ok) {

                return `Fetch failed: HTTP ${resp.status} ${resp.statusText}`;

            }

            return await resp.text();

        } catch (e) {

            const msg = e instanceof Error ? e.message : String(e);

            return `Fetch failed: ${msg}`;

        } finally {

            clearTimeout(timeoutId);

        }

    },

    {

        name: "fetch_text_from_url",

        description: "Fetch the document from a URL.",

        schema: z.object({ url: z.string().url() }),

    },

);

```



  [Zod]([https://zod.dev/](https://zod.dev/)) is a library for validating and parsing pre-defined schemas. You can use it to define the input schema for your tools to make sure the agent only calls the tool with the correct arguments.

  Alternatively, you can define the `schema` property as a [JSON schema]([https://json-schema.org/overview/what-is-jsonschema](https://json-schema.org/overview/what-is-jsonschema)) object. Keep in mind that JSON schemas **won't** be validated at runtime.



```
```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { tool } from "langchain";

const fetchTextFromUrl = tool(

async ({ url }: { url: string }): Promise<string> => {

    const controller = new AbortController();

    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    try {

    const resp = await fetch(url, {

        headers: {

        "User-Agent": "Mozilla/5.0 (compatible; quickstart-research/1.0)",

        },

        signal: controller.signal,

    });

    if (!resp.ok) {

        return `Fetch failed: HTTP ${resp.status} ${resp.statusText}`;

    }

    return await resp.text();

    } catch (e) {

    const msg = e instanceof Error ? e.message : String(e);

    return `Fetch failed: ${msg}`;

    } finally {

    clearTimeout(timeoutId);

    }

},

{

    name: "fetch_text_from_url",

    description: "Fetch the document from a URL.",

    schema: {

    type: "object",

    properties: {

        url: {

        type: "string",

        description: "The URL of the document to fetch.",

        format: "uri",

        },

    },

    required: ["url"],

    },

},

);

```
```



```

```
Set up your [language model](/oss/javascript/langchain/models) with the right parameters for your use case. For example:

<CodeGroup>

  ```ts OpenAI theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  import { initChatModel } from "langchain";

  const model = await initChatModel("gpt-5.4", {

    temperature: 0.5,

    timeout: 300,

    maxTokens: 25000,

  });

```



Depending on the model and provider chosen, initialization parameters may vary; refer to their reference pages for details.

```





```

Add [memory](/oss/javascript/langchain/short-term-memory) to your agent to maintain state across interactions. This allows

the agent to remember previous conversations and context.

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

```



  In production, use a persistent checkpointer that saves message history to a database.

  See [Add and manage memory](/oss/javascript/langgraph/add-memory#manage-short-term-memory) for more details.

```

```
Now assemble your agent with all the components and run it.

There are two different frameworks for creating agents: LangChain agents and deep agents.

Both LangChain and deep agents provide you with fine-grained control over tools, memory, and more.

The main difference between both is that deep agents come with a range of commonly useful capabilities already built in, such as planning, file system tools, and subagents.

Use deep agents when you want maximum capability with minimal setup; choose LangChain agents when you need fine-grained control.

<Warning>

  Since the code invokes the model with the entire text from The Great Gatsby, it uses a large amount of tokens.

  You can view example output in the next step.

</Warning>

Let's try both:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

async function main() {

    const agent = createAgent({

        model,

        tools: [fetchTextFromUrl],

        systemPrompt: SYSTEM_PROMPT,

        checkpointer,

    });

    const deepAgent = createDeepAgent({

        model,

        tools: [fetchTextFromUrl],

        systemPrompt: SYSTEM_PROMPT,

        checkpointer,

    });

    const content = `Project Gutenberg hosts a full plain-text copy of F. Scott Fitzgerald's The Great Gatsby.

    URL: [https://www.gutenberg.org/files/64317/64317-0.txt](https://www.gutenberg.org/files/64317/64317-0.txt)

    Answer as much as you can:

    1) How many lines in the complete Gutenberg file contain the substring `Gatsby\` (count lines, not occurrences within a line, each line ends with a line break).

    2) The 1-based line number of the first line in the file that contains `Daisy\`.

    3) A two-sentence neutral synopsis.

    Do your best on (1) and (2). If at any point you realize you cannot **verify** an exact answer with

    your available tools and reasoning, do not fabricate numbers: use `null\` for that field and spell out

    the limitation in `how_you_computed_counts\`. If you encounter any errors please report what the error was and what the error message was.`;

    const agentResult = await agent.invoke(

        { messages: [{ role: "user", content }] },

        { configurable: { thread_id: "great-gatsby-lc" } },

    );

    const deepAgentResult = await deepAgent.invoke(

        { messages: [{ role: "user", content }] },

        { configurable: { thread_id: "great-gatsby-da" } },

    );

    const agentMessages = agentResult.messages;

    const deepMessages = deepAgentResult.messages;

    console.log(agentMessages[agentMessages.length - 1]!.content_blocks);

    console.log("\n");

    console.log(deepMessages[deepMessages.length - 1]!.content_blocks);

}

main().catch((err) => {

    console.error(err);

    process.exitCode = 1;

});

```



```

```
The results will differ based on the model and the execution.

<Tabs default="LangChain agents">

  <Tab title="LangChain agents">

    ```txt wrap expandable theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

    **1) Number of lines containing `Gatsby`:** `null`

    **2) First line containing `Daisy`:** `null`

    **3) Synopsis:**

    The Great Gatsby follows the mysterious millionaire Jay Gatsby and his obsession with reuniting with his former lover, Daisy Buchanan, as narrated by his neighbor Nick Carraway. Set against the backdrop of the Roaring Twenties on Long Island, the novel explores themes of wealth, class, and the elusive nature of the American Dream.

    **how_you_computed_counts:**

    I successfully fetched the full text of the eBook using the `fetch_text_from_url` tool. However, because I do not have access to a code execution environment (like Python) or text-processing tools (like `grep`), I cannot deterministically split the text by line breaks, iterate through the thousands of lines, and verify the exact line numbers or match counts. LLMs cannot reliably perform exact line-counting or indexing over massive texts within their context window without external computational tools. As instructed, rather than fabricating or guessing a number, I have output `null` for the exact counts and positions.

    ```

  </Tab>

  <Tab title="Deep agents">

    ```txt wrap expandable theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

    Based on the text fetched directly from the Gutenberg URL and analyzed using filesystem search tools, here are the answers to your questions:

    **1) Lines containing the substring `Gatsby`**

    **258** lines contain the exact substring `Gatsby`.

    **2) First line containing `Daisy`**

    Line **181** is the first line in the file that contains the exact substring `Daisy`.

    *(For context, the line reads: "Buchanans. Daisy was my second cousin once removed, and I’d known Tom")*

    **3) Two-sentence neutral synopsis**

    *The Great Gatsby* follows the mysterious millionaire Jay Gatsby and his obsessive pursuit to reunite with his former lover, Daisy Buchanan, in 1920s Long Island. The story is narrated by Nick Carraway, who observes the tragic consequences of Gatsby's relentless ambition and the shallow materialism of the era's wealthy elite.

    ***

    **How counts were computed:**

    When fetching the document from the URL, the file was too large for the standard output and was automatically saved to the local filesystem by the system `/large_tool_results/x246ax2x`). I then used the `grep` tool to search the saved file for the exact literal substrings `Gatsby` and `Daisy`. The `grep` tool returned every matching line along with its 1-based line number. I manually counted the exact number of lines returned for `Gatsby` (which totaled 258) and identified the first line number returned for `Daisy` (which was 181). I also verified there were no uppercase variations `GATSBY` or `DAISY`) that would have been missed. No errors were encountered during this process.

    ```

  </Tab>

</Tabs>

If you look at the output on both tabs, you notice that the LangChain agent provided answers but they are estimates. The agent lacks the tools to answer this question. You may also get errors that the prompt is too long.

The deep agent, on the other hand can:

1. **Plans its approach** using the built-in `write_todos`](/oss/javascript/deepagents/harness#planning-capabilities) tool to break down the research task.

2. **Loads the file** by calling the `fetch_text_from_url` tool to gather information.

3. **Manages context** by using file system tools (`grep`](/oss/javascript/deepagents/harness#virtual-filesystem-access) and `read_file`](/oss/javascript/deepagents/harness#virtual-filesystem-access)).

4. **Spawns subagents** as needed to delegate complex subtasks to specialized subagents.

For LangChain agents, you must implement more capabilities to get a similar level of service and can customize them along the way as needed.
```

## Trace agent calls

Most interesting applications you build with LangChain make many calls to LLMs. As these applications get more complex, it becomes important to be able to inspect what exactly is going on inside your agent. The best way to do this is with [LangSmith]([https://smith.langchain.com](https://smith.langchain.com)).

Sign up for a [LangSmith]([https://smith.langchain.com](https://smith.langchain.com)) account and set these to start logging traces:

```shell theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

export LANGSMITH_TRACING="true"

export LANGSMITH_API_KEY="..."

```

Once set, run your script again and then inspect what happened during your agent calls on [LangSmith]([https://smith.langchain.com](https://smith.langchain.com)) .

  To learn more about tracing your agent with LangSmith, see the [LangSmith documentation](/langsmith/trace-with-langchain).

## Next steps

You now have agents that can:

- **Understand context** and remember conversations
- **Use tools** intelligently
- **Provide structured responses** in a consistent format
- **Handle user-specific information** through context
- **Maintain conversation state** across interactions
- **Plan, research, and synthesize** (deep agents only)

Continue with:

- **LangChain agents**: [Add and manage memory](/oss/javascript/langgraph/add-memory#manage-short-term-memory), [deploy to production](/oss/javascript/langgraph/deploy)
- **Deep Agents**: [Customization options](/oss/javascript/deepagents/customization), [persistent memory](/oss/javascript/deepagents/long-term-memory), [deploy to production](/oss/javascript/langgraph/deploy)

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/quickstart.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/quickstart.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Agents

Agents combine language models with [tools](/oss/javascript/langchain/tools) to create systems that can reason about tasks, decide which tools to use, and iteratively work towards solutions.

`createAgent()` provides a production-ready agent implementation.

[An LLM Agent runs tools in a loop to achieve a goal]([https://simonwillison.net/2025/Sep/18/agents/](https://simonwillison.net/2025/Sep/18/agents/)).

An agent runs until a stop condition is met - i.e., when the model emits a final output or an iteration limit is reached.

```mermaid theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

%%{

  init: {

    "fontFamily": "monospace",

    "flowchart": {

      "curve": "curve"

    }

  }

}%%

graph TD

  %% Outside the agent

  QUERY([input])

  LLM{model}

  TOOL(tools)

  ANSWER([output])

  %% Main flows (no inline labels)

  QUERY --> LLM

  LLM --"action"--> TOOL

  TOOL --"observation"--> LLM

  LLM --"finish"--> ANSWER

  classDef blueHighlight fill:#E5F4FF,stroke:#006DDD,color:#030710;

  classDef greenHighlight fill:#F6FFDB,stroke:#6E8900,color:#2E3900;

  class QUERY blueHighlight;

  class ANSWER blueHighlight;

  class LLM greenHighlight;

  class TOOL greenHighlight;

```

  `createAgent()` builds a **graph**-based agent runtime using [LangGraph](/oss/javascript/langgraph/overview). A graph consists of nodes (steps) and edges (connections) that define how your agent processes information. The agent moves through this graph, executing nodes like the model node (which calls the model), the tools node (which executes tools), or middleware.

  Learn more about the [Graph API](/oss/javascript/langgraph/graph-api).

## Core components

### Model

The [model](/oss/javascript/langchain/models) is the reasoning engine of your agent. It can be specified in multiple ways, supporting both static and dynamic model selection.

#### Static model

Static models are configured once when creating the agent and remain unchanged throughout execution. This is the most common and straightforward approach.

To initialize a static model from a model]([https://reference.langchain.com/python/langchain/models/#langchain.chat_models.init_chat_model(model)">model](https://reference.langchain.com/python/langchain/models/#langchain.chat_models.init_chat_model(model)">model)) identifier string:

```ts wrap theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent } from "langchain";

const agent = createAgent({

  model: "openai:gpt-5.4",

  tools: []

});

```

Model identifier strings use the format `provider:model` (e.g. `"openai:gpt-5.4"`). You may want more control over the model configuration, in which case you can initialize a model instance directly using the provider package:

```ts wrap theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent } from "langchain";

import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({

  model: "gpt-5.4",

  temperature: 0.1,

  maxTokens: 1000,

  timeout: 30

});

const agent = createAgent({

  model,

  tools: []

});

```

Model instances give you complete control over configuration. Use them when you need to set specific parameters like `temperature`, `max_tokens`, `timeouts`, or configure API keys, `base_url`, and other provider-specific settings. Refer to the [API reference](/oss/javascript/integrations/providers/) to see available params and methods on your model.

#### Dynamic model

Dynamic models are selected at runtime based on the current state and context. This enables sophisticated routing logic and cost optimization.

To use a dynamic model, create middleware with `wrapModelCall` that modifies the model in the request:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ChatOpenAI } from "@langchain/openai";

import { createAgent, createMiddleware } from "langchain";

const basicModel = new ChatOpenAI({ model: "gpt-5.4-mini" });

const advancedModel = new ChatOpenAI({ model: "gpt-5.4" });

const dynamicModelSelection = createMiddleware({

  name: "DynamicModelSelection",

  wrapModelCall: (request, handler) => {

    // Choose model based on conversation complexity

    const messageCount = request.messages.length;

    return handler({

        ...request,

        model: messageCount > 10 ? advancedModel : basicModel,

    });

  },

});

const agent = createAgent({

  model: "gpt-5.4-mini", // Base model (used when messageCount ≤ 10)

  tools,

  middleware: [dynamicModelSelection],

});

```

For more details on middleware and advanced patterns, see the [middleware documentation](/oss/javascript/langchain/middleware).

  For model configuration details, see [Models](/oss/javascript/langchain/models). For dynamic model selection patterns, see [Dynamic model in middleware](/oss/javascript/langchain/middleware#dynamic-model).

### Tools

Tools give agents the ability to take actions. Agents go beyond simple model-only tool binding by facilitating:

- Multiple tool calls in sequence (triggered by a single prompt)
- Parallel tool calls when appropriate
- Dynamic tool selection based on previous results
- Tool retry logic and error handling
- State persistence across tool calls

For more information, see [Tools](/oss/javascript/langchain/tools).

#### Static tools

Static tools are defined when creating the agent and remain unchanged throughout execution. This is the most common and straightforward approach.

To define an agent with static tools, pass a list of the tools to the agent.

```ts wrap theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import * as z from "zod";

import { createAgent, tool } from "langchain";

const search = tool(

  ({ query }) => `Results for: ${query}`,

  {

    name: "search",

    description: "Search for information",

    schema: z.object({

      query: z.string().describe("The query to search for"),

    }),

  }

);

const getWeather = tool(

  ({ location }) => `Weather in ${location}: Sunny, 72°F`,

  {

    name: "get_weather",

    description: "Get weather information for a location",

    schema: z.object({

      location: z.string().describe("The location to get weather for"),

    }),

  }

);

const agent = createAgent({

  model: "gpt-5.4",

  tools: [search, getWeather],

});

```

If an empty tool list is provided, the agent will consist of a single LLM node without tool-calling capabilities.

#### Dynamic tools

With dynamic tools, the set of tools available to the agent is modified at runtime rather than defined all upfront. Not every tool is appropriate for every situation. Too many tools may overwhelm the model (overload context) and increase errors; too few limit capabilities. Dynamic tool selection enables adapting the available toolset based on authentication state, user permissions, feature flags, or conversation stage.

There are two approaches depending on whether tools are known ahead of time:

```
When all possible tools are known at agent creation time, you can pre-register them and dynamically filter which ones are exposed to the model based on state, permissions, or context.

<Tabs>

  <Tab title="State">

    Enable advanced tools only after certain conversation milestones:

    ```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

    import { createMiddleware, tool } from "langchain";

    import { createDeepAgent } from "deepagents";

    const stateBasedTools = createMiddleware({

        name: "StateBasedTools",

        wrapModelCall: (request, handler) => {

            // Read from State: check authentication and conversation length

            const state = request.state as typeof request.state & {

                authenticated?: boolean;

            };

            const isAuthenticated = state.authenticated ?? false;

            const messageCount = state.messages.length;

            let filteredTools = [request.tools](http://request.tools);

            // Only enable sensitive tools after authentication

            if (!isAuthenticated) {

                filteredTools = [request.tools](http://request.tools).filter(

                    (t: any) => typeof [t.name](http://t.name) === "string" && [t.name](http://t.name).startsWith("public_"),

                );

            } else if (messageCount < 5) {

                filteredTools = [request.tools](http://request.tools).filter(

                    (t: any) => typeof [t.name](http://t.name) === "string" && [t.name](http://t.name) !== "advanced_search",

                );

            }

            return handler({ ...request, tools: filteredTools });

        },

    });

    const agent = await createDeepAgent({

        model: "claude-sonnet-4-20250514",

        tools: tools,

        middleware: [stateBasedTools] as any,

    });

    ```

  </Tab>

  <Tab title="Store">

    Filter tools based on user preferences or feature flags in Store:

    ```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

    import { createMiddleware } from "langchain";

    import { createDeepAgent, StoreBackend } from "deepagents";

    import * as z from "zod";

    import { InMemoryStore } from "@langchain/langgraph";

    const contextSchema = z.object({

      userId: z.string(),

    });

    const storeBasedTools = createMiddleware({

      name: "StoreBasedTools",

      contextSchema,

      wrapModelCall: async (request, handler) => {

        const userId =

          (request.runtime?.context as { userId?: string } | undefined)?.userId ??

            "user-123";

        // Read from Store: get user's enabled features

        const runtimeStore = request.runtime?.store as InMemoryStore | undefined;

        const rawFlags = (await runtimeStore?.get(

          ["features"],

          userId as string,

        )) as unknown;

        const featureFlags = rawFlags as FeatureFlags | undefined;

        let filteredTools = [request.tools](http://request.tools);

        if (featureFlags) {

          const enabledFeatures = featureFlags.enabledTools || [];

          filteredTools = [request.tools](http://request.tools).filter((t) =>

            enabledFeatures.includes([t.name](http://t.name) as string)

          );

        }

        return handler({ ...request, tools: filteredTools });

      },

    });

    const agent = await createDeepAgent({

      model: "claude-sonnet-4-20250514",

      backend: new StoreBackend(),

      store,

      checkpointer,

      tools,

      middleware: [storeBasedTools] as any,

    });

    ```

  </Tab>

  <Tab title="Runtime Context">

    Filter tools based on user permissions from Runtime Context:

    ```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

    import * as z from "zod";

    import { createMiddleware } from "langchain";

    import { createDeepAgent } from "deepagents";

    const contextSchema = z.object({

      userRole: z.string(),

    });

    const contextBasedTools = createMiddleware({

      name: "ContextBasedTools",

      contextSchema,

      wrapModelCall: (request, handler) => {

        // Read from Runtime Context: get user role

        const userRole = request.runtime.context.userRole;

        let filteredTools = [request.tools](http://request.tools);

        if (userRole === "admin") {

          // Admins get all tools

        } else if (userRole === "editor") {

          filteredTools = [request.tools](http://request.tools).filter((t) => [t.name](http://t.name) !== "delete_data");

        } else {

          filteredTools = [request.tools](http://request.tools).filter(

            (t) => ([t.name](http://t.name) as string).startsWith("read_"),

          );

        }

        return handler({ ...request, tools: filteredTools });

      },

    });

    const agent = await createDeepAgent({

      model: "claude-sonnet-4-20250514",

      store,

      checkpointer,

      tools,

      middleware: [contextBasedTools] as any,

    });

    ```

  </Tab>

</Tabs>

This approach is best when:

* All possible tools are known at compile/startup time

* You want to filter based on permissions, feature flags, or conversation state

* Tools are static but their availability is dynamic

See [Dynamically selecting tools](/oss/javascript/langchain/middleware/custom#dynamically-selecting-tools) for more examples.
```

```
When tools are discovered or created at runtime (e.g., loaded from an MCP server, generated based on user data, or fetched from a remote registry), you need to both register the tools and handle their execution dynamically.

This requires two middleware hooks:

1. `wrap_model_call` - Add the dynamic tools to the request

2. `wrap_tool_call` - Handle execution of the dynamically added tools

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, createMiddleware, tool } from "langchain";

import * as z from "zod";

// A tool that will be added dynamically at runtime

const calculateTip = tool(

  ({ billAmount, tipPercentage = 20 }) => {

    const tip = billAmount * (tipPercentage / 100);

    return `Tip: $${tip.toFixed(2)}, Total: $${(billAmount + tip).toFixed(2)}`;

  },

  {

    name: "calculate_tip",

    description: "Calculate the tip amount for a bill",

    schema: z.object({

      billAmount: z.number().describe("The bill amount"),

      tipPercentage: z.number().default(20).describe("Tip percentage"),

    }),

  }

);

const dynamicToolMiddleware = createMiddleware({

  name: "DynamicToolMiddleware",

  wrapModelCall: (request, handler) => {

    // Add dynamic tool to the request

    // This could be loaded from an MCP server, database, etc.

    return handler({

      ...request,

      tools: [...[request.tools](http://request.tools), calculateTip],

    });

  },

  wrapToolCall: (request, handler) => {

    // Handle execution of the dynamic tool

    if ([request.toolCall.name](http://request.toolCall.name) === "calculate_tip") {

      return handler({ ...request, tool: calculateTip });

    }

    return handler(request);

  },

});

const agent = createAgent({

  model: "gpt-4o",

  tools: [getWeather], // Only static tools registered here

  middleware: [dynamicToolMiddleware],

});

// The agent can now use both getWeather AND calculateTip

const result = await agent.invoke({

  messages: [{ role: "user", content: "Calculate a 20% tip on $85" }],

});

```

This approach is best when:

- Tools are discovered at runtime (e.g., from an MCP server)
- Tools are generated dynamically based on user data or configuration
- You're integrating with external tool registries



  The `wrap_tool_call` hook is required for runtime-registered tools because the agent needs to know how to execute tools that weren't in the original tool list. Without it, the agent won't know how to invoke the dynamically added tool.

```

  To learn more about tools, see [Tools](/oss/javascript/langchain/tools).

#### Tool error handling

To customize how tool errors are handled, use the `wrapToolCall` hook in a custom middleware:

```ts wrap theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, createMiddleware, ToolMessage } from "langchain";

const handleToolErrors = createMiddleware({

  name: "HandleToolErrors",

  wrapToolCall: async (request, handler) => {

    try {

      return await handler(request);

    } catch (error) {

      // Return a custom error message to the model

      return new ToolMessage({

        content: `Tool error: Please check your input and try again. (${error})`,

        tool_call_id: [request.toolCall.id](http://request.toolCall.id)!,

      });

    }

  },

});

const agent = createAgent({

  model: "gpt-5.4",

  tools: [

    /* ... */

  ],

  middleware: [handleToolErrors],

});

```

The agent will return a `ToolMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/ToolMessage](https://reference.langchain.com/javascript/langchain-core/messages/ToolMessage)) with the custom error message when a tool fails.

#### Tool use in the ReAct loop

Agents follow the ReAct ("Reasoning + Acting") pattern, alternating between brief reasoning steps with targeted tool calls and feeding the resulting observations into subsequent decisions until they can deliver a final answer.

  **Prompt:** Identify the current most popular wireless headphones and verify availability.

- **Reasoning**: "Popularity is time-sensitive, I need to use the provided search tool."
- **Acting**: Call `search_products("wireless headphones")`
- **Reasoning**: "I need to confirm availability for the top-ranked item before answering."
- **Acting**: Call `check_inventory("WH-1000XM5")`
- **Reasoning**: "I have the most popular model and its stock status. I can now answer the user's question."
- **Acting**: Produce final answer

### System prompt

You can shape how your agent approaches tasks by providing a prompt. The `systemPrompt` parameter can be provided as a string:

```ts wrap theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const agent = createAgent({

  model,

  tools,

  systemPrompt: "You are a helpful assistant. Be concise and accurate.",

});

```

When no `systemPrompt` is provided, the agent will infer its task from the messages directly.

The `systemPrompt` parameter accepts either a `string` or a `SystemMessage`. Using a `SystemMessage` gives you more control over the prompt structure, which is useful for provider-specific features like [Anthropic's prompt caching](/oss/javascript/integrations/chat/anthropic#prompt-caching):

```ts wrap theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent } from "langchain";

import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const literaryAgent = createAgent({

  model: "google_genai:gemini-3.1-pro-preview",

  systemPrompt: new SystemMessage({

    content: [

      {

        type: "text",

        text: "You are an AI assistant tasked with analyzing literary works.",

      },

      {

        type: "text",

        text: "<the entire contents of 'Pride and Prejudice'>",

        cache_control: { type: "ephemeral" }

      }

    ]

  })

});

const result = await literaryAgent.invoke({

  messages: [new HumanMessage("Analyze the major themes in 'Pride and Prejudice'.")]

});

```

The `cache_control` field with `{ type: "ephemeral" }` tells Anthropic to cache that content block, reducing latency and costs for repeated requests that use the same system prompt.

#### Dynamic system prompt

For more advanced use cases where you need to modify the system prompt based on runtime context or agent state, you can use [middleware](/oss/javascript/langchain/middleware).

```typescript wrap theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import * as z from "zod";

import { createAgent, dynamicSystemPromptMiddleware } from "langchain";

const contextSchema = z.object({

  userRole: z.enum(["expert", "beginner"]),

});

const agent = createAgent({

  model: "gpt-5.4",

  tools: [/* ... */],

  contextSchema,

  middleware: [

    dynamicSystemPromptMiddleware<z.infer<typeof contextSchema>>((state, runtime) => {

      const userRole = runtime.context.userRole || "user";

      const basePrompt = "You are a helpful assistant.";

      if (userRole === "expert") {

        return `${basePrompt} Provide detailed technical responses.`;

      } else if (userRole === "beginner") {

        return `${basePrompt} Explain concepts simply and avoid jargon.`;

      }

      return basePrompt;

    }),

  ],

});

// The system prompt will be set dynamically based on context

const result = await agent.invoke(

  { messages: [{ role: "user", content: "Explain machine learning" }] },

  { context: { userRole: "expert" } }

);

```

  For more details on message types and formatting, see [Messages](/oss/javascript/langchain/messages). For comprehensive middleware documentation, see [Middleware](/oss/javascript/langchain/middleware).

### Name

Set an optional `name` for the agent. This is used as the node identifier when adding the agent as a subgraph in [multi-agent systems](/oss/javascript/langchain/multi-agent):

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const agent = createAgent({

  model,

  tools,

  name: "research_assistant",

});

```

  Prefer `snake_case` for agent names (e.g., `research_assistant` instead of `Research Assistant`). Some model providers reject names containing spaces or special characters with errors. Using alphanumeric characters, underscores, and hyphens only ensures compatibility across all providers. The same applies to [tool names](/oss/javascript/langchain/tools).

## Invocation

You can invoke an agent by passing an update to its `State`](/oss/javascript/langgraph/graph-api#state). All agents include a [sequence of messages](/oss/javascript/langgraph/use-graph-api#messagesvalue) in their state; to invoke the agent, pass a new message:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

await agent.invoke({

  messages: [{ role: "user", content: "What's the weather in San Francisco?" }],

})

```

For streaming steps and / or tokens from the agent, refer to the [streaming](/oss/javascript/langchain/streaming) guide.

Otherwise, the agent follows the LangGraph [Graph API](/oss/javascript/langgraph/use-graph-api) and supports all associated methods, such as `stream` and `invoke`.

  Use [LangSmith](/langsmith/home) to trace, debug, and evaluate your agents.

## Advanced concepts

### Structured output

In some situations, you may want the agent to return an output in a specific format. LangChain provides a simple, universal way to do this with the `responseFormat` parameter.

```ts wrap theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import * as z from "zod";

import { createAgent } from "langchain";

const ContactInfo = z.object({

  name: z.string(),

  email: z.string(),

  phone: z.string(),

});

const agent = createAgent({

  model: "gpt-5.4",

  responseFormat: ContactInfo,

});

const result = await agent.invoke({

  messages: [

    {

      role: "user",

      content: "Extract contact info from: John Doe, [john@example.com](mailto:john@example.com), (555) 123-4567",

    },

  ],

});

console.log(result.structuredResponse);

// {

//   name: 'John Doe',

//   email: '[john@example.com](mailto:john@example.com)',

//   phone: '(555) 123-4567'

// }

```

  To learn about structured output, see [Structured output](/oss/javascript/langchain/structured-output).

### Memory

Agents maintain conversation history automatically through the message state. You can also configure the agent to use a custom state schema to remember additional information during the conversation.

Information stored in the state can be thought of as the [short-term memory](/oss/javascript/langchain/short-term-memory) of the agent:

```ts wrap theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { z } from "zod/v4";

import { StateSchema, MessagesValue } from "@langchain/langgraph";

import { createAgent } from "langchain";

const CustomAgentState = new StateSchema({

  messages: MessagesValue,

  userPreferences: z.record(z.string(), z.string()),

});

const customAgent = createAgent({

  model: "gpt-5.4",

  tools: [],

  stateSchema: CustomAgentState,

});

```

  To learn more about memory, see [Memory](/oss/javascript/concepts/memory). For information on implementing long-term memory that persists across sessions, see [Long-term memory](/oss/javascript/langchain/long-term-memory).

### Streaming

We've seen how the agent can be called with `invoke` to get a final response. If the agent executes multiple steps, this may take a while. To show intermediate progress, we can stream back messages as they occur.

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const stream = await [agent.stream](http://agent.stream)(

  {

    messages: [{

      role: "user",

      content: "Search for AI news and summarize the findings"

    }],

  },

  { streamMode: "values" }

);

for await (const chunk of stream) {

  // Each chunk contains the full state at that point

  const latestMessage = [chunk.messages.at](http://chunk.messages.at)(-1);

  if (latestMessage?.content) {

    console.log`Agent: ${latestMessage.content}`);

  } else if (latestMessage?.tool_calls) {

    const toolCallNames = latestMessage.tool_[calls.map](http://calls.map)((tc) => [tc.name](http://tc.name));

    console.log`Calling tools: ${toolCallNames.join(", ")}`);

  }

}

```

  For more details on streaming, see [Streaming](/oss/javascript/langchain/streaming).

### Middleware

[Middleware](/oss/javascript/langchain/middleware) provides powerful extensibility for customizing agent behavior at different stages of execution. You can use middleware to:

- Process state before the model is called (e.g., message trimming, context injection)
- Modify or validate the model's response (e.g., guardrails, content filtering)
- Handle tool execution errors with custom logic
- Implement dynamic model selection based on state or context
- Add custom logging, monitoring, or analytics

Middleware integrates seamlessly into the agent's execution, allowing you to intercept and modify data flow at key points without changing the core agent logic.

  For comprehensive middleware documentation including hooks like `beforeModel`, `afterModel`, and `wrapToolCall`, see [Middleware](/oss/javascript/langchain/middleware).

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/agents.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/agents.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Models

[LLMs]([https://en.wikipedia.org/wiki/Large_language_model](https://en.wikipedia.org/wiki/Large_language_model)) are powerful AI tools that can interpret and generate text like humans. They're versatile enough to write content, translate languages, summarize, and answer questions without needing specialized training for each task.

In addition to text generation, many models support:

- [Tool calling](#tool-calling) - calling external tools (like databases queries or API calls) and use results in their responses.
- [Structured output](#structured-output) - where the model's response is constrained to follow a defined format.
- [Multimodality](#multimodal) - process and return data other than text, such as images, audio, and video.
- [Reasoning](#reasoning) - models perform multi-step reasoning to arrive at a conclusion.

Models are the reasoning engine of [agents](/oss/javascript/langchain/agents). They drive the agent's decision-making process, determining which tools to call, how to interpret results, and when to provide a final answer.

The quality and capabilities of the model you choose directly impact your agent's baseline reliability and performance. Different models excel at different tasks - some are better at following complex instructions, others at structured reasoning, and some support larger context windows for handling more information.

LangChain's standard model interfaces give you access to many different provider integrations, which makes it easy to experiment with and switch between models to find the best fit for your use case.

  For provider-specific integration information and capabilities, see the provider's [chat model page](/oss/javascript/integrations/chat).

## Basic usage

Models can be utilized in two ways:

1. **With agents** - Models can be dynamically specified when creating an [agent](/oss/javascript/langchain/agents#model).
2. **Standalone** - Models can be called directly (outside of the agent loop) for tasks like text generation, classification, or extraction without the need for an agent framework.

The same model interface works in both contexts, which gives you the flexibility to start simple and scale up to more complex agent-based workflows as needed.

### Initialize a model

The easiest way to get started with a standalone model in LangChain is to use `initChatModel` to initialize one from a [chat model provider](/oss/javascript/integrations/chat) of your choice (examples below):

```
👉 Read the [OpenAI chat model integration docs](/oss/javascript/integrations/chat/openai/)

<CodeGroup>

  ```bash npm theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  npm install @langchain/openai

```





```

```
👉 Read the [Anthropic chat model integration docs](/oss/javascript/integrations/chat/anthropic/)

<CodeGroup>

  ```bash npm theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  npm install @langchain/anthropic

```





```

```
👉 Read the [Azure chat model integration docs](/oss/javascript/integrations/chat/azure/)

<CodeGroup>

  ```bash npm theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  npm install @langchain/azure

```





```

```
👉 Read the [Google GenAI chat model integration docs](/oss/javascript/integrations/chat/google_generative_ai/)

<CodeGroup>

  ```bash npm theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  npm install @langchain/google-genai

```





```

```
👉 Read the [AWS Bedrock chat model integration docs](/oss/javascript/integrations/chat/bedrock_converse/)

<CodeGroup>

  ```bash npm theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

  npm install @langchain/aws

```





```

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const response = await model.invoke("Why do parrots talk?");

```

See `initChatModel`]([https://reference.langchain.com/javascript/langchain/chat_models/universal/initChatModel](https://reference.langchain.com/javascript/langchain/chat_models/universal/initChatModel)) for more detail, including information on how to pass model [parameters](#parameters).

### Supported providers and models

LangChain supports all major model providers through dedicated integration packages. Each provider package implements the same standard interface, so you can swap providers without rewriting application logic. New model names work immediately — no LangChain update required — because provider packages pass model names directly to the provider's API.

Browse the [full list of supported providers](/oss/javascript/integrations/providers/overview), or see [Providers and models](/oss/javascript/concepts/providers-and-models) for a conceptual overview of how providers, packages, and model names work together in LangChain.

### Key methods

  The model takes messages as input and outputs messages after generating a complete response.

  Invoke the model, but stream the output as it is generated in real-time.

  Send multiple requests to a model in a batch for more efficient processing.

  In addition to chat models, LangChain provides support for other adjacent technologies, such as embedding models and vector stores. See the [integrations page](/oss/javascript/integrations/providers/overview) for details.

## Parameters

A chat model takes parameters that can be used to configure its behavior. The full set of supported parameters varies by model and provider, but standard ones include:

  The name or identifier of the specific model you want to use with a provider. You can also specify both the model and its provider in a single argument using the '{model_provider}:{model}' format, for example, 'openai:o1'.

  The key required for authenticating with the model's provider. This is usually issued when you sign up for access to the model. Often accessed by setting an environment variable.

  Controls the randomness of the model's output. A higher number makes responses more creative; lower ones make them more deterministic.

  Limits the total number of tokens in the response, effectively controlling how long the output can be.

  The maximum time (in seconds) to wait for a response from the model before canceling the request.

  The maximum number of attempts the system will make to resend a request if it fails due to issues like network timeouts or rate limits. Retries use exponential backoff with jitter. Network errors, rate limits (429), and server errors (5xx) are retried automatically. Client errors such as 401 (unauthorized) or 404 are not retried. For long-running [agent](/oss/javascript/deepagents/overview) tasks on unreliable networks, consider increasing this to 10–15.

Using `initChatModel`, pass these parameters as inline parameters:

```typescript Initialize using model parameters theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const model = await initChatModel(

    "claude-sonnet-4-6",

    { temperature: 0.7, timeout: 30, maxTokens: 1000, maxRetries: 6 }

)

```

  Each chat model integration may have additional params used to control provider-specific functionality.

  For example, `ChatOpenAI`]([https://reference.langchain.com/javascript/langchain-openai/ChatOpenAI](https://reference.langchain.com/javascript/langchain-openai/ChatOpenAI)) has `use_responses_api` to dictate whether to use the OpenAI Responses or Completions API.

  To find all the parameters supported by a given chat model, head to the [chat model integrations](/oss/javascript/integrations/chat) page.

---

## Invocation

A chat model must be invoked to generate an output. There are three primary invocation methods, each suited to different use cases.

### Invoke

The most straightforward way to call a model is to use `invoke()`]([https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#invoke](https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#invoke)) with a single message or a list of messages.

```typescript Single message theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const response = await model.invoke("Why do parrots have colorful feathers?");

console.log(response);

```

A list of messages can be provided to a chat model to represent conversation history. Each message has a role that models use to indicate who sent the message in the conversation.

See the [messages](/oss/javascript/langchain/messages) guide for more detail on roles, types, and content.

```typescript Object format theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const conversation = [

  { role: "system", content: "You are a helpful assistant that translates English to French." },

  { role: "user", content: "Translate: I love programming." },

  { role: "assistant", content: "J'adore la programmation." },

  { role: "user", content: "Translate: I love building applications." },

];

const response = await model.invoke(conversation);

console.log(response);  // AIMessage("J'adore créer des applications.")

```

```typescript Message objects theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { HumanMessage, AIMessage, SystemMessage } from "langchain";

const conversation = [

  new SystemMessage("You are a helpful assistant that translates English to French."),

  new HumanMessage("Translate: I love programming."),

  new AIMessage("J'adore la programmation."),

  new HumanMessage("Translate: I love building applications."),

];

const response = await model.invoke(conversation);

console.log(response);  // AIMessage("J'adore créer des applications.")

```

  If the return type of your invocation is a string, ensure that you are using a chat model as opposed to a LLM. Legacy, text-completion LLMs return strings directly. LangChain chat models are prefixed with "Chat", e.g., `ChatOpenAI`]([https://reference.langchain.com/javascript/langchain-openai/ChatOpenAI)(/oss/integrations/chat/openai)](https://reference.langchain.com/javascript/langchain-openai/ChatOpenAI)(/oss/integrations/chat/openai)).

### Stream

Most models can stream their output content while it is being generated. By displaying output progressively, streaming significantly improves user experience, particularly for longer responses.

Calling `stream()`]([https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#stream](https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#stream)) returns an iterator that yields output chunks as they are produced. You can use a loop to process each chunk in real-time:

As opposed to `invoke()`](#invoke), which returns a single `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)) after the model has finished generating its full response, `stream()` returns multiple `AIMessageChunk`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessageChunk](https://reference.langchain.com/javascript/langchain-core/messages/AIMessageChunk)) objects, each containing a portion of the output text. Importantly, each chunk in a stream is designed to be gathered into a full message via summation:

```typescript Construct AIMessage theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

let full: AIMessageChunk | null = null;

for await (const chunk of stream) {

  full = full ? full.concat(chunk) : chunk;

  console.log(full.text);

}

// The

// The sky

// The sky is

// The sky is typically

// The sky is typically blue

// ...

console.log(full.contentBlocks);

// [{"type": "text", "text": "The sky is typically blue..."}]

```

The resulting message can be treated the same as a message that was generated with `invoke()`](#invoke)—for example, it can be aggregated into a message history and passed back to the model as conversational context.

  Streaming only works if all steps in the program know how to process a stream of chunks. For instance, an application that isn't streaming-capable would be one that needs to store the entire output in memory before it can be processed.

```
LangChain chat models can also stream semantic events using

\`streamEvents()`]\[BaseChatModel.streamEvents].

This simplifies filtering based on event types and other metadata, and will aggregate the full message in the background. See below for an example.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const stream = await model.streamEvents("Hello");

for await (const event of stream) {

    if (event.event === "on_chat_model_start") {

        console.log`Input: ${event.data.input}`);

    }

    if (event.event === "on_chat_model_stream") {

        console.log`Token: ${event.data.chunk.text}`);

    }

    if (event.event === "on_chat_model_end") {

        console.log`Full message: ${event.data.output.text}`);

    }

}

```

```txt theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

Input: Hello

Token: Hi

Token:  there

Token: !

Token:  How

Token:  can

Token:  I

...

Full message: Hi there! How can I help today?

```

See the `streamEvents()`]([https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#streamEvents](https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#streamEvents)) reference for event types and other details.

```



  <Accordion title=""Auto-streaming" chat models">

```

LangChain simplifies streaming from chat models by automatically enabling streaming mode in certain cases, even when you're not explicitly calling the streaming methods. This is particularly useful when you use the non-streaming invoke method but still want to stream the entire application, including intermediate results from the chat model.

In [LangGraph agents](/oss/javascript/langchain/agents), for example, you can call `model.invoke()` within nodes, but LangChain will automatically delegate to streaming if running in a streaming mode.

#### How it works

When you `invoke()` a chat model, LangChain will automatically switch to an internal streaming mode if it detects that you are trying to stream the overall application. The result of the invocation will be the same as far as the code that was using invoke is concerned; however, while the chat model is being streamed, LangChain will take care of invoking `on_llm_new_token`]([https://reference.langchain.com/javascript/interfaces/_langchain_core.callbacks_base.BaseCallbackHandlerMethods.html#onLlmNewToken](https://reference.langchain.com/javascript/interfaces/_langchain_core.callbacks_base.BaseCallbackHandlerMethods.html#onLlmNewToken)) events in LangChain's callback system.

Callback events allow LangGraph `stream()` and `streamEvents()` to surface the chat model's output in real-time.

```





### Batch

Batching a collection of independent requests to a model can significantly improve performance and reduce costs, as the processing can be done in parallel:

```typescript Batch theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const responses = await model.batch([

  "Why do parrots have colorful feathers?",

  "How do airplanes fly?",

  "What is quantum computing?",

  "Why do parrots have colorful feathers?",

  "How do airplanes fly?",

  "What is quantum computing?",

]);

for (const response of responses) {

  console.log(response);

}

```

  When processing a large number of inputs using `batch()`, you may want to control the maximum number of parallel calls. This can be done by setting the `maxConcurrency` attribute in the `RunnableConfig`]([https://reference.langchain.com/javascript/langchain-core/runnables/RunnableConfig](https://reference.langchain.com/javascript/langchain-core/runnables/RunnableConfig)) dictionary.

  See the `RunnableConfig`]([https://reference.langchain.com/javascript/langchain-core/runnables/RunnableConfig](https://reference.langchain.com/javascript/langchain-core/runnables/RunnableConfig)) reference for a full list of supported attributes.

For more details on batching, see the [reference]([https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#batch](https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#batch)).

---

## Tool calling

Models can request to call tools that perform tasks such as fetching data from a database, searching the web, or running code. Tools are pairings of:

1. A schema, including the name of the tool, a description, and/or argument definitions (often a JSON schema)
2. A function or coroutine to execute.
  You may hear the term "function calling". We use this interchangeably with "tool calling".

Here's the basic tool calling flow between a user and a model:

```mermaid theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

sequenceDiagram

    participant U as User

    participant M as Model

    participant T as Tools

    U->>M: "What's the weather in SF and NYC?"

    M->>M: Analyze request & decide tools needed

    par Parallel Tool Calls

        M->>T: getWeather("San Francisco")

        M->>T: getWeather("New York")

    end

    par Tool Execution

        T-->>M: SF weather data

        T-->>M: NYC weather data

    end

    M->>M: Process results & generate response

    M->>U: "SF: 72°F sunny, NYC: 68°F cloudy"

```

To make tools that you have defined available for use by a model, you must bind them using `bindTools`]([https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#bindTools](https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#bindTools)). In subsequent invocations, the model can choose to call any of the bound tools as needed.

Some model providers offer built-in tools that can be enabled via model or invocation parameters (e.g. `ChatOpenAI`](/oss/javascript/integrations/chat/openai), `ChatAnthropic`](/oss/javascript/integrations/chat/anthropic)). Check the respective [provider reference](/oss/javascript/integrations/providers/overview) for details.

  See the [tools guide](/oss/javascript/langchain/tools) for details and other options for creating tools.

```typescript Binding user tools theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { tool } from "langchain";

import * as z from "zod";

import { ChatOpenAI } from "@langchain/openai";

const getWeather = tool(

  (input) => `It's sunny in ${input.location}.`,

  {

    name: "get_weather",

    description: "Get the weather at a location.",

    schema: z.object({

      location: z.string().describe("The location to get the weather for"),

    }),

  },

);

const model = new ChatOpenAI({ model: "gpt-5.4" });

const modelWithTools = model.bindTools([getWeather]);  // [!code highlight]

const response = await modelWithTools.invoke("What's the weather like in Boston?");

const toolCalls = response.tool_calls || [];

for (const tool_call of toolCalls) {

  // View tool calls made by the model

  console.log`Tool: ${tool_call.name}`);

  console.log`Args: ${tool_call.args}`);

}

```

When binding user-defined tools, the model's response includes a **request** to execute a tool. When using a model separately from an [agent](/oss/javascript/langchain/agents), it is up to you to execute the requested tool and return the result back to the model for use in subsequent reasoning. When using an [agent](/oss/javascript/langchain/agents), the agent loop will handle the tool execution loop for you.

Below, we show some common ways you can use tool calling.

```
When a model returns tool calls, you need to execute the tools and pass the results back to the model. This creates a conversation loop where the model can use tool results to generate its final response. LangChain includes [agent](/oss/javascript/langchain/agents) abstractions that handle this orchestration for you.

Here's a simple example of how to do this:

```typescript Tool execution loop theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

// Bind (potentially multiple) tools to the model

const modelWithTools = model.bindTools([get_weather])

// Step 1: Model generates tool calls

const messages = [{"role": "user", "content": "What's the weather in Boston?"}]

const ai_msg = await modelWithTools.invoke(messages)

messages.push(ai_msg)

// Step 2: Execute tools and collect results

for (const tool_call of ai_msg.tool_calls) {

    // Execute the tool with the generated arguments

    const tool_result = await get_weather.invoke(tool_call)

    messages.push(tool_result)

}

// Step 3: Pass results back to model for final response

const final_response = await modelWithTools.invoke(messages)

console.log(final_response.text)

// "The current weather in Boston is 72°F and sunny."

```

Each `ToolMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/ToolMessage](https://reference.langchain.com/javascript/langchain-core/messages/ToolMessage)) returned by the tool includes a `tool_call_id` that matches the original tool call, helping the model correlate results with requests.

```





```

By default, the model has the freedom to choose which bound tool to use based on the user's input. However, you might want to force choosing a tool, ensuring the model uses either a particular tool or **any** tool from a given list:



```

```
Many models support calling multiple tools in parallel when appropriate. This allows the model to gather information from different sources simultaneously.

```typescript Parallel tool calls theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const modelWithTools = model.bind_tools([get_weather])

const response = await modelWithTools.invoke(

    "What's the weather in Boston and Tokyo?"

)

// The model may generate multiple tool calls

console.log(response.tool_calls)

// [

//   { name: 'get_weather', args: { location: 'Boston' }, id: 'call_1' },

//   { name: 'get_time', args: { location: 'Tokyo' }, id: 'call_2' }

// ]

// Execute all tools (can be done in parallel with async)

const results = []

for (const tool_call of response.tool_calls || []) {

    if (tool_[call.name](http://call.name) === 'get_weather') {

        const result = await get_weather.invoke(tool_call)

        results.push(result)

    }

}

```

The model intelligently determines when parallel execution is appropriate based on the independence of the requested operations.



  Most models supporting tool calling enable parallel tool calls by default. Some (including [OpenAI](/oss/javascript/integrations/chat/openai) and [Anthropic](/oss/javascript/integrations/chat/anthropic)) allow you to disable this feature. To do this, set `parallel_tool_calls=False`:

```

```
When streaming responses, tool calls are progressively built through `ToolCallChunk`]([https://reference.langchain.com/javascript/langchain-core/messages/ContentBlock/Tools/ToolCallChunk](https://reference.langchain.com/javascript/langchain-core/messages/ContentBlock/Tools/ToolCallChunk)). This allows you to see tool calls as they're being generated rather than waiting for the complete response.

```typescript Streaming tool calls theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const stream = await [modelWithTools.stream](http://modelWithTools.stream)(

    "What's the weather in Boston and Tokyo?"

)

for await (const chunk of stream) {

    // Tool call chunks arrive progressively

    if (chunk.tool_call_chunks) {

        for (const tool_chunk of chunk.tool_call_chunks) {

        console.log`Tool: ${tool_chunk.get('name', '')}`)

        console.log`Args: ${tool_chunk.get('args', '')}`)

        }

    }

}

// Output:

// Tool: get_weather

// Args:

// Tool:

// Args: {"loc

// Tool:

// Args: ation": "BOS"}

// Tool: get_time

// Args:

// Tool:

// Args: {"timezone": "Tokyo"}

```

You can accumulate chunks to build complete tool calls:

```typescript Accumulate tool calls theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

let full: AIMessageChunk | null = null

const stream = await [modelWithTools.stream](http://modelWithTools.stream)("What's the weather in Boston?")

for await (const chunk of stream) {

    full = full ? full.concat(chunk) : chunk

    console.log(full.contentBlocks)

}

```

```





---

## Structured output

Models can be requested to provide their response in a format matching a given schema. This is useful for ensuring the output can be easily parsed and used in subsequent processing. LangChain supports multiple schema types and methods for enforcing structured output.



  To learn about structured output, see [Structured output](/oss/javascript/langchain/structured-output).







```

A [zod schema]([https://zod.dev/](https://zod.dev/)) is the preferred method of defining an output schema. Note that when a zod schema is provided, the model output will also be validated against the schema using zod's parse methods.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import * as z from "zod";

const Movie = z.object({

  title: z.string().describe("The title of the movie"),

  year: z.number().describe("The year the movie was released"),

  director: z.string().describe("The director of the movie"),

  rating: z.number().describe("The movie's rating out of 10"),

});

const modelWithStructure = model.withStructuredOutput(Movie);

const response = await modelWithStructure.invoke("Provide details about the movie Inception");

console.log(response);

// {

//   title: "Inception",

//   year: 2010,

//   director: "Christopher Nolan",

//   rating: 8.8,

// }

```

```





```

For maximum control or interoperability, you can provide a raw JSON Schema.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const jsonSchema = {

  "title": "Movie",

  "description": "A movie with details",

  "type": "object",

  "properties": {

    "title": {

      "type": "string",

      "description": "The title of the movie",

    },

    "year": {

      "type": "integer",

      "description": "The year the movie was released",

    },

    "director": {

      "type": "string",

      "description": "The director of the movie",

    },

    "rating": {

      "type": "number",

      "description": "The movie's rating out of 10",

    },

  },

  "required": ["title", "year", "director", "rating"],

}

const modelWithStructure = model.withStructuredOutput(

  jsonSchema,

  { method: "jsonSchema" },

)

const response = await modelWithStructure.invoke("Provide details about the movie Inception")

console.log(response)  // {'title': 'Inception', 'year': 2010, ...}

```

```





```

Any schema from a library implementing the [Standard Schema]([https://standardschema.dev/](https://standardschema.dev/)) specification is also supported. Standard Schema objects are validated at runtime via the schema's `~standard.validate()` method.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import * as v from "valibot";

import { toStandardJsonSchema } from "@valibot/to-json-schema";

const Movie = toStandardJsonSchema(

  v.object({

    title: v.pipe(v.string(), v.description("The title of the movie")),

    year: v.pipe(v.number(), v.description("The year the movie was released")),

    director: v.pipe(v.string(), v.description("The director of the movie")),

    rating: v.pipe(v.number(), v.description("The movie's rating out of 10")),

  })

);

const modelWithStructure = model.withStructuredOutput(Movie);

const response = await modelWithStructure.invoke("Provide details about the movie Inception");

console.log(response);

// {

//   title: "Inception",

//   year: 2010,

//   director: "Christopher Nolan",

//   rating: 8.8,

// }

```

```







  **Key considerations for structured output:**

- **Method parameter**: Some providers support different methods `'jsonSchema'`, `'functionCalling'`, `'jsonMode'`)
- **Include raw**: Use `includeRaw: true`]([https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#withStructuredOutput](https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#withStructuredOutput)) to get both the parsed output and the raw `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage))
- **Validation**: Zod and Standard Schema objects provide automatic validation, while JSON Schema requires manual validation
- **Standard Schema**: Any schema library implementing the [Standard Schema]([https://standardschema.dev/](https://standardschema.dev/)) spec is supported and validated at runtime

  See your [provider's integration page](/oss/javascript/integrations/providers/overview) for supported methods and configuration options.





  It can be useful to return the raw `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)) object alongside the parsed representation to access response metadata such as [token counts](#token-usage). To do this, set `include_raw=True`]([https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#withStructuredOutput](https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#withStructuredOutput)) when calling `with_structured_output`]([https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#withStructuredOutput](https://reference.langchain.com/javascript/classes/_langchain_core.language_models_chat_models.BaseChatModel.html#withStructuredOutput)):





  Schemas can be nested:



---

## Advanced topics

### Model profiles



  Model profiles require `langchain>=1.1`.



LangChain chat models can expose a dictionary of supported features and capabilities through a `profile` property:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

model.profile;

// {

//   maxInputTokens: 400000,

//   imageInputs: true,

//   reasoningOutput: true,

//   toolCalling: true,

//   ...

// }

```

Refer to the full set of fields in the [API reference]([https://reference.langchain.com/javascript/langchain-core/language_models/profile/ModelProfile](https://reference.langchain.com/javascript/langchain-core/language_models/profile/ModelProfile)).

Much of the model profile data is powered by the [models.dev]([https://github.com/sst/models.dev](https://github.com/sst/models.dev)) project, an open source initiative that provides model capability data. This data is augmented with additional fields for purposes of use with LangChain. These augmentations are kept aligned with the upstream project as it evolves.

Model profile data allow applications to work around model capabilities dynamically. For example:

1. [Summarization middleware](/oss/javascript/langchain/middleware/built-in#summarization) can trigger summarization based on a model's context window size.
2. [Structured output](/oss/javascript/langchain/structured-output) strategies in `createAgent` can be inferred automatically (e.g., by checking support for native structured output features).
3. Model inputs can be gated based on supported [modalities](#multimodal) and maximum input tokens.
4. The [Deep Agents CLI](/oss/javascript/deepagents/cli) filters the [interactive model switcher](/oss/javascript/deepagents/cli/providers#which-models-appear-in-the-switcher) to models whose profiles report `tool_calling` support and text I/O, and displays context window sizes and capability flags in the selector detail view.
  Model profile data can be changed if it is missing, stale, or incorrect.
  **Option 1 (quick fix)**
  You can instantiate a chat model with any valid profile:
  **Option 2 (fix data upstream)**
  The primary source for the data is the [models.dev]([https://models.dev/](https://models.dev/)) project. These data are merged with additional fields and overrides in LangChain [integration packages](/oss/javascript/integrations/providers/overview) and are shipped with those packages.
  Model profile data can be updated through the following process:
5. (If needed) update the source data at [models.dev]([https://models.dev/](https://models.dev/)) through a pull request to its [repository on GitHub]([https://github.com/sst/models.dev](https://github.com/sst/models.dev)).
6. (If needed) update additional fields and overrides in `langchain-<package>/profiles.toml` through a pull request to the LangChain [integration package](/oss/javascript/integrations/providers/overview).
  Model profiles are a beta feature. The format of a profile is subject to change.

### Multimodal

Certain models can process and return non-textual data such as images, audio, and video. You can pass non-textual data to a model by providing [content blocks](/oss/javascript/langchain/messages#message-content).

  All LangChain chat models with underlying multimodal capabilities support:

1. Data in the cross-provider standard format (see [our messages guide](/oss/javascript/langchain/messages))
2. OpenAI [chat completions]([https://platform.openai.com/docs/api-reference/chat](https://platform.openai.com/docs/api-reference/chat)) format
3. Any format that is native to that specific provider (e.g., Anthropic models accept Anthropic native format)

See the [multimodal section](/oss/javascript/langchain/messages#multimodal) of the messages guide for details.

Some]([https://models.dev/">Some](https://models.dev/">Some)) models can return multimodal data as part of their response. If invoked to do so, the resulting `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)) will have content blocks with multimodal types.

```typescript Multimodal output theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const response = await model.invoke("Create a picture of a cat");

console.log(response.contentBlocks);

// [

//   { type: "text", text: "Here's a picture of a cat" },

//   { type: "image", data: "...", mimeType: "image/jpeg" },

// ]

```

See the [integrations page](/oss/javascript/integrations/providers/overview) for details on specific providers.

### Reasoning

Many models are capable of performing multi-step reasoning to arrive at a conclusion. This involves breaking down complex problems into smaller, more manageable steps.

**If supported by the underlying model,** you can surface this reasoning process to better understand how the model arrived at its final answer.

Depending on the model, you can sometimes specify the level of effort it should put into reasoning. Similarly, you can request that the model turn off reasoning entirely. This may take the form of categorical "tiers" of reasoning (e.g., `'low'` or `'high'`) or integer token budgets.

For details, see the [integrations page](/oss/javascript/integrations/providers/overview) or [reference]([https://reference.langchain.com/python/integrations/](https://reference.langchain.com/python/integrations/)) for your respective chat model.

### Local models

LangChain supports running models locally on your own hardware. This is useful for scenarios where either data privacy is critical, you want to invoke a custom model, or when you want to avoid the costs incurred when using a cloud-based model.

[Ollama](/oss/javascript/integrations/chat/ollama) is one of the easiest ways to run chat and embedding models locally.

### Prompt caching

Many providers offer prompt caching features to reduce latency and cost on repeat processing of the same tokens. These features can be **implicit** or **explicit**:

- **Implicit prompt caching:** providers will automatically pass on cost savings if a request hits a cache. Examples: [OpenAI](/oss/javascript/integrations/chat/openai) and [Gemini](/oss/javascript/integrations/chat/google_generative_ai).
- **Explicit caching:** providers allow you to manually indicate cache points for greater control or to guarantee cost savings. Examples:
  - `ChatOpenAI`]([https://reference.langchain.com/javascript/langchain-openai/ChatOpenAI](https://reference.langchain.com/javascript/langchain-openai/ChatOpenAI)) (via `prompt_cache_key`)
  - Anthropic's `AnthropicPromptCachingMiddleware`](/oss/javascript/integrations/chat/anthropic#prompt-caching)
  - [Gemini]([https://reference.langchain.com/python/integrations/langchain_google_genai/](https://reference.langchain.com/python/integrations/langchain_google_genai/)).
  - [AWS Bedrock](/oss/javascript/integrations/chat/bedrock)
  Prompt caching is often only engaged above a minimum input token threshold. See [provider pages](/oss/javascript/integrations/chat) for details.

Cache usage will be reflected in the [usage metadata](/oss/javascript/langchain/messages#token-usage) of the model response.

### Server-side tool use

Some providers support server-side [tool-calling](#tool-calling) loops: models can interact with web search, code interpreters, and other tools and analyze the results in a single conversational turn.

If a model invokes a tool server-side, the content of the response message will include content representing the invocation and result of the tool. Accessing the [content blocks](/oss/javascript/langchain/messages#standard-content-blocks) of the response will return the server-side tool calls and results in a provider-agnostic format:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { initChatModel } from "langchain";

const model = await initChatModel("gpt-5.4-mini");

const modelWithTools = model.bindTools([{ type: "web_search" }])

const message = await modelWithTools.invoke("What was a positive news story from today?");

console.log(message.contentBlocks);

```

This represents a single conversational turn; there are no associated [ToolMessage](/oss/javascript/langchain/messages#tool-message) objects that need to be passed in as in client-side [tool-calling](#tool-calling).

See the [integration page](/oss/javascript/integrations/chat) for your given provider for available tools and usage details.

### Base URL and proxy settings

You can configure a custom base URL for providers that implement the OpenAI Chat Completions API.

  `model_provider="openai"` (or direct `ChatOpenAI` usage) targets the official OpenAI API specification. Provider-specific fields from routers and proxies may not be extracted or preserved.

  For OpenRouter and LiteLLM, prefer the dedicated integrations:

- [OpenRouter via `ChatOpenRouter](/oss/javascript/integrations/chat/openrouter)` `langchain-openrouter`)
- [LiteLLM via `ChatLiteLLM` / `ChatLiteLLMRouter](/oss/javascript/integrations/chat)` `langchain-litellm`)
  Many model providers offer OpenAI-compatible APIs (e.g., [Together AI]([https://www.together.ai/](https://www.together.ai/)), [vLLM]([https://github.com/vllm-project/vllm](https://github.com/vllm-project/vllm))). You can use `initChatModel` with these providers by specifying the appropriate `base_url` parameter:

```
When using direct chat model class instantiation, the parameter name may vary by provider. Check the respective [reference](/oss/javascript/integrations/providers/overview) for details.
```

### Log probabilities

Certain models can be configured to return token-level log probabilities representing the likelihood of a given token by setting the `logprobs` parameter when initializing the model:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const model = new ChatOpenAI({

    model: "gpt-5.4",

    logprobs: true,

});

const responseMessage = await model.invoke("Why do parrots talk?");

responseMessage.response_metadata.logprobs.content.slice(0, 5);

```

### Token usage

A number of model providers return token usage information as part of the invocation response. When available, this information will be included on the `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)) objects produced by the corresponding model. For more details, see the [messages](/oss/javascript/langchain/messages) guide.

### Invocation config

When invoking a model, you can pass additional configuration through the `config` parameter using a `RunnableConfig`]([https://reference.langchain.com/javascript/langchain-core/runnables/RunnableConfig](https://reference.langchain.com/javascript/langchain-core/runnables/RunnableConfig)) object. This provides run-time control over execution behavior, callbacks, and metadata tracking.

Common configuration options include:

```typescript Invocation with config theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const response = await model.invoke(

    "Tell me a joke",

    {

        runName: "joke_generation",      // Custom name for this run

        tags: ["humor", "demo"],          // Tags for categorization

        metadata: {"user_id": "123"},     // Custom metadata

        callbacks: [my_callback_handler], // Callback handlers

    }

)

```

These configuration values are particularly useful when:

- Debugging with [LangSmith](/langsmith/home) tracing
- Implementing custom logging or monitoring
- Controlling resource usage in production
- Tracking invocations across complex pipelines

```
Identifies this specific invocation in logs and traces. Not inherited by sub-calls.
```

```
Labels inherited by all sub-calls for filtering and organization in debugging tools.
```

```
Custom key-value pairs for tracking additional context, inherited by all sub-calls.
```

```
Controls the maximum number of parallel calls when using `batch()`.
```

```
Handlers for monitoring and responding to events during execution.
```

```
Maximum recursion depth for chains to prevent infinite loops in complex pipelines.
```

  See full `RunnableConfig`]([https://reference.langchain.com/javascript/langchain-core/runnables/RunnableConfig](https://reference.langchain.com/javascript/langchain-core/runnables/RunnableConfig)) reference for all supported attributes.

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/models.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/models.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Messages

Messages are the fundamental unit of context for models in LangChain. They represent the input and output of models, carrying both the content and metadata needed to represent the state of a conversation when interacting with an LLM.

Messages are objects that contain:

  *[*Role](#message-types)* - Identifies the message type (e.g. `system`, `user`)

  *[*Content](#message-content)* - Represents the actual content of the message (like text, images, audio, documents, etc.)

  *[*Metadata](#message-metadata)* - Optional fields such as response information, message IDs, and token usage

LangChain provides a standard message type that works across all model providers, ensuring consistent behavior regardless of the model being called.

## Basic usage

The simplest way to use messages is to create message objects and pass them to a model when [invoking](/oss/javascript/langchain/models#invocation).

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { initChatModel, HumanMessage, SystemMessage } from "langchain";

const model = await initChatModel("gpt-5-nano");

const systemMsg = new SystemMessage("You are a helpful assistant.");

const humanMsg = new HumanMessage("Hello, how are you?");

const messages = [systemMsg, humanMsg];

const response = await model.invoke(messages);  // Returns AIMessage

```

### Text prompts

Text prompts are strings - ideal for straightforward generation tasks where you don't need to retain conversation history.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const response = await model.invoke("Write a haiku about spring");

```

**Use text prompts when:**

- You have a single, standalone request
- You don't need conversation history
- You want minimal code complexity

### Message prompts

Alternatively, you can pass in a list of messages to the model by providing a list of message objects.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { SystemMessage, HumanMessage, AIMessage } from "langchain";

const messages = [

  new SystemMessage("You are a poetry expert"),

  new HumanMessage("Write a haiku about spring"),

  new AIMessage("Cherry blossoms bloom..."),

];

const response = await model.invoke(messages);

```

**Use message prompts when:**

- Managing multi-turn conversations
- Working with multimodal content (images, audio, files)
- Including system instructions

### Dictionary format

You can also specify messages directly in OpenAI chat completions format.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const messages = [

  { role: "system", content: "You are a poetry expert" },

  { role: "user", content: "Write a haiku about spring" },

  { role: "assistant", content: "Cherry blossoms bloom..." },

];

const response = await model.invoke(messages);

```

## Message types

- [System message](#system-message) - Tells the model how to behave and provide context for interactions
- [Human message](#human-message) - Represents user input and interactions with the model
- [AI message](#ai-message) - Responses generated by the model, including text content, tool calls, and metadata
- [Tool message](#tool-message) - Represents the outputs of [tool calls](/oss/javascript/langchain/models#tool-calling)

### System message

A `SystemMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/SystemMessage](https://reference.langchain.com/javascript/langchain-core/messages/SystemMessage)) represent an initial set of instructions that primes the model's behavior. You can use a system message to set the tone, define the model's role, and establish guidelines for responses.

```typescript Basic instructions theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { SystemMessage, HumanMessage, AIMessage } from "langchain";

const systemMsg = new SystemMessage("You are a helpful coding assistant.");

const messages = [

  systemMsg,

  new HumanMessage("How do I create a REST API?"),

];

const response = await model.invoke(messages);

```

```typescript Detailed persona theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { SystemMessage, HumanMessage } from "langchain";

const systemMsg = new SystemMessage(`

You are a senior TypeScript developer with expertise in web frameworks.

Always provide code examples and explain your reasoning.

Be concise but thorough in your explanations.

`);

const messages = [

  systemMsg,

  new HumanMessage("How do I create a REST API?"),

];

const response = await model.invoke(messages);

```

---

### Human message

A `HumanMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/HumanMessage](https://reference.langchain.com/javascript/langchain-core/messages/HumanMessage)) represents user input and interactions. They can contain text, images, audio, files, and any other amount of multimodal [content](#message-content).

#### Text content

```typescript Message object theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const response = await model.invoke([

  new HumanMessage("What is machine learning?"),

]);

```

```typescript String shortcut theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const response = await model.invoke("What is machine learning?");

```

#### Message metadata

```typescript Add metadata theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const humanMsg = new HumanMessage({

  content: "Hello!",

  name: "alice",

  id: "msg_123",

});

```

  The `name` field behavior varies by provider—some use it for user identification, others ignore it. To check, refer to the model provider's [reference]([https://reference.langchain.com/python/integrations/](https://reference.langchain.com/python/integrations/)).

---

### AI message

An `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)) represents the output of a model invocation. They can include multimodal data, tool calls, and provider-specific metadata that you can later access.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const response = await model.invoke("Explain AI");

console.log(typeof response);  // AIMessage

```

`AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)) objects are returned by the model when calling it, which contains all of the associated metadata in the response.

Providers weigh/contextualize types of messages differently, which means it is sometimes helpful to manually create a new `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)) object and insert it into the message history as if it came from the model.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { AIMessage, SystemMessage, HumanMessage } from "langchain";

const aiMsg = new AIMessage("I'd be happy to help you with that question!");

const messages = [

  new SystemMessage("You are a helpful assistant"),

  new HumanMessage("Can you help me?"),

  aiMsg,  // Insert as if it came from the model

  new HumanMessage("Great! What's 2+2?")

]

const response = await model.invoke(messages);

```

```
The text content of the message.
```

```
The raw content of the message.
```

```
The standardized content blocks of the message. (See [content](#message-content))
```

```
The tool calls made by the model.

Empty if no tools are called.
```

```
A unique identifier for the message (either automatically generated by LangChain or returned in the provider response)
```

```
The usage metadata of the message, which can contain token counts when available. See `UsageMetadata`]([https://reference.langchain.com/javascript/langchain-core/messages/UsageMetadata](https://reference.langchain.com/javascript/langchain-core/messages/UsageMetadata)).
```

```
The response metadata of the message.
```

#### Tool calls

When models make [tool calls](/oss/javascript/langchain/models#tool-calling), they're included in the `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)):

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const modelWithTools = model.bindTools([getWeather]);

const response = await modelWithTools.invoke("What's the weather in Paris?");

for (const toolCall of response.tool_calls) {

  console.log`Tool: ${toolCall.name}`);

  console.log`Args: ${toolCall.args}`);

  console.log`ID: ${toolCall.id}`);

}

```

Other structured data, such as reasoning or citations, can also appear in message [content](/oss/javascript/langchain/messages#message-content).

#### Token usage

An `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)) can hold token counts and other usage metadata in its `usage_metadata`]([https://reference.langchain.com/javascript/langchain-core/messages/UsageMetadata](https://reference.langchain.com/javascript/langchain-core/messages/UsageMetadata)) field:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { initChatModel } from "langchain";

const model = await initChatModel("gpt-5-nano");

const response = await model.invoke("Hello!");

console.log(response.usage_metadata);

```

```json theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

{

  "output_tokens": 304,

  "input_tokens": 8,

  "total_tokens": 312,

  "input_token_details": {

    "cache_read": 0

  },

  "output_token_details": {

    "reasoning": 256

  }

}

```

See `UsageMetadata`]([https://reference.langchain.com/javascript/langchain-core/messages/UsageMetadata](https://reference.langchain.com/javascript/langchain-core/messages/UsageMetadata)) for details.

#### Streaming and chunks

During streaming, you'll receive `AIMessageChunk`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessageChunk](https://reference.langchain.com/javascript/langchain-core/messages/AIMessageChunk)) objects that can be combined into a full message object:

  Learn more:

- [Streaming tokens from chat models](/oss/javascript/langchain/models#stream)
- [Streaming tokens and/or steps from agents](/oss/javascript/langchain/streaming)

---

### Tool message

For models that support [tool calling](/oss/javascript/langchain/models#tool-calling), AI messages can contain tool calls. Tool messages are used to pass the results of a single tool execution back to the model.

[Tools](/oss/javascript/langchain/tools) can generate `ToolMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/ToolMessage](https://reference.langchain.com/javascript/langchain-core/messages/ToolMessage)) objects directly. Below, we show a simple example. Read more in the [tools guide](/oss/javascript/langchain/tools).

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { AIMessage, ToolMessage } from "langchain";

const aiMessage = new AIMessage({

  content: [],

  tool_calls: [{

    name: "get_weather",

    args: { location: "San Francisco" },

    id: "call_123"

  }]

});

const toolMessage = new ToolMessage({

  content: "Sunny, 72°F",

  tool_call_id: "call_123"

});

const messages = [

  new HumanMessage("What's the weather in San Francisco?"),

  aiMessage,  // Model's tool call

  toolMessage,  // Tool execution result

];

const response = await model.invoke(messages);  // Model processes the result

```

```
The stringified output of the tool call.
```

```
The ID of the tool call that this message is responding to. Must match the ID of the tool call in the `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)).
```

```
The name of the tool that was called.
```

```
Additional data not sent to the model but can be accessed programmatically.
```

  The `artifact` field stores supplementary data that won't be sent to the model but can be accessed programmatically. This is useful for storing raw results, debugging information, or data for downstream processing without cluttering the model's context.

```
For example, a [retrieval](/oss/javascript/langchain/retrieval) tool could retrieve a passage from a document for reference by a model. Where message `content` contains text that the model will reference, an `artifact` can contain document identifiers or other metadata that an application can use (e.g., to render a page). See example below:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ToolMessage } from "langchain";

// Artifact available downstream

const artifact = { document_id: "doc_123", page: 0 };

const toolMessage = new ToolMessage({

  content: "It was the best of times, it was the worst of times.",

  tool_call_id: "call_123",

  name: "search_books",

  artifact

});

```

See the [RAG tutorial](/oss/javascript/langchain/rag) for an end-to-end example of building retrieval [agents](/oss/javascript/langchain/agents) with LangChain.

```





---

## Message content

You can think of a message's content as the payload of data that gets sent to the model. Messages have a `content` attribute that is loosely-typed, supporting strings and lists of untyped objects (e.g., dictionaries). This allows support for provider-native structures directly in LangChain chat models, such as [multimodal](#multimodal) content and other data.

Separately, LangChain provides dedicated content types for text, reasoning, citations, multi-modal data, server-side tool calls, and other message content. See [content blocks](#standard-content-blocks) below.

LangChain chat models accept message content in the `content` attribute.

This may contain either:

1. A string
2. A list of content blocks in a provider-native format
3. A list of [LangChain's standard content blocks](#standard-content-blocks)

See below for an example using [multimodal](#multimodal) inputs:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { HumanMessage } from "langchain";

// String content

const humanMessage = new HumanMessage("Hello, how are you?");

// Provider-native format (e.g., OpenAI)

const humanMessage = new HumanMessage({

  content: [

    { type: "text", text: "Hello, how are you?" },

    {

      type: "image_url",

      image_url: { url: "[https://example.com/image.jpg](https://example.com/image.jpg)" },

    },

  ],

});

// List of standard content blocks

const humanMessage = new HumanMessage({

  contentBlocks: [

    { type: "text", text: "Hello, how are you?" },

    { type: "image", url: "[https://example.com/image.jpg](https://example.com/image.jpg)" },

  ],

});

```

### Standard content blocks

LangChain provides a standard representation for message content that works across providers.

Message objects implement a `contentBlocks` property that will lazily parse the `content` attribute into a standard, type-safe representation. For example, messages generated from `ChatAnthropic`](/oss/javascript/integrations/chat/anthropic) or `ChatOpenAI`](/oss/javascript/integrations/chat/openai) will include `thinking` or `reasoning` blocks in the format of the respective provider, but can be lazily parsed into a consistent `ReasoningContentBlock`](#content-block-reference) representation:

```
```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { AIMessage } from "@langchain/core/messages";

const message = new AIMessage({

  content: [

    {

      "type": "thinking",

      "thinking": "...",

      "signature": "WaUjzkyp...",

    },

    {

      "type":"text",

      "text": "...",

      "id": "msg_abc123",

    },

  ],

  response_metadata: { model_provider: "anthropic" },

});

console.log(message.contentBlocks);

```

```





```

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { AIMessage } from "@langchain/core/messages";

const message = new AIMessage({

  content: [

    {

      "type": "reasoning",

      "id": "rs_abc123",

      "summary": [

        {"type": "summary_text", "text": "summary 1"},

        {"type": "summary_text", "text": "summary 2"},

      ],

    },

    {"type": "text", "text": "..."},

  ],

  response_metadata: { model_provider: "openai" },

});

console.log(message.contentBlocks);

```

```





See the [integrations guides](/oss/javascript/integrations/providers/overview) to get started with the

inference provider of your choice.



  **Serializing standard content**

  If an application outside of LangChain needs access to the standard content block

  representation, you can opt-in to storing content blocks in message content.

  To do this, you can set the `LC_OUTPUT_VERSION` environment variable to `v1`. Or,

  initialize any chat model with `outputVersion: "v1"`:



### Multimodal

**Multimodality** refers to the ability to work with data that comes in different

forms, such as text, audio, images, and video. LangChain includes standard types

for these data that can be used across providers.

[Chat models](/oss/javascript/langchain/models) can accept multimodal data as input and generate

it as output. Below we show short examples of input messages featuring multimodal data.



  Extra keys can be included top-level in the content block or nested in `"extras": {"key": value}`.

  [OpenAI](/oss/javascript/integrations/chat/openai) and [AWS Bedrock Converse](/oss/javascript/integrations/chat/bedrock),

  for example, require a filename for PDFs. See the [provider page](/oss/javascript/integrations/providers/overview)

  for your chosen model for specifics.









  Not all models support all file types. Check the model provider's [reference]([https://reference.langchain.com/python/integrations/](https://reference.langchain.com/python/integrations/)) for supported formats and size limits.



### Content block reference

Content blocks are represented (either when creating a message or accessing the `contentBlocks` field) as a list of typed objects. Each item in the list must adhere to one of the following block types:





```





```
**Purpose:** Standard text output

<ParamField body="type" type="string" required>

  Always `"text"`

</ParamField>

<ParamField body="text" type="string" required>

  The text content

</ParamField>

<ParamField body="annotations" type="Citation[]">

  List of annotations for the text

</ParamField>

**Example:**

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

{

    type: "text",

    text: "Hello world",

    annotations: []

}

```
```





```
**Purpose:** Model reasoning steps

<ParamField body="type" type="string" required>

  Always `"reasoning"`

</ParamField>

<ParamField body="reasoning" type="string" required>

  The reasoning content

</ParamField>

**Example:**

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

{

    type: "reasoning",

    reasoning: "The user is asking about..."

}

```
```



```

```
<AccordionGroup>

  <Accordion title="ContentBlock.Multimodal.Image" icon="photo">

    **Purpose:** Image data

    <ParamField body="type" type="string" required>

      Always `"image"`

    </ParamField>

    <ParamField body="url" type="string">

      URL pointing to the image location.

    </ParamField>

    <ParamField body="data" type="string">

      Base64-encoded image data.

    </ParamField>

    <ParamField body="fileId" type="string">

      Reference to the image in an external file storage system (e.g., OpenAI or Anthropic's Files API).

    </ParamField>

    <ParamField body="mimeType" type="string">

      Image [MIME type]([https://www.iana.org/assignments/media-types/media-types.xhtml#image](https://www.iana.org/assignments/media-types/media-types.xhtml#image)) (e.g., `image/jpeg`, `image/png`). Required for base64 data.

    </ParamField>

  </Accordion>

  <Accordion title="[ContentBlock.Multimodal.Audio](http://ContentBlock.Multimodal.Audio)" icon="volume">

    **Purpose:** Audio data

    <ParamField body="type" type="string" required>

      Always `"audio"`

    </ParamField>

    <ParamField body="url" type="string">

      URL pointing to the audio location.

    </ParamField>

    <ParamField body="data" type="string">

      Base64-encoded audio data.

    </ParamField>

    <ParamField body="fileId" type="string">

      Reference to the audio file in an external file storage system (e.g., OpenAI or Anthropic's Files API).

    </ParamField>

    <ParamField body="mimeType" type="string">

      Audio [MIME type]([https://www.iana.org/assignments/media-types/media-types.xhtml#audio](https://www.iana.org/assignments/media-types/media-types.xhtml#audio)) (e.g., `audio/mpeg`, `audio/wav`). Required for base64 data.

    </ParamField>

  </Accordion>

  <Accordion title="[ContentBlock.Multimodal.Video](http://ContentBlock.Multimodal.Video)" icon="video">

    **Purpose:** Video data

    <ParamField body="type" type="string" required>

      Always `"video"`

    </ParamField>

    <ParamField body="url" type="string">

      URL pointing to the video location.

    </ParamField>

    <ParamField body="data" type="string">

      Base64-encoded video data.

    </ParamField>

    <ParamField body="fileId" type="string">

      Reference to the video file in an external file storage system (e.g., OpenAI or Anthropic's Files API).

    </ParamField>

    <ParamField body="mimeType" type="string">

      Video [MIME type]([https://www.iana.org/assignments/media-types/media-types.xhtml#video](https://www.iana.org/assignments/media-types/media-types.xhtml#video)) (e.g., `video/mp4`, `video/webm`). Required for base64 data.

    </ParamField>

  </Accordion>

  <Accordion title="ContentBlock.Multimodal.File" icon="file">

    **Purpose:** Generic files (PDF, etc)

    <ParamField body="type" type="string" required>

      Always `"file"`

    </ParamField>

    <ParamField body="url" type="string">

      URL pointing to the file location.

    </ParamField>

    <ParamField body="data" type="string">

      Base64-encoded file data.

    </ParamField>

    <ParamField body="fileId" type="string">

      Reference to the file in an external file storage system (e.g., OpenAI or Anthropic's Files API).

    </ParamField>

    <ParamField body="mimeType" type="string">

      File [MIME type]([https://www.iana.org/assignments/media-types/media-types.xhtml](https://www.iana.org/assignments/media-types/media-types.xhtml)) (e.g., `application/pdf`). Required for base64 data.

    </ParamField>

  </Accordion>

  <Accordion title="ContentBlock.Multimodal.PlainText" icon="align-left">

    **Purpose:** Document text `.txt`, `.md`)

    <ParamField body="type" type="string" required>

      Always `"text-plain"`

    </ParamField>

    <ParamField body="text" type="string" required>

      The text content

    </ParamField>

    <ParamField body="title" type="string">

      Title of the text content

    </ParamField>

    <ParamField body="mimeType" type="string">

      [MIME type]([https://www.iana.org/assignments/media-types/media-types.xhtml](https://www.iana.org/assignments/media-types/media-types.xhtml)) of the text (e.g., `text/plain`, `text/markdown`)

    </ParamField>

  </Accordion>

</AccordionGroup>
```

```
<AccordionGroup>

  <Accordion title="[ContentBlock.Tools](http://ContentBlock.Tools).ToolCall" icon="function">

    **Purpose:** Function calls

    <ParamField body="type" type="string" required>

      Always `"tool_call"`

    </ParamField>

    <ParamField body="name" type="string" required>

      Name of the tool to call

    </ParamField>

    <ParamField body="args" type="object" required>

      Arguments to pass to the tool

    </ParamField>

    <ParamField body="id" type="string" required>

      Unique identifier for this tool call

    </ParamField>

    **Example:**

    ```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

    {

        type: "tool_call",

        name: "search",

        args: { query: "weather" },

        id: "call_123"

    }

    ```

  </Accordion>

  <Accordion title="[ContentBlock.Tools](http://ContentBlock.Tools).ToolCallChunk" icon="puzzle">

    **Purpose:** Streaming tool fragments

    <ParamField body="type" type="string" required>

      Always `"tool_call_chunk"`

    </ParamField>

    <ParamField body="name" type="string">

      Name of the tool being called

    </ParamField>

    <ParamField body="args" type="string">

      Partial tool arguments (may be incomplete JSON)

    </ParamField>

    <ParamField body="id" type="string">

      Tool call identifier

    </ParamField>

    <ParamField body="index" type="number | string" required>

      Position of this chunk in the stream

    </ParamField>

  </Accordion>

  <Accordion title="[ContentBlock.Tools](http://ContentBlock.Tools).InvalidToolCall" icon="alert-triangle">

    **Purpose:** Malformed calls

    <ParamField body="type" type="string" required>

      Always `"invalid_tool_call"`

    </ParamField>

    <ParamField body="name" type="string">

      Name of the tool that failed to be called

    </ParamField>

    <ParamField body="args" type="string">

      Raw arguments that failed to parse

    </ParamField>

    <ParamField body="error" type="string" required>

      Description of what went wrong

    </ParamField>

    **Common errors:** Invalid JSON, missing required fields

  </Accordion>

</AccordionGroup>
```

```
<AccordionGroup>

  <Accordion title="[ContentBlock.Tools](http://ContentBlock.Tools).ServerToolCall" icon="tool">

    **Purpose:** Tool call that is executed server-side.

    <ParamField body="type" type="string" required>

      Always `"server_tool_call"`

    </ParamField>

    <ParamField body="id" type="string" required>

      An identifier associated with the tool call.

    </ParamField>

    <ParamField body="name" type="string" required>

      The name of the tool to be called.

    </ParamField>

    <ParamField body="args" type="string" required>

      Partial tool arguments (may be incomplete JSON)

    </ParamField>

  </Accordion>

  <Accordion title="[ContentBlock.Tools](http://ContentBlock.Tools).ServerToolCallChunk" icon="puzzle">

    **Purpose:** Streaming server-side tool call fragments

    <ParamField body="type" type="string" required>

      Always `"server_tool_call_chunk"`

    </ParamField>

    <ParamField body="id" type="string">

      An identifier associated with the tool call.

    </ParamField>

    <ParamField body="name" type="string">

      Name of the tool being called

    </ParamField>

    <ParamField body="args" type="string">

      Partial tool arguments (may be incomplete JSON)

    </ParamField>

    <ParamField body="index" type="number | string">

      Position of this chunk in the stream

    </ParamField>

  </Accordion>

  <Accordion title="[ContentBlock.Tools](http://ContentBlock.Tools).ServerToolResult" icon="package">

    **Purpose:** Search results

    <ParamField body="type" type="string" required>

      Always `"server_tool_result"`

    </ParamField>

    <ParamField body="tool_call_id" type="string" required>

      Identifier of the corresponding server tool call.

    </ParamField>

    <ParamField body="id" type="string">

      Identifier associated with the server tool result.

    </ParamField>

    <ParamField body="status" type="string" required>

      Execution status of the server-side tool. `"success"` or `"error"`.

    </ParamField>

    <ParamField body="output">

      Output of the executed tool.

    </ParamField>

  </Accordion>

</AccordionGroup>
```

```
<Accordion title="ContentBlock.NonStandard" icon="asterisk">

  **Purpose:** Provider-specific escape hatch

  <ParamField body="type" type="string" required>

    Always `"non_standard"`

  </ParamField>

  <ParamField body="value" type="object" required>

    Provider-specific data structure

  </ParamField>

  **Usage:** For experimental or provider-unique features

</Accordion>

Additional provider-specific content types may be found within the [reference documentation](/oss/javascript/integrations/providers/overview) of each model provider.
```

Each of these content blocks mentioned above are individually addressable as types when importing the `ContentBlock`]([https://reference.langchain.com/javascript/langchain-core/messages/ContentBlock](https://reference.langchain.com/javascript/langchain-core/messages/ContentBlock)) type.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ContentBlock } from "langchain";

// Text block

const textBlock: ContentBlock.Text = {

    type: "text",

    text: "Hello world",

}

// Image block

const imageBlock: ContentBlock.Multimodal.Image = {

    type: "image",

    url: "[https://example.com/image.png](https://example.com/image.png)",

    mimeType: "image/png",

}

```

  View the canonical type definitions in the [API reference]([https://reference.langchain.com/javascript/modules/_langchain_core.messages.html](https://reference.langchain.com/javascript/modules/_langchain_core.messages.html)).

  Content blocks were introduced as a new property on messages in LangChain v1 to standardize content formats across providers while maintaining backward compatibility with existing code.

  Content blocks are not a replacement for the `content`]([https://reference.langchain.com/javascript/langchain-core/messages/BaseMessage](https://reference.langchain.com/javascript/langchain-core/messages/BaseMessage)) property, but rather a new property that can be used to access the content of a message in a standardized format.

## Use with chat models

[Chat models](/oss/javascript/langchain/models) accept a sequence of message objects as input and return an `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)) as output. Interactions are often stateless, so that a simple conversational loop involves invoking a model with a growing list of messages.

Refer to the below guides to learn more:

- Built-in features for [persisting and managing conversation histories](/oss/javascript/langchain/short-term-memory)
- Strategies for managing context windows, including [trimming and summarizing messages](/oss/javascript/langchain/short-term-memory#common-patterns)

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/messages.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/messages.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Tools

Tools extend what [agents](/oss/javascript/langchain/agents) can do—letting them fetch real-time data, execute code, query external databases, and take actions in the world.

Under the hood, tools are callable functions with well-defined inputs and outputs that get passed to a [chat model](/oss/javascript/langchain/models). The model decides when to invoke a tool based on the conversation context, and what input arguments to provide.

  For details on how models handle tool calls, see [Tool calling](/oss/javascript/langchain/models#tool-calling).

## Create tools

### Basic tool definition

The simplest way to create a tool is by importing the `tool` function from the `langchain` package. You can use [zod]([https://zod.dev/](https://zod.dev/)) to define the tool's input schema:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import * as z from "zod"

import { tool } from "langchain"

const searchDatabase = tool(

  ({ query, limit }) => `Found ${limit} results for '${query}'`,

  {

    name: "search_database",

    description: "Search the customer database for records matching the query.",

    schema: z.object({

      query: z.string().describe("Search terms to look for"),

      limit: z.number().describe("Maximum number of results to return"),

    }),

  }

);

```

  **Server-side tool use:** Some chat models feature built-in tools (web search, code interpreters) that are executed server-side. See [Server-side tool use](#server-side-tool-use) for details.

  Prefer `snake_case` for tool names (e.g., `web_search` instead of `Web Search`). Some model providers have issues with or reject names containing spaces or special characters with errors. Sticking to alphanumeric characters, underscores, and hyphens helps to improve compatibility across providers.

## Access context

Tools are most powerful when they can access runtime information like conversation history, user data, and persistent memory. This section covers how to access and update this information from within your tools.

### Context

Context provides immutable configuration data that is passed at invocation time. Use it for user IDs, session details, or application-specific settings that shouldn't change during a conversation.

Tools can access an agent's runtime context through the `config` parameter:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import * as z from "zod"

import { ChatOpenAI } from "@langchain/openai"

import { createAgent } from "langchain"

const getUserName = tool(

  (_, config) => {

    return config.context.user_name

  },

  {

    name: "get_user_name",

    description: "Get the user's name.",

    schema: z.object({}),

  }

);

const contextSchema = z.object({

  user_name: z.string(),

});

const agent = createAgent({

  model: new ChatOpenAI({ model: "gpt-5.4" }),

  tools: [getUserName],

  contextSchema,

});

const result = await agent.invoke(

  {

    messages: [{ role: "user", content: "What is my name?" }]

  },

  {

    context: { user_name: "John Smith" }

  }

);

```

### Long-term memory (Store)

The `BaseStore`]([https://reference.langchain.com/javascript/langchain-core/stores/BaseStore](https://reference.langchain.com/javascript/langchain-core/stores/BaseStore)) provides persistent storage that survives across conversations. Unlike state (short-term memory), data saved to the store remains available in future sessions.

Access the store through `config.store`. The store uses a namespace/key pattern to organize data:

```ts expandable theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import * as z from "zod";

import { createAgent, tool } from "langchain";

import { InMemoryStore } from "@langchain/langgraph";

import { ChatOpenAI } from "@langchain/openai";

const store = new InMemoryStore();

// Access memory

const getUserInfo = tool(

  async ({ user_id }) => {

    const value = await store.get(["users"], user_id);

    console.log("get_user_info", user_id, value);

    return value;

  },

  {

    name: "get_user_info",

    description: "Look up user info.",

    schema: z.object({

      user_id: z.string(),

    }),

  }

);

// Update memory

const saveUserInfo = tool(

  async ({ user_id, name, age, email }) => {

    console.log("save_user_info", user_id, name, age, email);

    await store.put(["users"], user_id, { name, age, email });

    return "Successfully saved user info.";

  },

  {

    name: "save_user_info",

    description: "Save user info.",

    schema: z.object({

      user_id: z.string(),

      name: z.string(),

      age: z.number(),

      email: z.string(),

    }),

  }

);

const agent = createAgent({

  model: new ChatOpenAI({ model: "gpt-5.4" }),

  tools: [getUserInfo, saveUserInfo],

  store,

});

// First session: save user info

await agent.invoke({

  messages: [

    {

      role: "user",

      content: "Save the following user: userid: abc123, name: Foo, age: 25, email: [foo@langchain.dev](mailto:foo@langchain.dev)",

    },

  ],

});

// Second session: get user info

const result = await agent.invoke({

  messages: [

    { role: "user", content: "Get user info for user with id 'abc123'" },

  ],

});

console.log(result);

// Here is the user info for user with ID "abc123":

// - Name: Foo

// - Age: 25

// - Email: [foo@langchain.dev](mailto:foo@langchain.dev)

```

### Stream writer

Stream real-time updates from tools during execution. This is useful for providing progress feedback to users during long-running operations.

Use `config.writer` to emit custom updates:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import * as z from "zod";

import { tool, ToolRuntime } from "langchain";

const getWeather = tool(

  ({ city }, config: ToolRuntime) => {

    const writer = config.writer;

    // Stream custom updates as the tool executes

    if (writer) {

      writer`Looking up data for city: ${city}`);

      writer`Acquired data for city: ${city}`);

    }

    return `It's always sunny in ${city}!`;

  },

  {

    name: "get_weather",

    description: "Get weather for a given city.",

    schema: z.object({

      city: z.string(),

    }),

  }

);

```

### Execution info

Access thread ID, run ID, and retry state from within a tool via `runtime.execution_info`:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { tool } from "langchain";

import * as z from "zod";

const logExecutionContext = tool(

  async (_input, runtime) => {

    const info = runtime.executionInfo;

    console.log`Thread: ${info.threadId}, Run: ${info.runId}`);  // [!code highlight]

    console.log`Attempt: ${info.nodeAttempt}`);

    return "done";

  },

  {

    name: "log_execution_context",

    description: "Log execution identity information.",

    schema: z.object({}),

  }

);

```

  Requires `deepagents>=1.9.0` (or `@langchain/langgraph>=1.2.8`).

### Server info

When your tool runs on LangGraph Server, access the assistant ID, graph ID, and authenticated user via `runtime.server_info`:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { tool } from "langchain";

import * as z from "zod";

const getAssistantScopedData = tool(

  async (_input, runtime) => {

    const server = runtime.serverInfo;

    if (server != null) {

      console.log`Assistant: ${server.assistantId}, Graph: ${server.graphId}`);  // [!code highlight]

      if (server.user != null) {

        console.log`User: ${server.user.identity}`);  // [!code highlight]

      }

    }

    return "done";

  },

  {

    name: "get_assistant_scoped_data",

    description: "Fetch data scoped to the current assistant.",

    schema: z.object({}),

  }

);

```

`serverInfo` is `null` when the tool is not running on LangGraph Server.

  Requires `deepagents>=1.9.0` (or `@langchain/langgraph>=1.2.8`).

## ToolNode

`ToolNode`]([https://reference.langchain.com/javascript/langchain-langgraph/prebuilt/ToolNode](https://reference.langchain.com/javascript/langchain-langgraph/prebuilt/ToolNode)) is a prebuilt node that executes tools in LangGraph workflows. It handles parallel tool execution, error handling, and state injection automatically.

  For custom workflows where you need fine-grained control over tool execution patterns, use `ToolNode`]([https://reference.langchain.com/javascript/langchain-langgraph/prebuilt/ToolNode](https://reference.langchain.com/javascript/langchain-langgraph/prebuilt/ToolNode)) instead of `create_agent`]([https://reference.langchain.com/javascript/langchain/index/createAgent](https://reference.langchain.com/javascript/langchain/index/createAgent)). It's the building block that powers agent tool execution.

### Basic usage

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ToolNode } from "@langchain/langgraph/prebuilt";

import { tool } from "@langchain/core/tools";

import * as z from "zod";

const search = tool(

  ({ query }) => `Results for: ${query}`,

  {

    name: "search",

    description: "Search for information.",

    schema: z.object({ query: z.string() }),

  }

);

const calculator = tool(

  ({ expression }) => String(eval(expression)),

  {

    name: "calculator",

    description: "Evaluate a math expression.",

    schema: z.object({ expression: z.string() }),

  }

);

// Create the ToolNode with your tools

const toolNode = new ToolNode([search, calculator]);

```

### Tool return values

You can choose different return values for your tools:

- Return a `string` for human-readable results.
- Return an `object` for structured results the model should parse.
- Return a `Command` with optional message when you need to write to state.

#### Return a string

Return a string when the tool should provide plain text for the model to read and use in its next response.

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { tool } from "langchain";

import * as z from "zod";

const getWeather = tool(({ city }) => `It is currently sunny in ${city}.`, {

  name: "get_weather",

  description: "Get weather for a city.",

  schema: z.object({ city: z.string() }),

});

```

Behavior:

- The return value is converted to a `ToolMessage`.
- The model sees that text and decides what to do next.
- No agent state fields are changed unless the model or another tool does so later.

Use this when the result is naturally human-readable text.

#### Return an object

Return an object (for example, a `dict`) when your tool produces structured data that the model should inspect.

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { tool } from "langchain";

import * as z from "zod";

const getWeatherData = tool(

  ({ city }) => ({

    city,

    temperature_c: 22,

    conditions: "sunny",

  }),

  {

    name: "get_weather_data",

    description: "Get structured weather data for a city.",

    schema: z.object({ city: z.string() }),

  },

);

```

Behavior:

- The object is serialized and sent back as tool output.
- The model can read specific fields and reason over them.
- Like string returns, this does not directly update graph state.

Use this when downstream reasoning benefits from explicit fields instead of free-form text.

#### Return a Command

Return a `Command`]([https://reference.langchain.com/javascript/langchain-langgraph/index/Command](https://reference.langchain.com/javascript/langchain-langgraph/index/Command)) when the tool needs to update graph state (for example, setting user preferences or app state).

You can return a `Command` with or without including a `ToolMessage`.

If the model needs to see that the tool succeeded (for example, to confirm a preference change), include a `ToolMessage` in the update, using `runtime.tool_call_id` for the `tool_call_id` parameter.

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { tool, ToolMessage, type ToolRuntime } from "langchain";

import { Command } from "@langchain/langgraph";

import * as z from "zod";

const setLanguage = tool(

  async ({ language }, config: ToolRuntime) => {

    return new Command({

      update: {

        preferredLanguage: language,

        messages: [

          new ToolMessage({

            content: `Language set to ${language}.`,

            tool_call_id: config.toolCallId,

          }),

        ],

      },

    });

  },

  {

    name: "set_language",

    description: "Set the preferred response language.",

    schema: z.object({ language: z.string() }),

  },

);

```

Behavior:

- The command updates state using `update`.
- Updated state is available to subsequent steps in the same run.
- Use reducers for fields that may be updated by parallel tool calls.

Use this when the tool is not just returning data, but also mutating agent state.

### Error handling

Configure how tool errors are handled. See the `ToolNode`]([https://reference.langchain.com/javascript/langchain-langgraph/prebuilt/ToolNode](https://reference.langchain.com/javascript/langchain-langgraph/prebuilt/ToolNode)) API reference for all options.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ToolNode } from "@langchain/langgraph/prebuilt";

// Default behavior

const toolNode = new ToolNode(tools);

// Catch all errors

const toolNode = new ToolNode(tools, { handleToolErrors: true });

// Custom error message

const toolNode = new ToolNode(tools, {

  handleToolErrors: "Something went wrong, please try again."

});

```

### Route with toolscondition

Use `tools_condition`]([https://reference.langchain.com/javascript/langchain-langgraph/prebuilt/toolsCondition](https://reference.langchain.com/javascript/langchain-langgraph/prebuilt/toolsCondition)) for conditional routing based on whether the LLM made tool calls:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";

const builder = new StateGraph(MessagesAnnotation)

  .addNode("llm", callLlm)

  .addNode("tools", new ToolNode(tools))

  .addEdge("__start__", "llm")

  .addConditionalEdges("llm", toolsCondition)  // Routes to "tools" or "__end__"

  .addEdge("tools", "llm");

const graph = builder.compile();

```

### State injection

Tools can access the current graph state through `ToolRuntime`]([https://reference.langchain.com/javascript/langchain/index/Runtime](https://reference.langchain.com/javascript/langchain/index/Runtime)):

For more details on accessing state, context, and long-term memory from tools, see [Access context](#access-context).

## Prebuilt tools

LangChain provides a large collection of prebuilt tools and toolkits for common tasks like web search, code interpretation, database access, and more. These ready-to-use tools can be directly integrated into your agents without writing custom code.

See the [tools and toolkits](/oss/javascript/integrations/tools) integration page for a complete list of available tools organized by category.

## Server-side tool use

Some chat models feature built-in tools that are executed server-side by the model provider. These include capabilities like web search and code interpreters that don't require you to define or host the tool logic.

Refer to the individual [chat model integration pages](/oss/javascript/integrations/providers) and the [tool calling documentation](/oss/javascript/langchain/models#server-side-tool-use) for details on enabling and using these built-in tools.

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/tools.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/tools.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Streaming

> Stream real-time updates from agent runs

LangChain implements a streaming system to surface real-time updates.

Streaming is crucial for enhancing the responsiveness of applications built on LLMs. By displaying output progressively, even before a complete response is ready, streaming significantly improves user experience (UX), particularly when dealing with the latency of LLMs.

## Overview

LangChain's streaming system lets you surface live feedback from agent runs to your application.

What's possible with LangChain streaming:

  *[*Stream agent progress](#agent-progress)*—get state updates after each agent step.

  *[*Stream LLM tokens](#llm-tokens)*—stream language model tokens as they're generated.

  *[*Stream thinking / reasoning tokens](#streaming-thinking-/-reasoning-tokens)*—surface model reasoning as it's generated.

  *[*Stream custom updates](#custom-updates)*—emit user-defined signals (e.g., `"Fetched 10/100 records"`).

  *[*Stream multiple modes](#stream-multiple-modes)*—choose from `updates` (agent progress), `messages` (LLM tokens + metadata), or `custom` (arbitrary user data).

See the [common patterns](#common-patterns) section below for additional end-to-end examples.

## Supported stream modes

Pass one or more of the following stream modes as a list to the `stream`]([https://reference.langchain.com/javascript/classes/_langchain_langgraph.index.CompiledStateGraph.html#stream](https://reference.langchain.com/javascript/classes/_langchain_langgraph.index.CompiledStateGraph.html#stream)) method:

| Mode       | Description                                                                                                                                                       |

| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| `updates`  | Streams state updates after each agent step. If multiple updates are made in the same step (e.g., multiple nodes are run), those updates are streamed separately. |

| `messages` | Streams tuples of `(token, metadata)` from any graph nodes where an LLM is invoked.                                                                               |

| `custom`   | Streams custom data from inside your graph nodes using the stream writer.                                                                                         |

## Agent progress

To stream agent progress, use the `stream`]([https://reference.langchain.com/javascript/classes/_langchain_langgraph.index.CompiledStateGraph.html#stream](https://reference.langchain.com/javascript/classes/_langchain_langgraph.index.CompiledStateGraph.html#stream)) method with `streamMode: "updates"`. This emits an event after every agent step.

For example, if you have an agent that calls a tool once, you should see the following updates:

- **LLM node**: `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)) with tool call requests
- **Tool node**: `ToolMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/ToolMessage](https://reference.langchain.com/javascript/langchain-core/messages/ToolMessage)) with execution result
- **LLM node**: Final AI response

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import z from "zod";

import { createAgent, tool } from "langchain";

const getWeather = tool(

    async ({ city }) => {

        return `The weather in ${city} is always sunny!`;

    },

    {

        name: "get_weather",

        description: "Get weather for a given city.",

        schema: z.object({

        city: z.string(),

        }),

    }

);

const agent = createAgent({

    model: "gpt-5-nano",

    tools: [getWeather],

});

for await (const chunk of await [agent.stream](http://agent.stream)(

    { messages: [{ role: "user", content: "what is the weather in sf" }] },

    { streamMode: "updates" }

)) {

    const [step, content] = Object.entries(chunk)[0];

    console.log`step: ${step}`);

    console.log`content: ${JSON.stringify(content, null, 2)}`);

}

/**

 * step: model

 * content: {

 *   "messages": [

 *     {

 *       "kwargs": {

 *         // ...

 *         "tool_calls": [

 *           {

 *             "name": "get_weather",

 *             "args": {

 *               "city": "San Francisco"

 *             },

 *             "type": "tool_call",

 *             "id": "call_0qLS2Jp3MCmaKJ5MAYtr4jJd"

 *           }

 *         ],

 *         // ...

 *       }

 *     }

 *   ]

 * }

 * step: tools

 * content: {

 *   "messages": [

 *     {

 *       "kwargs": {

 *         "content": "The weather in San Francisco is always sunny!",

 *         "name": "get_weather",

 *         // ...

 *       }

 *     }

 *   ]

 * }

 * step: model

 * content: {

 *   "messages": [

 *     {

 *       "kwargs": {

 *         "content": "The latest update says: The weather in San Francisco is always sunny!\n\nIf you'd like real-time details (current temperature, humidity, wind, and today's forecast), I can pull the latest data for you. Want me to fetch that?",

 *         // ...

 *       }

 *     }

 *   ]

 * }

 */

```

## LLM tokens

To stream tokens as they are produced by the LLM, use `streamMode: "messages"`:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import z from "zod";

import { createAgent, tool } from "langchain";

const getWeather = tool(

    async ({ city }) => {

        return `The weather in ${city} is always sunny!`;

    },

    {

        name: "get_weather",

        description: "Get weather for a given city.",

        schema: z.object({

        city: z.string(),

        }),

    }

);

const agent = createAgent({

    model: "gpt-5.4-mini",

    tools: [getWeather],

});

for await (const [token, metadata] of await [agent.stream](http://agent.stream)(

    { messages: [{ role: "user", content: "what is the weather in sf" }] },

    { streamMode: "messages" }

)) {

    console.log`node: ${metadata.langgraph_node}`);

    console.log`content: ${JSON.stringify(token.contentBlocks, null, 2)}`);

}

```

## Custom updates

To stream updates from tools as they are executed, you can use the `writer` parameter from the configuration.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import z from "zod";

import { tool, createAgent } from "langchain";

import { LangGraphRunnableConfig } from "@langchain/langgraph";

const getWeather = tool(

    async (input, config: LangGraphRunnableConfig) => {

        // Stream any arbitrary data

        config.writer?.`Looking up data for city: ${input.city}`);

        // ... fetch city data

        config.writer?.`Acquired data for city: ${input.city}`);

        return `It's always sunny in ${input.city}!`;

    },

    {

        name: "get_weather",

        description: "Get weather for a given city.",

        schema: z.object({

        city: z.string().describe("The city to get weather for."),

        }),

    }

);

const agent = createAgent({

    model: "gpt-5.4-mini",

    tools: [getWeather],

});

for await (const chunk of await [agent.stream](http://agent.stream)(

    { messages: [{ role: "user", content: "what is the weather in sf" }] },

    { streamMode: "custom" }

)) {

    console.log(chunk);

}

```

```shell title="Output" theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

Looking up data for city: San Francisco

Acquired data for city: San Francisco

```

  If you add the `writer` parameter to your tool, you won't be able to invoke the tool outside of a LangGraph execution context without providing a writer function.

## Stream multiple modes

You can specify multiple streaming modes by passing streamMode as an array: `streamMode: ["updates", "messages", "custom"]`.

The streamed outputs will be tuples of `[mode, chunk]` where `mode` is the name of the stream mode and `chunk` is the data streamed by that mode.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import z from "zod";

import { tool, createAgent } from "langchain";

import { LangGraphRunnableConfig } from "@langchain/langgraph";

const getWeather = tool(

    async (input, config: LangGraphRunnableConfig) => {

        // Stream any arbitrary data

        config.writer?.`Looking up data for city: ${input.city}`);

        // ... fetch city data

        config.writer?.`Acquired data for city: ${input.city}`);

        return `It's always sunny in ${input.city}!`;

    },

    {

        name: "get_weather",

        description: "Get weather for a given city.",

        schema: z.object({

        city: z.string().describe("The city to get weather for."),

        }),

    }

);

const agent = createAgent({

    model: "gpt-5.4-mini",

    tools: [getWeather],

});

for await (const [streamMode, chunk] of await [agent.stream](http://agent.stream)(

    { messages: [{ role: "user", content: "what is the weather in sf" }] },

    { streamMode: ["updates", "messages", "custom"] }

)) {

    console.log`${streamMode}: ${JSON.stringify(chunk, null, 2)}`);

}

```

## Common patterns

Below are examples showing common use cases for streaming.

### Streaming thinking / reasoning tokens

Some models perform internal reasoning before producing a final answer. You can stream these thinking / reasoning tokens as they're generated by filtering [standard content blocks](/oss/javascript/langchain/messages#standard-content-blocks) for the `type` `"reasoning"`.

  Reasoning output must be enabled on the model.

  See the [reasoning section](/oss/javascript/langchain/models#reasoning) and your [provider's integration page](/oss/javascript/integrations/providers/overview) for configuration details.

  To quickly check a model's reasoning support, see [models.dev]([https://models.dev](https://models.dev)).

To stream thinking tokens from an agent, use `streamMode: "messages"` and filter for reasoning content blocks. Use a model instance (e.g. `ChatAnthropic`) with extended thinking enabled when the model supports it:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import z from "zod";

import { createAgent, tool } from "langchain";

import { ChatAnthropic } from "@langchain/anthropic";

const getWeather = tool(

  async ({ city }) => {

    return `It's always sunny in ${city}!`;

  },

  {

    name: "get_weather",

    description: "Get weather for a given city.",

    schema: z.object({ city: z.string() }),

  },

);

const agent = createAgent({

  model: new ChatAnthropic({

    model: "claude-sonnet-4-6",

    thinking: { type: "enabled", budget_tokens: 5000 },

  }),

  tools: [getWeather],

});

for await (const [token, metadata] of await [agent.stream](http://agent.stream)(

  { messages: [{ role: "user", content: "What is the weather in SF?" }] },

  { streamMode: "messages" }, // [!code highlight]

)) {

  if (!token.contentBlocks) continue;

  const reasoning = token.contentBlocks.filter((b) => b.type === "reasoning");

  const text = token.contentBlocks.filter((b) => b.type === "text");

  if (reasoning.length) {

    process.stdout.write`[thinking] ${reasoning[0].reasoning}`);

  }

  if (text.length) {

    process.stdout.write(text[0].text);

  }

}

```

```shell title="Output" theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

[thinking] The user is asking about the weather in San Francisco. I have a tool

[thinking]  available to get this information. Let me call the get_weather tool

[thinking]  with "San Francisco" as the city parameter.

The weather in San Francisco is: It's always sunny in San Francisco!

```

This works the same way regardless of the model provider—LangChain normalizes provider-specific formats (Anthropic `thinking` blocks, OpenAI `reasoning` summaries, etc.) into a standard `"reasoning"` content block type via the `content_blocks`](/oss/javascript/langchain/messages#standard-content-blocks) property.

To stream reasoning tokens directly from a chat model (without an agent), see [streaming with chat models](/oss/javascript/langchain/models#reasoning).

## Disable streaming

In some applications you might need to disable streaming of individual tokens for a given model. This is useful when:

- Working with [multi-agent](/oss/javascript/langchain/multi-agent) systems to control which agents stream their output
- Mixing models that support streaming with those that do not
- Deploying to [LangSmith](/langsmith/home) and wanting to prevent certain model outputs from being streamed to the client

Set `streaming: false` when initializing the model.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({

  model: "gpt-5.4",

  streaming: false,  // [!code highlight]

});

```

  When deploying to LangSmith, set `streaming=False` on any models whose output you don't want streamed to the client. This is configured in your graph code before deployment.

  Not all chat model integrations support the `streaming` parameter. If your model doesn't support it, use `disableStreaming: true` instead. This parameter is available on all chat models via the base class.

See the [LangGraph streaming guide](/oss/javascript/langgraph/streaming#disable-streaming-for-specific-chat-models) for more details.

## Related

- [Frontend streaming](/oss/javascript/langchain/streaming/frontend)—Build React UIs with `useStream` for real-time agent interactions
- [Streaming with chat models](/oss/javascript/langchain/models#stream)—Stream tokens directly from a chat model without using an agent or graph
- [Reasoning with chat models](/oss/javascript/langchain/models#reasoning)—Configure and access reasoning output from chat models
- [Standard content blocks](/oss/javascript/langchain/messages#standard-content-blocks)—Understand the normalized content block format used for reasoning, text, and other content types
- [Streaming with human-in-the-loop](/oss/javascript/langchain/human-in-the-loop#streaming-with-human-in-the-loop)—Stream agent progress while handling interrupts for human review
- [LangGraph streaming](/oss/javascript/langgraph/streaming)—Advanced streaming options including `values`, `debug` modes, and subgraph streaming

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/streaming.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/streaming.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Structured output

Structured output allows agents to return data in a specific, predictable format. Instead of parsing natural language responses, you get typed structured data.

  This page covers structured output with agents using `createAgent`. To use structured output directly on a model (outside of agents), see [Models - Structured output](/oss/javascript/langchain/models#structured-output).

LangChain's prebuilt ReAct agent `createAgent` handles structured output automatically. The user sets their desired structured output schema, and when the model generates the structured data, it's captured, validated, and returned in the `structuredResponse` key of the agent's state.

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

type ResponseFormat = (

    | ZodSchema<StructuredResponseT> // a Zod schema

    | StandardSchema<StructuredResponseT> // any Standard Schema library

    | Record<string, unknown> // a JSON Schema

)

const agent = createAgent({

    // ...

    responseFormat: ResponseFormat | ResponseFormat[]

})

```

## Response format

Controls how the agent returns structured data. You can provide a Zod schema, any [Standard Schema]([https://standardschema.dev/)-compatible]([https://standardschema.dev/)-compatible](https://standardschema.dev/)-compatible)) schema, or a JSON Schema object. By default, the agent uses a tool calling strategy, in which the output is created by an additional tool call. Certain models support native structured output, in which case the agent will use that strategy instead.

You can control the behavior by wrapping `ResponseFormat` in a `toolStrategy` or `providerStrategy` function call:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { toolStrategy, providerStrategy } from "langchain";

const agent = createAgent({

    // use a provider strategy if supported by the model

    responseFormat: providerStrategy(z.object({ ... }))

    // or enforce a tool strategy

    responseFormat: toolStrategy(z.object({ ... }))

})

```

The structured response is returned in the `structuredResponse` key of the agent's final state.

  Support for native structured output features is read dynamically from the model's [profile data](/oss/javascript/langchain/models#model-profiles) if using `langchain>=1.1`. If data are not available, use another condition or specify manually:

  If tools are specified, the model must support simultaneous use of tools and structured output.

## Provider strategy

Some model providers support structured output natively through their APIs (e.g. OpenAI, xAI (Grok), Gemini, Anthropic (Claude)). This is the most reliable method when available.

To use this strategy, configure a `ProviderStrategy`:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

function providerStrategy<StructuredResponseT>(

    schema: ZodSchema<StructuredResponseT> | SerializableSchema | JsonSchemaFormat

): ProviderStrategy<StructuredResponseT>

```

  The schema defining the structured output format. Supports:

- **Zod Schema**: A zod schema
- **Standard Schema**: Any schema implementing the [Standard Schema]([https://standardschema.dev/](https://standardschema.dev/)) spec
- **JSON Schema**: A JSON schema object

LangChain automatically uses `ProviderStrategy` when you pass a schema type directly to `createAgent.responseFormat` and the model supports native structured output:

Provider-native structured output provides high reliability and strict validation because the model provider enforces the schema. Use it when available.

  If the provider natively supports structured output for your model choice, it is functionally equivalent to write `responseFormat: contactInfoSchema` instead of `responseFormat: providerStrategy(contactInfoSchema)`.

  In either case, if structured output is not supported, the agent will fall back to a tool calling strategy.

## Tool calling strategy

For models that don't support native structured output, LangChain uses tool calling to achieve the same result. This works with all models that support tool calling (most modern models).

To use this strategy, configure a `ToolStrategy`:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

function toolStrategy<StructuredResponseT>(

    responseFormat:

        | JsonSchemaFormat

        | ZodSchema<StructuredResponseT>

        | SerializableSchema

        | (ZodSchema<StructuredResponseT> | SerializableSchema | JsonSchemaFormat)[]

    options?: ToolStrategyOptions

): ToolStrategy<StructuredResponseT>

```

  The schema defining the structured output format. Supports:

- **Zod Schema**: A zod schema
- **Standard Schema**: Any schema implementing the [Standard Schema]([https://standardschema.dev/](https://standardschema.dev/)) spec
- **JSON Schema**: A JSON schema object
  Custom content for the tool message returned when structured output is generated.
  If not provided, defaults to a message showing the structured response data.
  Options parameter containing an optional `handleError` parameter for customizing the error handling strategy.
- *`true`**: Catch all errors with default error template (default)
- *`False`**: No retry, let exceptions propagate
- *`(error: ToolStrategyError) => string | Promise<string>`**: retry with the provided message or throw the error

### Custom tool message content

The `toolMessageContent` parameter allows you to customize the message that appears in the conversation history when structured output is generated:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import * as z from "zod";

import { createAgent, toolStrategy } from "langchain";

const MeetingAction = z.object({

    task: z.string().describe("The specific task to be completed"),

    assignee: z.string().describe("Person responsible for the task"),

    priority: z.enum(["low", "medium", "high"]).describe("Priority level"),

});

const agent = createAgent({

    model: "gpt-5.4",

    tools: [],

    responseFormat: toolStrategy(MeetingAction, {

        toolMessageContent: "Action item captured and added to meeting notes!"

    })

});

const result = await agent.invoke({

    messages: [{"role": "user", "content": "From our meeting: Sarah needs to update the project timeline as soon as possible"}]

});

console.log(result);

/**

 * {

 *   messages: [

 *     { role: "user", content: "From our meeting: Sarah needs to update the project timeline as soon as possible" },

 *     { role: "assistant", content: "Action item captured and added to meeting notes!", tool_calls: [ { name: "MeetingAction", args: { task: "update the project timeline", assignee: "Sarah", priority: "high" }, id: "call_456" } ] },

 *     { role: "tool", content: "Action item captured and added to meeting notes!", tool_call_id: "call_456", name: "MeetingAction" }

 *   ],

 *   structuredResponse: { task: "update the project timeline", assignee: "Sarah", priority: "high" }

 * }

 */

```

Without `toolMessageContent`, we'd see:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

# console.log(result);

/**

 * {

 *   messages: [

 *     ...

 *     { role: "tool", content: "Returning structured response: {'task': 'update the project timeline', 'assignee': 'Sarah', 'priority': 'high'}", tool_call_id: "call_456", name: "MeetingAction" }

 *   ],

 *   structuredResponse: { task: "update the project timeline", assignee: "Sarah", priority: "high" }

 * }

 */

```

### Error handling

Models can make mistakes when generating structured output via tool calling. LangChain provides intelligent retry mechanisms to handle these errors automatically.

#### Multiple structured outputs error

When a model incorrectly calls multiple structured output tools, the agent provides error feedback in a `ToolMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/ToolMessage](https://reference.langchain.com/javascript/langchain-core/messages/ToolMessage)) and prompts the model to retry:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import * as z from "zod";

import { createAgent, toolStrategy } from "langchain";

const ContactInfo = z.object({

    name: z.string().describe("Person's name"),

    email: z.string().describe("Email address"),

});

const EventDetails = z.object({

    event_name: z.string().describe("Name of the event"),

    date: z.string().describe("Event date"),

});

const agent = createAgent({

    model: "gpt-5.4",

    tools: [],

    responseFormat: toolStrategy([ContactInfo, EventDetails]),

});

const result = await agent.invoke({

    messages: [

        {

        role: "user",

        content:

            "Extract info: John Doe ([john@email.com](mailto:john@email.com)) is organizing Tech Conference on March 15th",

        },

    ],

});

console.log(result);

/**

 * {

 *   messages: [

 *     { role: "user", content: "Extract info: John Doe ([john@email.com](mailto:john@email.com)) is organizing Tech Conference on March 15th" },

 *     { role: "assistant", content: "", tool_calls: [ { name: "ContactInfo", args: { name: "John Doe", email: "[john@email.com](mailto:john@email.com)" }, id: "call_1" }, { name: "EventDetails", args: { event_name: "Tech Conference", date: "March 15th" }, id: "call_2" } ] },

 *     { role: "tool", content: "Error: Model incorrectly returned multiple structured responses (ContactInfo, EventDetails) when only one is expected.\n Please fix your mistakes.", tool_call_id: "call_1", name: "ContactInfo" },

 *     { role: "tool", content: "Error: Model incorrectly returned multiple structured responses (ContactInfo, EventDetails) when only one is expected.\n Please fix your mistakes.", tool_call_id: "call_2", name: "EventDetails" },

 *     { role: "assistant", content: "", tool_calls: [ { name: "ContactInfo", args: { name: "John Doe", email: "[john@email.com](mailto:john@email.com)" }, id: "call_3" } ] },

 *     { role: "tool", content: "Returning structured response: {'name': 'John Doe', 'email': '[john@email.com](mailto:john@email.com)'}", tool_call_id: "call_3", name: "ContactInfo" }

 *   ],

 *   structuredResponse: { name: "John Doe", email: "[john@email.com](mailto:john@email.com)" }

 * }

 */

```

#### Schema validation error

When structured output doesn't match the expected schema, the agent provides specific error feedback:

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import * as z from "zod";

import { createAgent, toolStrategy } from "langchain";

const ProductRating = z.object({

    rating: z.number().min(1).max(5).describe("Rating from 1-5"),

    comment: z.string().describe("Review comment"),

});

const agent = createAgent({

    model: "gpt-5.4",

    tools: [],

    responseFormat: toolStrategy(ProductRating),

});

const result = await agent.invoke({

    messages: [

        {

        role: "user",

        content: "Parse this: Amazing product, 10/10!",

        },

    ],

});

console.log(result);

/**

 * {

 *   messages: [

 *     { role: "user", content: "Parse this: Amazing product, 10/10!" },

 *     { role: "assistant", content: "", tool_calls: [ { name: "ProductRating", args: { rating: 10, comment: "Amazing product" }, id: "call_1" } ] },

 *     { role: "tool", content: "Error: Failed to parse structured output for tool 'ProductRating': 1 validation error for ProductRating\nrating\n  Input should be less than or equal to 5 [type=less_than_equal, input_value=10, input_type=int].\n Please fix your mistakes.", tool_call_id: "call_1", name: "ProductRating" },

 *     { role: "assistant", content: "", tool_calls: [ { name: "ProductRating", args: { rating: 5, comment: "Amazing product" }, id: "call_2" } ] },

 *     { role: "tool", content: "Returning structured response: {'rating': 5, 'comment': 'Amazing product'}", tool_call_id: "call_2", name: "ProductRating" }

 *   ],

 *   structuredResponse: { rating: 5, comment: "Amazing product" }

 * }

 */

```

#### Error handling strategies

You can customize how errors are handled using the `handleErrors` parameter:

**Custom error message:**

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const responseFormat = toolStrategy(ProductRating, {

    handleError: "Please provide a valid rating between 1-5 and include a comment."

)

// Error message becomes:

// { role: "tool", content: "Please provide a valid rating between 1-5 and include a comment." }

```

**Handle specific exceptions only:**

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ToolInputParsingException } from "@langchain/core/tools";

const responseFormat = toolStrategy(ProductRating, {

    handleError: (error: ToolStrategyError) => {

        if (error instanceof ToolInputParsingException) {

        return "Please provide a valid rating between 1-5 and include a comment.";

        }

        return error.message;

    }

)

// Only validation errors get retried with default message:

// { role: "tool", content: "Error: Failed to parse structured output for tool 'ProductRating': ...\n Please fix your mistakes." }

```

**Handle multiple exception types:**

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const responseFormat = toolStrategy(ProductRating, {

    handleError: (error: ToolStrategyError) => {

        if (error instanceof ToolInputParsingException) {

        return "Please provide a valid rating between 1-5 and include a comment.";

        }

        if (error instanceof CustomUserError) {

        return "This is a custom user error.";

        }

        return error.message;

    }

)

```

**No error handling:**

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const responseFormat = toolStrategy(ProductRating, {

    handleError: false  // All errors raised

)

```

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/structured-output.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/structured-output.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Overview

> Control and customize agent execution at every step

Middleware provides a way to more tightly control what happens inside the agent. Middleware is useful for the following:

- Tracking agent behavior with logging, analytics, and debugging.
- Transforming prompts, [tool selection](/oss/javascript/langchain/middleware/built-in#llm-tool-selector), and output formatting.
- Adding [retries](/oss/javascript/langchain/middleware/built-in#tool-retry), [fallbacks](/oss/javascript/langchain/middleware/built-in#model-fallback), and early termination logic.
- Applying [rate limits](/oss/javascript/langchain/middleware/built-in#model-call-limit), guardrails, and [PII detection](/oss/javascript/langchain/middleware/built-in#pii-detection).

Add middleware by passing them to `createAgent`:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import {

  createAgent,

  summarizationMiddleware,

  humanInTheLoopMiddleware,

} from "langchain";

const agent = createAgent({

  model: "gpt-5.4",

  tools: [...],

  middleware: [summarizationMiddleware, humanInTheLoopMiddleware],

});

```

## The agent loop

The core agent loop involves calling a model, letting it choose tools to execute, and then finishing when it calls no more tools:

<img src="[https://mintcdn.com/langchain-5e9cc07a/Tazq8zGc0yYUYrDl/oss/images/core_agent_loop.png?fit=max&auto=format&n=Tazq8zGc0yYUYrDl&q=85&s=ac72e48317a9ced68fd1be64e89ec063](https://mintcdn.com/langchain-5e9cc07a/Tazq8zGc0yYUYrDl/oss/images/core_agent_loop.png?fit=max&auto=format&n=Tazq8zGc0yYUYrDl&q=85&s=ac72e48317a9ced68fd1be64e89ec063)" alt="Core agent loop diagram" style={{height: "200px", width: "auto", justifyContent: "center"}} className="rounded-lg block mx-auto" width="300" height="268" data-path="oss/images/core_agent_loop.png" />

Middleware exposes hooks before and after each of those steps:

<img src="[https://mintcdn.com/langchain-5e9cc07a/RAP6mjwE5G00xYsA/oss/images/middleware_final.png?fit=max&auto=format&n=RAP6mjwE5G00xYsA&q=85&s=eb4404b137edec6f6f0c8ccb8323eaf1](https://mintcdn.com/langchain-5e9cc07a/RAP6mjwE5G00xYsA/oss/images/middleware_final.png?fit=max&auto=format&n=RAP6mjwE5G00xYsA&q=85&s=eb4404b137edec6f6f0c8ccb8323eaf1)" alt="Middleware flow diagram" style={{height: "300px", width: "auto", justifyContent: "center"}} className="rounded-lg mx-auto" width="500" height="560" data-path="oss/images/middleware_final.png" />

## Additional resources

```
Explore built-in middleware for common use cases.
```

```
Build your own middleware with hooks and decorators.
```

```
Complete API reference for middleware.
```

```
Provider-specific middleware for Anthropic, AWS, OpenAI, and more.
```

```
Test your agents with LangSmith.
```

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/middleware/overview.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/middleware/overview.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
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

- Long-running conversations that exceed context windows.
- Multi-turn dialogues with extensive history.
- Applications where preserving full conversation context matters.

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

```
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

```





```

Model for generating summaries. Can be a model identifier string (e.g., `'openai:gpt-5.4-mini'`) or a `BaseChatModel` instance.

```





```

Conditions for triggering summarization. Can be:

- A single condition object (all properties must be met - AND logic)
- An array of condition objects (any condition must be met - OR logic)

Each condition can include:

- `fraction` (number): Fraction of model's context size (0-1)
- `tokens` (number): Absolute token count
- `messages` (number): Message count

At least one property must be specified per condition. If not provided, summarization will not trigger automatically.

```





```

How much context to preserve after summarization. Specify exactly one of:

- `fraction` (number): Fraction of model's context size to keep (0-1)
- `tokens` (number): Absolute token count to keep
- `messages` (number): Number of recent messages to keep

```





```

Custom token counting function. Defaults to character-based counting.

```





```

Custom prompt template for summarization. Uses built-in template if not specified. The template should include `{messages}` placeholder where conversation history will be inserted.

```





```

Maximum number of tokens to include when generating the summary. Messages will be trimmed to fit this limit before summarization.

```





```

Prefix to add to the summary message. If not provided, a default prefix is used.

```





```

**Deprecated:** Use `trigger: { tokens: value }` instead. Token threshold for triggering summarization.

```





```

**Deprecated:** Use `keep: { messages: value }` instead. Recent messages to preserve.

```







  The summarization middleware monitors message token counts and automatically summarizes older messages when thresholds are reached.

  **Trigger conditions** control when summarization runs:

- Single condition object (specified must be met)
- Array of conditions (any condition must be met - OR logic)
- Each condition can use `fraction` (of model's context size), `tokens` (absolute count), or `messages` (message count)

  **Keep condition** control how much context to preserve (specify exactly one):

- `fraction` - Fraction of model's context size to keep
- `tokens` - Absolute token count to keep
- `messages` - Number of recent messages to keep



### Human-in-the-loop

Pause agent execution for human approval, editing, or rejection of tool calls before they execute. [Human-in-the-loop](/oss/javascript/langchain/human-in-the-loop) is useful for the following:

- High-stakes operations requiring human approval (e.g. database writes, financial transactions).
- Compliance workflows where human oversight is mandatory.
- Long-running conversations where human feedback guides the agent.



  Human-in-the-loop middleware requires a [checkpointer](/oss/javascript/langgraph/persistence#checkpoints) to maintain state across interruptions.



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

  For complete examples, configuration options, and integration patterns, see the [Human-in-the-loop documentation](/oss/javascript/langchain/human-in-the-loop).

  Watch this [video guide]([https://www.youtube.com/watch?v=tdOeUVERukA](https://www.youtube.com/watch?v=tdOeUVERukA)) demonstrating Human-in-the-loop middleware behavior.

### Model call limit

Limit the number of model calls to prevent infinite loops or excessive costs. Model call limit is useful for the following:

- Preventing runaway agents from making too many API calls.
- Enforcing cost controls on production deployments.
- Testing agent behavior within specific call budgets.

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

  Watch this [video guide]([https://www.youtube.com/watch?v=x5jLQTFXR0Y](https://www.youtube.com/watch?v=x5jLQTFXR0Y)) demonstrating Model Call Limit middleware behavior.

```
Maximum model calls across all runs in a thread. Defaults to no limit.
```

```
Maximum model calls per single invocation. Defaults to no limit.
```

```
Behavior when limit is reached. Options: `'end'` (graceful termination) or `'error'` (throw exception)
```

### Tool call limit

Control agent execution by limiting the number of tool calls, either globally across all tools or for specific tools. Tool call limits are useful for the following:

- Preventing excessive calls to expensive external APIs.
- Limiting web searches or database queries.
- Enforcing rate limits on specific tool usage.
- Protecting against runaway agent loops.

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

  Watch this [video guide]([https://www.youtube.com/watch?v=oL6am5UqODY](https://www.youtube.com/watch?v=oL6am5UqODY)) demonstrating Tool Call Limit middleware behavior.

```
Name of specific tool to limit. If not provided, limits apply to **all tools globally**.
```

```
Maximum tool calls across all runs in a thread (conversation). Persists across multiple invocations with the same thread ID. Requires a checkpointer to maintain state. `undefined` means no thread limit.
```

```
Maximum tool calls per single invocation (one user message → response cycle). Resets with each new user message. `undefined` means no run limit.

**Note:** At least one of `threadLimit` or `runLimit` must be specified.
```

```
Behavior when limit is reached:

* `'continue'` (default) - Block exceeded tool calls with error messages, let other tools and the model continue. The model decides when to end based on the error messages.

* `'error'` - Throw a `ToolCallLimitExceededError` exception, stopping execution immediately

* `'end'` - Stop execution immediately with a ToolMessage and AI message for the exceeded tool call. Only works when limiting a single tool; throws error if other tools have pending calls.
```

  Specify limits with:

- **Thread limit** - Max calls across all runs in a conversation (requires checkpointer)
- **Run limit** - Max calls per single invocation (resets each turn)
  Exit behaviors:
- `'continue'` (default) - Block exceeded calls with error messages, agent continues
- `'error'` - Raise exception immediately
- `'end'` - Stop with ToolMessage + AI message (single-tool scenarios only)

### Model fallback

Automatically fallback to alternative models when the primary model fails. Model fallback is useful for the following:

- Building resilient agents that handle model outages.
- Cost optimization by falling back to cheaper models.
- Provider redundancy across OpenAI, Anthropic, etc.

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

  The middleware accepts a variable number of string arguments representing fallback models in order:

```
One or more fallback model strings to try in order when the primary model fails

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

modelFallbackMiddleware(

  "first-fallback-model",

  "second-fallback-model",

  // ... more models

)

```

```





### PII detection

Detect and handle Personally Identifiable Information (PII) in conversations using configurable strategies. PII detection is useful for the following:

- Healthcare and financial applications with compliance requirements.
- Customer service agents that need to sanitize logs.
- Any application handling sensitive user data.

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

  For custom detectors:

- Use regex strings for simple patterns
- Use RegExp objects when you need flags (e.g., case-insensitive matching)
- Use custom functions when you need validation logic beyond pattern matching
- Custom functions give you full control over detection logic and can implement complex validation rules

```
Type of PII to detect. Can be a built-in type `email`, `credit_card`, `ip`, `mac_address`, `url`) or a custom type name.
```

```
How to handle detected PII. Options:

* `'block'` - Throw error when detected

* `'redact'` - Replace with `[REDACTED_TYPE]`

 **`'mask'` *- Partially mask (e.g.,* `***-****-****-1234`)

* `'hash'` - Replace with deterministic hash (e.g., `<email_hash:a1b2c3d4>`)
```

```
Custom detector. Can be:

* `RegExp` - Regex pattern for matching

* `string` - Regex pattern string (e.g., `"sk-[a-zA-Z0-9]{32}"`)

* `function` - Custom detector function `(content: string) => PIIMatch[]`

If not provided, uses built-in detector for the PII type.
```

```
Check user messages before model call
```

```
Check AI messages after model call
```

```
Check tool result messages after execution
```

### To-do list

Equip agents with task planning and tracking capabilities for complex multi-step tasks. To-do lists are useful for the following:

- Complex multi-step tasks requiring coordination across multiple tools.
- Long-running operations where progress visibility is important.
  This middleware automatically provides agents with a `write_todos` tool and system prompts to guide effective task planning.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { createAgent, todoListMiddleware } from "langchain";

const agent = createAgent({

  model: "gpt-5.4",

  tools: [readFile, writeFile, runTests],

  middleware: [todoListMiddleware()],

});

```

  Watch this [video guide]([https://www.youtube.com/watch?v=dwvhZ1z_Pas](https://www.youtube.com/watch?v=dwvhZ1z_Pas)) demonstrating To-do List middleware behavior.

  No configuration options available (uses defaults).

### LLM tool selector

Use an LLM to intelligently select relevant tools before calling the main model. LLM tool selectors are useful for the following:

- Agents with many tools (10+) where most aren't relevant per query.
- Reducing token usage by filtering irrelevant tools.
- Improving model focus and accuracy.

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

```
Model for tool selection. Can be a model identifier string (e.g., `'openai:gpt-5.4-mini'`) or a `BaseChatModel` instance. Defaults to the agent's main model.
```

```
Instructions for the selection model. Uses built-in prompt if not specified.
```

```
Maximum number of tools to select. If the model selects more, only the first maxTools will be used. No limit if not specified.
```

```
Tool names to always include regardless of selection. These do not count against the maxTools limit.
```

### Tool retry

Automatically retry failed tool calls with configurable exponential backoff. Tool retry is useful for the following:

- Handling transient failures in external API calls.
- Improving reliability of network-dependent tools.
- Building resilient agents that gracefully handle temporary errors.

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

```
Maximum number of retry attempts after the initial call (3 total attempts with default). Must be >= 0.
```

```
Optional array of tools or tool names to apply retry logic to. Can be a list of `BaseTool` instances or tool name strings. If `undefined`, applies to all tools.
```

```
Either an array of error constructors to retry on, or a function that takes an error and returns `true` if it should be retried. Default is to retry on all errors.
```

```
Behavior when all retries are exhausted. Options:

* `'continue'` (default) - Return a `ToolMessage` with error details, allowing the LLM to handle the failure and potentially recover

* `'error'` - Re-raise the exception, stopping agent execution

* Custom function - Function that takes the exception and returns a string for the `ToolMessage` content, allowing custom error formatting

**Deprecated values:** `'raise'` (use `'error'` instead) and `'return_message'` (use `'continue'` instead). These deprecated values still work but will show a warning.
```

```
Multiplier for exponential backoff. Each retry waits `initialDelayMs  (backoffFactor * retryNumber)` milliseconds. Set to `0.0` for constant delay. Must be >= 0.
```

```
Initial delay in milliseconds before first retry. Must be >= 0.
```

```
Maximum delay in milliseconds between retries (caps exponential backoff growth). Must be >= 0.
```

```
Whether to add random jitter `±25%`) to delay to avoid thundering herd
```

  The middleware automatically retries failed tool calls with exponential backoff.

  **Key configuration:**

- `maxRetries` - Number of retry attempts (default: 2)
- `backoffFactor` - Multiplier for exponential backoff (default: 2.0)
- `initialDelayMs` - Starting delay in milliseconds (default: 1000ms)
- `maxDelayMs` - Cap on delay growth (default: 60000ms)
- `jitter` - Add random variation (default: true)
  **Failure handling:**
- `onFailure: "continue"` (default) - Return error message
- `onFailure: "error"` - Re-raise exception
- Custom function - Function returning error message

### Model retry

Automatically retry failed model calls with configurable exponential backoff. Model retry is useful for the following:

- Handling transient failures in model API calls.
- Improving reliability of network-dependent model requests.
- Building resilient agents that gracefully handle temporary model errors.

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

```
Maximum number of retry attempts after the initial call (3 total attempts with default). Must be >= 0.
```

```
Either an array of error constructors to retry on, or a function that takes an error and returns `true` if it should be retried. Default is to retry on all errors.
```

```
Behavior when all retries are exhausted. Options:

* `'continue'` (default) - Return an `AIMessage` with error details, allowing the agent to potentially handle the failure gracefully

* `'error'` - Re-raise the exception, stopping agent execution

* Custom function - Function that takes the exception and returns a string for the `AIMessage` content, allowing custom error formatting
```

```
Multiplier for exponential backoff. Each retry waits `initialDelayMs  (backoffFactor * retryNumber)` milliseconds. Set to `0.0` for constant delay. Must be >= 0.
```

```
Initial delay in milliseconds before first retry. Must be >= 0.
```

```
Maximum delay in milliseconds between retries (caps exponential backoff growth). Must be >= 0.
```

```
Whether to add random jitter `±25%`) to delay to avoid thundering herd
```

  The middleware automatically retries failed model calls with exponential backoff.

### LLM tool emulator

Emulate tool execution using an LLM for testing purposes, replacing actual tool calls with AI-generated responses. LLM tool emulators are useful for the following:

- Testing agent behavior without executing real tools.
- Developing agents when external tools are unavailable or expensive.
- Prototyping agent workflows before implementing actual tools.

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

```
List of tool names (string) or tool instances to emulate. If `undefined` (default), ALL tools will be emulated. If empty array `[]`, no tools will be emulated. If array with tool names/instances, only those tools will be emulated.
```

```
Model to use for generating emulated tool responses. Can be a model identifier string (e.g., `'google_genai:gemini-3.1-pro-preview'`) or a `BaseChatModel` instance. Defaults to the agent's model if not specified.
```

  The middleware uses an LLM to generate plausible responses for tool calls instead of executing the actual tools.

### Context editing

Manage conversation context by clearing older tool call outputs when token limits are reached, while preserving recent results. This helps keep context windows manageable in long conversations with many tool calls. Context editing is useful for the following:

- Long conversations with many tool calls that exceed token limits
- Reducing token costs by removing older tool outputs that are no longer relevant
- Maintaining only the most recent N tool results in context

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

```
Array of `ContextEdit`]([https://reference.langchain.com/javascript/langchain/index/ContextEdit](https://reference.langchain.com/javascript/langchain/index/ContextEdit)) strategies to apply
```

  `**ClearToolUsesEdit`]([https://reference.langchain.com/javascript/langchain/index/ClearToolUsesEdit](https://reference.langchain.com/javascript/langchain/index/ClearToolUsesEdit)) options:**

```
Token count that triggers the edit. When the conversation exceeds this token count, older tool outputs will be cleared.
```

```
Minimum number of tokens to reclaim when the edit runs. If set to 0, clears as much as needed.
```

```
Number of most recent tool results that must be preserved. These will never be cleared.
```

```
Whether to clear the originating tool call parameters on the AI message. When `true`, tool call arguments are replaced with empty objects.
```

```
List of tool names to exclude from clearing. These tools will never have their outputs cleared.
```

```
Placeholder text inserted for cleared tool outputs. This replaces the original tool message content.
```

  The middleware applies context editing strategies when token limits are reached. The most common strategy is `ClearToolUsesEdit`, which clears older tool results while preserving recent ones.

  **How it works:**

1. Monitor token count in conversation
2. When threshold is reached, clear older tool outputs
3. Keep most recent N tool results
4. Optionally preserve tool call arguments for context

### Filesystem middleware

Context engineering is a main challenge in building effective agents. This is particularly difficult when using tools that return variable-length results (for example, `web_search` and RAG), as long tool results can quickly fill your context window.

`FilesystemMiddleware` from [Deep Agents](/oss/javascript/deepagents/overview) provides four tools for interacting with both short-term and long-term memory:

- `ls`: List the files in the filesystem
- `read_file`: Read an entire file or a certain number of lines from a file
- `write_file`: Write a new file to the filesystem
- `edit_file`: Edit an existing file in the filesystem

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

```
Prompt caching, bash tool, text editor, memory, and file search middleware for Claude models.
```

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/middleware/built-in.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langchain/middleware/built-in.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```