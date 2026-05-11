# LangGraph

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# LangGraph overview

> Gain control with LangGraph to design agents that reliably handle complex tasks

Trusted by companies shaping the future of agents-- including Klarna, Uber, J.P. Morgan, and more-- LangGraph is a low-level orchestration framework and runtime for building, managing, and deploying long-running, stateful agents.

LangGraph is very low-level, and focused entirely on agent **orchestration**. Before using LangGraph, we recommend you familiarize yourself with some of the components used to build agents, starting with [models](/oss/javascript/langchain/models) and [tools](/oss/javascript/langchain/tools).

We will commonly use [LangChain](/oss/javascript/langchain/overview) components throughout the documentation to integrate models and tools, but you don't need to use LangChain to use LangGraph. If you are just getting started with agents or want a higher-level abstraction, we recommend you use LangChain's [agents](/oss/javascript/langchain/agents) that provide prebuilt architectures for common LLM and tool-calling loops.

LangGraph is focused on the underlying capabilities important for agent orchestration: durable execution, streaming, human-in-the-loop, and more.

## Install

Then, create a simple hello world example:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { StateSchema, MessagesValue, GraphNode, StateGraph, START, END } from "@langchain/langgraph";

const State = new StateSchema({

  messages: MessagesValue,

});

const mockLlm: GraphNode<typeof State> = (state) => {

  return { messages: [{ role: "ai", content: "hello world" }] };

};

const graph = new StateGraph(State)

  .addNode("mock_llm", mockLlm)

  .addEdge(START, "mock_llm")

  .addEdge("mock_llm", END)

  .compile();

await graph.invoke({ messages: [{ role: "user", content: "hi!" }] });

```

  Use [LangSmith](/langsmith/home) to trace requests, debug agent behavior, and evaluate outputs. Set `LANGSMITH_TRACING=true` and your API key to get started.

## Core benefits

LangGraph provides low-level supporting infrastructure for *any* long-running, stateful workflow or agent. LangGraph does not abstract prompts or architecture, and provides the following central benefits:

- [Durable execution](/oss/javascript/langgraph/durable-execution): Build agents that persist through failures and can run for extended periods, resuming from where they left off.
- [Human-in-the-loop](/oss/javascript/langgraph/interrupts): Incorporate human oversight by inspecting and modifying agent state at any point.
- [Comprehensive memory](/oss/javascript/concepts/memory): Create stateful agents with both short-term working memory for ongoing reasoning and long-term memory across sessions.
- [Debugging with LangSmith](/langsmith/home): Gain deep visibility into complex agent behavior with visualization tools that trace execution paths, capture state transitions, and provide detailed runtime metrics.
- [Production-ready deployment](/langsmith/deployment): Deploy sophisticated agent systems confidently with scalable infrastructure designed to handle the unique challenges of stateful, long-running workflows.

## LangGraph ecosystem

While LangGraph can be used standalone, it also integrates seamlessly with any LangChain product, giving developers a full suite of tools for building agents. To improve your LLM application development, pair LangGraph with:

```
Trace requests, evaluate outputs, and monitor deployments in one place. Prototype locally with LangGraph, then move to production with integrated observability and evaluation to build more reliable agent systems.
```

```
Deploy and scale agents effortlessly with a purpose-built deployment platform for long running, stateful workflows. Discover, reuse, configure, and share agents across teams — and iterate quickly with visual prototyping in Studio.
```

```
Provides integrations and composable components to streamline LLM application development. Contains agent abstractions built on top of LangGraph.
```

## Acknowledgements

LangGraph is inspired by [Pregel]([https://research.google/pubs/pub37252/](https://research.google/pubs/pub37252/)) and [Apache Beam]([https://beam.apache.org/](https://beam.apache.org/)). The public interface draws inspiration from [NetworkX]([https://networkx.org/documentation/latest/](https://networkx.org/documentation/latest/)). LangGraph is built by LangChain Inc, the creators of LangChain, but can be used without LangChain.

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langgraph/overview.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langgraph/overview.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Quickstart

This quickstart demonstrates how to build a calculator agent using the LangGraph Graph API or the Functional API.

  **Using an AI coding assistant?**

- Install the [LangChain Docs MCP server](/use-these-docs) to give your agent access to up-to-date LangChain documentation and examples.
- Install [LangChain Skills]([https://github.com/langchain-ai/langchain-skills](https://github.com/langchain-ai/langchain-skills)) to improve your agent's performance on LangChain ecosystem tasks.
- [Use the Graph API](#use-the-graph-api) if you prefer to define your agent as a graph of nodes and edges.
- [Use the Functional API](#use-the-functional-api) if you prefer to define your agent as a single function.

For conceptual information, see [Graph API overview](/oss/javascript/langgraph/graph-api) and [Functional API overview](/oss/javascript/langgraph/functional-api).

  For this example, you will need to set up a [Claude (Anthropic)]([https://www.anthropic.com/](https://www.anthropic.com/)) account and get an API key. Then, set the `ANTHROPIC_API_KEY` environment variable in your terminal.

```
## 1. Define tools and model

