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
    const { message, project } = JSON.parse(text);
    const ganttState = `Here is the current gantt state: ${JSON.stringify(project)}`;
    const questionContent = `Here is the question: ${message}`;
    const messages = getMessagesHistoryByClient(socket.id, generateSystemPrompt());
    messages.push({ role: "user", content: ganttState });
    messages.push({ role: "user", content: questionContent });

    const reply = await talkToLLM(messages);
    // if assistant ask additional question
    if (reply.assistant_msg) socket.emit("assistant_msg", reply.assistant_msg);
    // if assistant used tool_call
    if (reply.call){
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
  });
  socket.on("disconnect", () => {
    sessionMessagesByClient.delete(socket.id);
  });
});

function generateSystemPrompt() {
  return `You are **ProjectGanttAssistant**, your goal is to help the user operating DHTMLX Gantt chart using natural language commands.

Today is ${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}

Always use one tool call for one command.

Your replies will be displayed in chat side panel, so try to be short and clear. You can use markdown formatting.

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
