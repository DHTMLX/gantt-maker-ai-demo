import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import OpenAI from "openai";
import { schemaList } from "./schemaList.js";
import { log } from "./logger.js";
import { getMessagesHistoryByClient, sessionMessagesByClient } from "./helper.js";

const app = express();
const http = createServer(app);
const io = new Server(http, { cors: { origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000" } });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

app.use(express.static("../frontend/dist"));

io.on("connection", (socket) => {
  socket.on("user_msg", async (text) => {
    const { message, state } = JSON.parse(text);
    const messages = getMessagesHistoryByClient(socket.id, generateSystemPrompt());
    messages.push({ role: "user", content: message });
    const maxTurns = 3;
    // handling conversation
    for (let turn = 1; turn <= maxTurns; turn++) {
      const reply = await talkToLLM(messages);
      // if assistant ask additional question
      if (reply.assistant_msg) {
        socket.emit("assistant_msg", reply.assistant_msg);
        messages.push({
          role: "assistant",
          content: reply.assistant_msg,
        });
      }
      // if assistant used tool_call
      if (reply.call) {
        if (reply.tool_calls[0].function.name === "get_gantt_state") {
          messages.push({
            role: "assistant",
            tool_calls: reply.tool_calls,
            content: reply.content ?? "",
          });
          messages.push({
            role: "tool",
            tool_call_id: reply.tool_call_id,
            content: JSON.stringify(state),
          });
          continue;
        } else {
          messages.push({
            role: "assistant",
            tool_calls: reply.tool_calls,
            content: reply.content ?? "",
          });
          messages.push({
            role: "tool",
            tool_call_id: reply.tool_call_id,
            content: reply.content ?? "",
          });
          socket.emit("tool_call", reply.call);
        }
      }
      if (turn > maxTurns) {
        socket.emit("assistant_msg", "cant complete this request due to too many tool steps");
        return;
      }
      break;
    }

  });
  socket.on("disconnect", () => {
    sessionMessagesByClient.delete(socket.id);
  });
});

function generateSystemPrompt() {
  return `You are **ProjectGanttAssistant**, your goal is to help the user operating DHTMLX Gantt chart using natural language commands.

Today is ${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}

Your replies will be displayed in chat side panel, so try to be short and clear. You can use markdown formatting.

**MANDATORY PROCESS (execute in this exact order):**

1. **STEP 1: Analyze tools ONLY** - List all available tools and their descriptions. Match user command against EACH tool description. Note exact matches.
   
2. **STEP 2: Decide action** 
   - If you need to know information about current Gantt state, tasks, links invoke **get_gantt_state**.
   - If there is no information in your history about Gantt data in user's question, check the actual state of Gantt with **get_gantt_state**.
   - If you need to create, update, delete the tasks, links or Gantt state invoke **get_gantt_state** and only after use required tool according to the description.
   - If no exact match → Use 'skip_command' tool.
   - NEVER skip to final answer without tool step.

3. **STEP 3: Final reply** - Only after tool confirmation, provide short natural language response.

Remember to use tools in your replies.
`;
}

async function talkToLLM(request) {

  log.success("calling llm");
  const res = await openai.chat.completions.create({
    model: "gpt-5-nano",
    reasoning_effort: "low",
    messages: request,
    tools: schemaList,
  });

  log.success("Got LLM reply");
  log.info(
    `Prompt tokens: ${res.usage.prompt_tokens}, response tokens: ${res.usage.completion_tokens}, total tokens: ${res.usage.total_tokens}`
  );

  const msg = res.choices[0].message;
  let content = msg.content;
  let calls = msg.tool_calls;
  const toolCall = calls ? calls[0] : "";

  log.info(`output: ${content}`);
  log.info(`tool call: ${JSON.stringify(toolCall)}`);
  return {
    assistant_msg: content,
    call: toolCall
      ? JSON.stringify({ cmd: toolCall.function.name, params: JSON.parse(toolCall.function.arguments) })
      : "",
    tool_call_id: msg.tool_calls ? msg.tool_calls[0].id : "",
    tool_calls: msg.tool_calls ? msg.tool_calls : "",
  };
}

http.listen(3001, () => console.log("API on :3001"));