In this example, we'll use the Claude Sonnet 4.5 model and define tools for addition, multiplication, and division.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ChatAnthropic } from "@langchain/anthropic";

import { tool } from "@langchain/core/tools";

import * as z from "zod";

const model = new ChatAnthropic({

  model: "claude-sonnet-4-6",

  temperature: 0,

});

// Define tools

const add = tool(({ a, b }) => a + b, {

  name: "add",

  description: "Add two numbers",

  schema: z.object({

    a: z.number().describe("First number"),

    b: z.number().describe("Second number"),

  }),

});

const multiply = tool(({ a, b }) => a * b, {

  name: "multiply",

  description: "Multiply two numbers",

  schema: z.object({

    a: z.number().describe("First number"),

    b: z.number().describe("Second number"),

  }),

});

const divide = tool(({ a, b }) => a / b, {

  name: "divide",

  description: "Divide two numbers",

  schema: z.object({

    a: z.number().describe("First number"),

    b: z.number().describe("Second number"),

  }),

});

// Augment the LLM with tools

const toolsByName = {

  [[add.name](http://add.name)]: add,

  [[multiply.name](http://multiply.name)]: multiply,

  [[divide.name](http://divide.name)]: divide,

};

const tools = Object.values(toolsByName);

const modelWithTools = model.bindTools(tools);

```

## 2. Define state

The graph's state is used to store the messages and the number of LLM calls.

  State in LangGraph persists throughout the agent's execution.

  The `MessagesValue` provides a built-in reducer for appending messages. The `llmCalls` field uses a `ReducedValue` with `(x, y) => x + y` to accumulate the count.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import {

  StateGraph,

  StateSchema,

  MessagesValue,

  ReducedValue,

  GraphNode,

  ConditionalEdgeRouter,

  START,

  END,

} from "@langchain/langgraph";

import { z } from "zod/v4";

const MessagesState = new StateSchema({

  messages: MessagesValue,

  llmCalls: new ReducedValue(

    z.number().default(0),

    { reducer: (x, y) => x + y }

  ),

});

```

## 3. Define model node

The model node is used to call the LLM and decide whether to call a tool or not.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { SystemMessage } from "@langchain/core/messages";

const llmCall: GraphNode<typeof MessagesState> = async (state) => {

  const response = await modelWithTools.invoke([

    new SystemMessage(

      "You are a helpful assistant tasked with performing arithmetic on a set of inputs."

    ),

    ...state.messages,

  ]);

  return {

    messages: [response],

    llmCalls: 1,

  };

};

```

## 4. Define tool node

The tool node is used to call the tools and return the results.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { AIMessage, ToolMessage } from "@langchain/core/messages";

const toolNode: GraphNode<typeof MessagesState> = async (state) => {

  const lastMessage = [state.messages.at](http://state.messages.at)(-1);

  if (lastMessage == null || !AIMessage.isInstance(lastMessage)) {

    return { messages: [] };

  }

  const result: ToolMessage[] = [];

  for (const toolCall of lastMessage.tool_calls ?? []) {

    const tool = toolsByName[[toolCall.name](http://toolCall.name)];

    const observation = await tool.invoke(toolCall);

    result.push(observation);

  }

  return { messages: result };

};

```

## 5. Define end logic

The conditional edge function is used to route to the tool node or end based upon whether the LLM made a tool call.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const shouldContinue: ConditionalEdgeRouter<typeof MessagesState, "toolNode"> = (state) => {

  const lastMessage = [state.messages.at](http://state.messages.at)(-1);

  // Check if it's an AIMessage before accessing tool_calls

  if (!lastMessage || !AIMessage.isInstance(lastMessage)) {

    return END;

  }

  // If the LLM makes a tool call, then perform an action

  if (lastMessage.tool_calls?.length) {

    return "toolNode";

  }

  // Otherwise, we stop (reply to the user)

  return END;

};

```

## 6. Build and compile the agent

The agent is built using the `StateGraph`]([https://reference.langchain.com/javascript/langchain-langgraph/index/StateGraph](https://reference.langchain.com/javascript/langchain-langgraph/index/StateGraph)) class and compiled using the `compile`]([https://reference.langchain.com/javascript/classes/_langchain_langgraph.index.StateGraph.html#compile](https://reference.langchain.com/javascript/classes/_langchain_langgraph.index.StateGraph.html#compile)) method.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

const agent = new StateGraph(MessagesState)

  .addNode("llmCall", llmCall)

  .addNode("toolNode", toolNode)

  .addEdge(START, "llmCall")

  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])

  .addEdge("toolNode", "llmCall")

  .compile();

// Invoke

import { HumanMessage } from "@langchain/core/messages";

const result = await agent.invoke({

  messages: [new HumanMessage("Add 3 and 4.")],

});

for (const message of result.messages) {

  console.log`[${message.type}]: ${message.text}`);

}

```

  To learn how to trace your agent with LangSmith, see the [LangSmith documentation](/langsmith/trace-with-langgraph).

Congratulations! You've built your first agent using the LangGraph Graph API.

```

```

## 1. Define tools and model

In this example, we'll use the Claude Sonnet 4.5 model and define tools for addition, multiplication, and division.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ChatAnthropic } from "@langchain/anthropic";

import { tool } from "@langchain/core/tools";

import * as z from "zod";

const model = new ChatAnthropic({

  model: "claude-sonnet-4-6",

  temperature: 0,

});

// Define tools

const add = tool(({ a, b }) => a + b, {

  name: "add",

  description: "Add two numbers",

  schema: z.object({

    a: z.number().describe("First number"),

    b: z.number().describe("Second number"),

  }),

});

const multiply = tool(({ a, b }) => a * b, {

  name: "multiply",

  description: "Multiply two numbers",

  schema: z.object({

    a: z.number().describe("First number"),

    b: z.number().describe("Second number"),

  }),

});

const divide = tool(({ a, b }) => a / b, {

  name: "divide",

  description: "Divide two numbers",

  schema: z.object({

    a: z.number().describe("First number"),

    b: z.number().describe("Second number"),

  }),

});

// Augment the LLM with tools

const toolsByName = {

  [[add.name](http://add.name)]: add,

  [[multiply.name](http://multiply.name)]: multiply,

  [[divide.name](http://divide.name)]: divide,

};

const tools = Object.values(toolsByName);

const modelWithTools = model.bindTools(tools);

```

## 2. Define model node

The model node is used to call the LLM and decide whether to call a tool or not.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { task, entrypoint } from "@langchain/langgraph";

import { SystemMessage } from "@langchain/core/messages";

const callLlm = task({ name: "callLlm" }, async (messages: BaseMessage[]) => {

  return modelWithTools.invoke([

    new SystemMessage(

      "You are a helpful assistant tasked with performing arithmetic on a set of inputs."

    ),

    ...messages,

  ]);

});

```

## 3. Define tool node

The tool node is used to call the tools and return the results.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import type { ToolCall } from "@langchain/core/messages/tool";

const callTool = task({ name: "callTool" }, async (toolCall: ToolCall) => {

  const tool = toolsByName[[toolCall.name](http://toolCall.name)];

  return tool.invoke(toolCall);

});

```

## 4. Define agent

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { addMessages } from "@langchain/langgraph";

import { type BaseMessage } from "@langchain/core/messages";

const agent = entrypoint({ name: "agent" }, async (messages: BaseMessage[]) => {

  let modelResponse = await callLlm(messages);

  while (true) {

    if (!modelResponse.tool_calls?.length) {

      break;

    }

    // Execute tools

    const toolResults = await Promise.all(

      modelResponse.tool_[calls.map](http://calls.map)((toolCall) => callTool(toolCall))

    );

    messages = addMessages(messages, [modelResponse, ...toolResults]);

    modelResponse = await callLlm(messages);

  }

  return messages;

});

// Invoke

import { HumanMessage } from "@langchain/core/messages";

const result = await agent.invoke([new HumanMessage("Add 3 and 4.")]);

for (const message of result) {

  console.log`[${message.getType()}]: ${message.text}`);

}

```

  To learn how to trace your agent with LangSmith, see the [LangSmith documentation](/langsmith/trace-with-langgraph).

Congratulations! You've built your first agent using the LangGraph Functional API.

```

---

```

[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.

```

```

[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langgraph/quickstart.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langgraph/quickstart.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).

```

> ## Documentation Index

> Fetch the complete documentation index at: [https://docs.langchain.com/llms.txt](https://docs.langchain.com/llms.txt)

> Use this file to discover all available pages before exploring further.

# Streaming

LangGraph implements a streaming system to surface real-time updates. Streaming is crucial for enhancing the responsiveness of applications built on LLMs. By displaying output progressively, even before a complete response is ready, streaming significantly improves user experience (UX), particularly when dealing with the latency of LLMs.

## Get started

### Basic usage

LangGraph graphs expose the `stream`]([https://reference.langchain.com/javascript/classes/_langchain_langgraph.pregel.Pregel.html#stream](https://reference.langchain.com/javascript/classes/_langchain_langgraph.pregel.Pregel.html#stream)) method to yield streamed outputs as iterators.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

for await (const chunk of await [graph.stream](http://graph.stream)(inputs, {

  streamMode: "updates",

})) {

  console.log(chunk);

}

```

## Stream modes

Pass one or more of the following stream modes as a list to the `stream`]([https://reference.langchain.com/javascript/classes/_langchain_langgraph.index.CompiledStateGraph.html#stream](https://reference.langchain.com/javascript/classes/_langchain_langgraph.index.CompiledStateGraph.html#stream)) method:

| Mode                    | Description                                                                                    |

| :---------------------- | :--------------------------------------------------------------------------------------------- |

| [values](#graph-state)  | Full state after each step.                                                                    |

| [updates](#graph-state) | State updates after each step. Multiple updates in the same step are streamed separately.      |

| [messages](#llm-tokens) | 2-tuples of (LLM token, metadata) from LLM calls.                                              |

| [custom](#custom-data)  | Custom data emitted from nodes via the `writer` config parameter.                              |

| [tools](#tool-progress) | Tool-call lifecycle events `on_tool_start`, `on_tool_event`, `on_tool_end`, `on_tool_error`). |

| [debug](#debug)         | All available info throughout graph execution.                                                 |

### Graph state

Use the stream modes `updates` and `values` to stream the state of the graph as it executes.

 **`updates` *streams the* *updates** to the state after each step of the graph.

 **`values` *streams the* *full value** of the state after each step of the graph.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";

import { z } from "zod/v4";

const State = new StateSchema({

  topic: z.string(),

  joke: z.string(),

});

const graph = new StateGraph(State)

  .addNode("refineTopic", (state) => {

    return { topic: state.topic + " and cats" };

  })

  .addNode("generateJoke", (state) => {

    return { joke: `This is a joke about ${state.topic}` };

  })

  .addEdge(START, "refineTopic")

  .addEdge("refineTopic", "generateJoke")

  .addEdge("generateJoke", END)

  .compile();

```

```
Use this to stream only the **state updates** returned by the nodes after each step. The streamed outputs include the name of the node as well as the update.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

for await (const chunk of await [graph.stream](http://graph.stream)(

  { topic: "ice cream" },

  { streamMode: "updates" }

)) {

  for (const [nodeName, state] of Object.entries(chunk)) {

    console.log`Node ${nodeName} updated:`, state);

  }

}

```

```





```

Use this to stream the **full state** of the graph after each step.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

for await (const chunk of await [graph.stream](http://graph.stream)(

  { topic: "ice cream" },

  { streamMode: "values" }

)) {

  console.log`topic: ${chunk.topic}, joke: ${chunk.joke}`);

}

```

```





### LLM tokens

Use the `messages` streaming mode to stream Large Language Model (LLM) outputs **token by token** from any part of your graph, including nodes, tools, subgraphs, or tasks.

The streamed output from `messages` mode](#stream-modes) is a tuple `[message_chunk, metadata]` where:

- `message_chunk`: the token or message segment from the LLM.
- `metadata`: a dictionary containing details about the graph node and LLM invocation.

> If your LLM is not available as a LangChain integration, you can stream its outputs using `custom` mode instead. See [use with any LLM](#use-with-any-llm) for details.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ChatOpenAI } from "@langchain/openai";

import { StateGraph, StateSchema, GraphNode, START } from "@langchain/langgraph";

import * as z from "zod";

const MyState = new StateSchema({

  topic: z.string(),

  joke: z.string().default(""),

});

const model = new ChatOpenAI({ model: "gpt-5.4-mini" });

const callModel: GraphNode<typeof MyState> = async (state) => {

  // Call the LLM to generate a joke about a topic

  // Note that message events are emitted even when the LLM is run using .invoke rather than .stream

  const modelResponse = await model.invoke([

    { role: "user", content: `Generate a joke about ${state.topic}` },

  ]);

  return { joke: modelResponse.content };

};

const graph = new StateGraph(MyState)

  .addNode("callModel", callModel)

  .addEdge(START, "callModel")

  .compile();

// The "messages" stream mode returns an iterator of tuples [messageChunk, metadata]

// where messageChunk is the token streamed by the LLM and metadata is a dictionary

// with information about the graph node where the LLM was called and other information

for await (const [messageChunk, metadata] of await [graph.stream](http://graph.stream)(

  { topic: "ice cream" },

  { streamMode: "messages" }

)) {

  if (messageChunk.content) {

    console.log(messageChunk.content + "|");

  }

}

```

#### Filter by LLM invocation

You can associate `tags` with LLM invocations to filter the streamed tokens by LLM invocation.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ChatOpenAI } from "@langchain/openai";

// model1 is tagged with "joke"

const model1 = new ChatOpenAI({

  model: "gpt-5.4-mini",

  tags: ['joke']

});

// model2 is tagged with "poem"

const model2 = new ChatOpenAI({

  model: "gpt-5.4-mini",

  tags: ['poem']

});

const graph = // ... define a graph that uses these LLMs

// The streamMode is set to "messages" to stream LLM tokens

// The metadata contains information about the LLM invocation, including the tags

for await (const [msg, metadata] of await [graph.stream](http://graph.stream)(

  { topic: "cats" },

  { streamMode: "messages" }

)) {

  // Filter the streamed tokens by the tags field in the metadata to only include

  // the tokens from the LLM invocation with the "joke" tag

  if (metadata.tags?.includes("joke")) {

    console.log(msg.content + "|");

  }

}

```

#### Omit messages from the stream

Use the `nostream` tag to exclude LLM output from the stream entirely. Invocations tagged with `nostream` still run and produce output; their tokens are simply not emitted in `messages` mode.

This is useful when:

- You need LLM output for internal processing (for example structured output) but do not want to stream it to the client
- You stream the same content through a different channel (for example custom UI messages) and want to avoid duplicate output in the `messages` stream

```ts theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ChatAnthropic } from "@langchain/anthropic";

import { StateGraph, StateSchema, START } from "@langchain/langgraph";

import * as z from "zod";

const streamModel = new ChatAnthropic({ model: "claude-haiku-4-5-20251001" });

const internalModel = new ChatAnthropic({

  model: "claude-haiku-4-5-20251001",

}).withConfig({

  tags: ["nostream"],

});

const State = new StateSchema({

  topic: z.string(),

  answer: z.string().optional(),

  notes: z.string().optional(),

});

const writeAnswer = async (state: typeof State.State) => {

  const r = await streamModel.invoke([

    { role: "user", content: `Reply briefly about ${state.topic}` },

  ]);

  return { answer: r.content };

};

const internalNotes = async (state: typeof State.State) => {

  // Tokens from this model are omitted from streamMode: "messages" because of nostream

  const r = await internalModel.invoke([

    { role: "user", content: `Private notes on ${state.topic}` },

  ]);

  return { notes: r.content };

};

const graph = new StateGraph(State)

  .addNode("writeAnswer", writeAnswer)

  .addNode("internal_notes", internalNotes)

  .addEdge(START, "writeAnswer")

  .addEdge("writeAnswer", "internal_notes")

  .compile();

const stream = await [graph.stream](http://graph.stream)({ topic: "AI" }, { streamMode: "messages" });

```

#### Filter by node

To stream tokens only from specific nodes, use `stream_mode="messages"` and filter the outputs by the `langgraph_node` field in the streamed metadata:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

// The "messages" stream mode returns a tuple of [messageChunk, metadata]

// where messageChunk is the token streamed by the LLM and metadata is a dictionary

// with information about the graph node where the LLM was called and other information

for await (const [msg, metadata] of await [graph.stream](http://graph.stream)(

  inputs,

  { streamMode: "messages" }

)) {

  // Filter the streamed tokens by the langgraph_node field in the metadata

  // to only include the tokens from the specified node

  if (msg.content && metadata.langgraph_node === "some_node_name") {

    // ...

  }

}

```

### Custom data

To send **custom user-defined data** from inside a LangGraph node or tool, follow these steps:

1. Use the `writer` parameter from the `LangGraphRunnableConfig` to emit custom data.
2. Set `streamMode: "custom"` when calling `.stream()` to get the custom data in the stream. You can combine multiple modes (e.g., `["updates", "custom"]`), but at least one must be `"custom"`.

```
```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { StateGraph, StateSchema, GraphNode, START, LangGraphRunnableConfig } from "@langchain/langgraph";

import * as z from "zod";

const State = new StateSchema({

  query: z.string(),

  answer: z.string(),

});

const node: GraphNode<typeof State> = async (state, config) => {

  // Use the writer to emit a custom key-value pair (e.g., progress update)

  config.writer({ custom_key: "Generating custom data inside node" });

  return { answer: "some data" };

};

const graph = new StateGraph(State)

  .addNode("node", node)

  .addEdge(START, "node")

  .compile();

const inputs = { query: "example" };

// Set streamMode: "custom" to receive the custom data in the stream

for await (const chunk of await [graph.stream](http://graph.stream)(inputs, { streamMode: "custom" })) {

  console.log(chunk);

}

```

```





```

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { tool } from "@langchain/core/tools";

import { LangGraphRunnableConfig } from "@langchain/langgraph";

import * as z from "zod";

const queryDatabase = tool(

  async (input, config: LangGraphRunnableConfig) => {

    // Use the writer to emit a custom key-value pair (e.g., progress update)

    config.writer({ data: "Retrieved 0/100 records", type: "progress" });

    // perform query

    // Emit another custom key-value pair

    config.writer({ data: "Retrieved 100/100 records", type: "progress" });

    return "some-answer";

  },

  {

    name: "query_database",

    description: "Query the database.",

    schema: z.object({

      query: z.string().describe("The query to execute."),

    }),

  }

);

const graph = // ... define a graph that uses this tool

// Set streamMode: "custom" to receive the custom data in the stream

for await (const chunk of await [graph.stream](http://graph.stream)(inputs, { streamMode: "custom" })) {

  console.log(chunk);

}

```

```





### Tool progress

Use the `tools` stream mode to receive real-time lifecycle events for tool executions. This is useful for showing progress indicators, partial results, and error states in your UI while tools are running.

The `tools` stream mode emits four event types:

| Event           | When                          | Payload                        |

| --------------- | ----------------------------- | ------------------------------ |

| `on_tool_start` | Tool invocation begins        | `name`, `input`, `toolCallId`  |

| `on_tool_event` | Tool yields intermediate data | `name`, `data`, `toolCallId`   |

| `on_tool_end`   | Tool returns its final result | `name`, `output`, `toolCallId` |

| `on_tool_error` | Tool throws an error          | `name`, `error`, `toolCallId`  |

#### Define tools that stream progress

To emit `on_tool_event` events, define your tool function as an **async generator** `async function`*). Each `yield` sends intermediate data to the stream, and the `return` value is used as the tool's final result.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { tool } from "@langchain/core/tools";

import { z } from "zod/v4";

const searchFlights = tool(

  async function* (input) {

    const airlines = ["United", "Delta", "American", "JetBlue"];

    const completed: string[] = [];

    for (let i = 0; i < airlines.length; i++) {

      await new Promise((r) => setTimeout(r, 500));

      completed.push(airlines[i]);

      // Each yield emits an on_tool_event to the stream

      yield {

        message: `Searching ${airlines[i]}...`,

        progress: (i + 1) / airlines.length,

        completed,

      };

    }

    // The return value becomes the tool result (ToolMessage.content)

    return JSON.stringify({

      flights: [

        { airline: "United", price: 450, duration: "5h 30m" },

        { airline: "Delta", price: 520, duration: "5h 15m" },

      ],

    });

  },

  {

    name: "search_flights",

    description: "Search for available flights to a destination.",

    schema: z.object({

      destination: z.string(),

      date: z.string(),

    }),

  }

);

```

  Existing tools that return a `Promise` are fully compatible. They emit `on_tool_start` and `on_tool_end` events but no `on_tool_event` events.

#### Consume tool events server-side

Pass `streamMode: ["tools"]` (or combine with other modes) to `graph.stream()`:

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

for await (const [mode, chunk] of await [graph.stream](http://graph.stream)(

  { messages: [{ role: "user", content: "Find flights to Tokyo" }] },

  { streamMode: ["updates", "tools"] }

)) {

  if (mode === "tools") {

    switch (chunk.event) {

      case "on_tool_start":

        console.log`Tool started: ${chunk.name}`, chunk.input);

        break;

      case "on_tool_event":

        console.log`Tool progress: ${chunk.name}`, [chunk.data](http://chunk.data));

        break;

      case "on_tool_end":

        console.log`Tool finished: ${chunk.name}`, chunk.output);

        break;

      case "on_tool_error":

        console.error`Tool failed: ${chunk.name}`, chunk.error);

        break;

    }

  }

}

```

#### Use tool progress in React with `useStream`

The `useStream` hook from `@langchain/langgraph-sdk/react` exposes a `toolProgress` array when you include `"tools"` in your stream modes. Each entry is a `ToolProgress` object that tracks the current state of a running tool:

| Field        | Description                                                                     |

| ------------ | ------------------------------------------------------------------------------- |

| `name`       | The tool name                                                                   |

| `state`      | Current lifecycle state: `"starting"`, `"running"`, `"completed"`, or `"error"` |

| `toolCallId` | The tool call ID from the LLM                                                   |

| `input`      | The tool's input arguments                                                      |

| `data`       | The most recent yielded data from `on_tool_event`                               |

| `result`     | The final result, set on `on_tool_end`                                          |

| `error`      | The error, set on `on_tool_error`                                               |

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { useStream } from "@langchain/langgraph-sdk/react";

function Chat() {

  const stream = useStream({

    assistantId: "my-agent",

    streamMode: ["values", "tools"],

  });

  // Filter for actively running tools

  const activeTools = stream.toolProgress.filter(

    (t) => t.state === "starting" || t.state === "running"

  );

  return (

    <div>

      {[stream.messages.map](http://stream.messages.map)((msg) => (

        <MessageBubble key={[msg.id](http://msg.id)} message={msg} />

      ))}

      {/* Show progress cards for running tools */}

      {[activeTools.map](http://activeTools.map)((tool) => (

        <ToolProgressCard

          key={tool.toolCallId ?? [tool.name](http://tool.name)}

          name={[tool.name](http://tool.name)}

          state={tool.state}

          data={[tool.data](http://tool.data)}

        />

      ))}

    </div>

  );

}

```

  This example shows a complete agent with async-generator tools that stream search progress to a React UI.

  **Agent definition:**

  **React component with progress cards:**

#### `tools` vs `custom` stream mode

Both stream modes can surface tool progress, but they serve different purposes:

- *`tools`**—automatically emits structured lifecycle events `on_tool_start`, `on_tool_event`, `on_tool_end`, `on_tool_error`) with no code changes needed in your tools beyond using `async function`*. The `useStream` hook provides the reactive `toolProgress` array out of the box.
- *`custom`**—gives you full control over what data is emitted and when using `config.writer()`. Use this when you need freeform data that doesn't map to the tool lifecycle, or when you want to stream from nodes (not just tools).

### Subgraph outputs

To include outputs from [subgraphs](/oss/javascript/langgraph/use-subgraphs) in the streamed outputs, you can set `subgraphs: true` in the `.stream()` method of the parent graph. This will stream outputs from both the parent graph and any subgraphs.

The outputs will be streamed as tuples `[namespace, data]`, where `namespace` is a tuple with the path to the node where a subgraph is invoked, e.g. `["parent_node:<task_id>", "child_node:<task_id>"]`.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

for await (const chunk of await [graph.stream](http://graph.stream)(

  { foo: "foo" },

  {

    // Set subgraphs: true to stream outputs from subgraphs

    subgraphs: true,

    streamMode: "updates",

  }

)) {

  console.log(chunk);

}

```

  **Note** that we are receiving not just the node updates, but we also the namespaces which tell us what graph (or subgraph) we are streaming from.

### Debug

Use the `debug` streaming mode to stream as much information as possible throughout the execution of the graph. The streamed outputs include the name of the node as well as the full state.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

for await (const chunk of await [graph.stream](http://graph.stream)(

  { topic: "ice cream" },

  { streamMode: "debug" }

)) {

  console.log(chunk);

}

```

### Multiple modes at once

You can pass an array as the `streamMode` parameter to stream multiple modes at once.

The streamed outputs will be tuples of `[mode, chunk]` where `mode` is the name of the stream mode and `chunk` is the data streamed by that mode.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

for await (const [mode, chunk] of await [graph.stream](http://graph.stream)(inputs, {

  streamMode: ["updates", "custom"],

})) {

  console.log(chunk);

}

```

## Advanced

### Use with any LLM

You can use `streamMode: "custom"` to stream data from **any LLM API**—even if that API does **not** implement the LangChain chat model interface.

This lets you integrate raw LLM clients or external services that provide their own streaming interfaces, making LangGraph highly flexible for custom setups.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { StateGraph, GraphNode, StateSchema } from "@langchain/langgraph";

import * as z from "zod";

const State = new StateSchema({ result: z.string() });

const callArbitraryModel: GraphNode<typeof State> = async (state, config) => {

  // Example node that calls an arbitrary model and streams the output

  // Assume you have a streaming client that yields chunks

  // Generate LLM tokens using your custom streaming client

  for await (const chunk of yourCustomStreamingClient(state.topic)) {

    // Use the writer to send custom data to the stream

    config.writer({ custom_llm_chunk: chunk });

  }

  return { result: "completed" };

};

const graph = new StateGraph(State)

  .addNode("callArbitraryModel", callArbitraryModel)

  // Add other nodes and edges as needed

  .compile();

// Set streamMode: "custom" to receive the custom data in the stream

for await (const chunk of await [graph.stream](http://graph.stream)(

  { topic: "cats" },

  { streamMode: "custom" }

)) {

  // The chunk will contain the custom data streamed from the llm

  console.log(chunk);

}

```

  Let's invoke the graph with an `AIMessage`]([https://reference.langchain.com/javascript/langchain-core/messages/AIMessage](https://reference.langchain.com/javascript/langchain-core/messages/AIMessage)) that includes a tool call:

### Disable streaming for specific chat models

If your application mixes models that support streaming with those that do not, you may need to explicitly disable streaming for

models that do not support it.

Set `streaming: false` when initializing the model.

```typescript theme={"theme":{"light":"catppuccin-latte","dark":"catppuccin-mocha"}}

import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({

  model: "o1-preview",

  // Set streaming: false to disable streaming for the chat model

  streaming: false,

});

```

  Not all chat model integrations support the `streaming` parameter. If your model doesn't support it, use `disableStreaming: true` instead. This parameter is available on all chat models via the base class.

---

```
[Connect these docs](/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.
```

```
[Edit this page on GitHub]([https://github.com/langchain-ai/docs/edit/main/src/oss/langgraph/streaming.mdx](https://github.com/langchain-ai/docs/edit/main/src/oss/langgraph/streaming.mdx)) or [file an issue]([https://github.com/langchain-ai/docs/issues/new/choose](https://github.com/langchain-ai/docs/issues/new/choose)).
```

