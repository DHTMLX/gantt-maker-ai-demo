import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import OpenAI from "openai";
import { schemaList } from "./schemaList.js";
import { log } from "./logger.js";
import { getMessagesHistoryByClient } from "./helper.js";

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

    const messages = getMessagesHistoryByClient(socket.id, generateSystemPrompt(project));
    messages.push({ role: "user", content: message });

    const reply = await talkToLLM(messages);
    if (reply.assistant_msg) socket.emit("assistant_msg", reply.assistant_msg);
    if (reply.call) socket.emit("tool_call", reply.call);
  });
});

function buildTaskMap(ganttSnapshot) {
  return ganttSnapshot.data
    .map((t) => `${t.id} | ${t.text} | ${t.start_date} | ${t.end_date} | ${t.duration} | ${t.progress} | ${t.parent}`)
    .slice(0, 150)
    .join("\n");
}
function buildLinkMap(ganttSnapshot) {
  return ganttSnapshot.links
    .map((l) => `${l.id}  source: ${l.source}  target: ${l.target}`)
    .slice(0, 150)
    .join("\n");
}

function generateSystemPrompt(project) {
  const taskMap = buildTaskMap(project);
  const linkMap = buildLinkMap(project);

  return `You are **ProjectGanttAssistant**, your goal is to help the user operating DHTMLX Gantt chart using natural language commands.

Today is ${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}

Always use one tool call for one command.

Your replies will be displayed in chat side panel, so try to be short and clear. You can use markdown formatting.

Key requirements for project generation:
1. Each main project MUST contain:
   - At least 20-30 subtasks in total
   - 3-5 major phases (marked as type: "project")
   - 2-4 levels of nesting for tasks
   - Realistic durations (days/weeks, not hours)
   - Logical dependencies between key tasks

2. Project structure should include:
   - Initial planning phase (5-8 tasks)
   - Execution phases (10-15 tasks split between phases)
   - Testing/QA phase (3-5 tasks)
   - Deployment/release phase (2-4 tasks)
3. Additional guidelines:
   - Use realistic task names for software/construction/marketing projects
   - Include varied task types (milestones, tasks, projects)
   - Add dependencies where logical (finish-to-start mostly)
   - Tasks should start no earlier than today unless specified
   - Tasks duration is equal or more than 1 day
   - Assign realistic progress percentages (0-100%)

When generating projects - make a quick summary of a project in your reply.
When you refer to an EXISTING task, use its id.
Here is the current reference list:
id | text | start_date | end_date | duration | progress | parent
${taskMap}

When you refer to an EXISTING link, use its id, source and target to find the necessary link.
Here is the current reference list:
${linkMap}

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
    `Processing took ${res.usage.approximate_total}. Prompt tokens: ${res.usage.prompt_tokens}, response tokens: ${res.usage.completion_tokens}, perf ${res.usage["response_token/s"]}T/s`
  );

  const msg = res.choices[0].message;
  let content = msg.content;
  let calls = msg.tool_calls;

  const toolCall = calls ? calls[0] : null;

  log.info(`output: ${content}`);
  log.info(`tool call: ${JSON.stringify(toolCall)}`);
  return {
    assistant_msg: content,
    call: toolCall
      ? JSON.stringify({ cmd: toolCall.function.name, params: JSON.parse(toolCall.function.arguments) })
      : null,
  };
}

http.listen(3001, () => console.log("API on :3001"));
