import "dotenv/config";
import express, { type Express } from "express";
import { createServer, type Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import OpenAI from "openai";
import { schemaList } from "./schemaList.js";
import { log } from "./logger.js";
import {
  executeToolCall,
  getHistory,
  getMessagesHistoryByClient,
  saveMessage,
  sessionMessagesByClient,
  trimHistory,
} from "./helper.js";
import { type UserMsgPayload } from "./types.js";
import { MODEL, SKIP_MESSAGE } from "./constants.js";

const app: Express = express();
const httpServer: HttpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000" },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

app.use(express.static("../frontend/dist"));

io.on("connection", (socket: Socket) => {
  log.info(`Client connected: ${socket.id}`);

  let idleTimer: NodeJS.Timeout | null = null;

  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!socket.connected) return;
      sessionMessagesByClient.delete(socket.id);
    }, 30 * 60 * 1000);
  };

  resetIdleTimer();

  socket.on("user_msg", async (payload: UserMsgPayload | string) => {
    try {
      resetIdleTimer();

      const { message } = typeof payload === "string" ? JSON.parse(payload) : payload;

      getMessagesHistoryByClient(socket.id, generateSystemPrompt());
      saveMessage(socket.id, { role: "user", content: message });

      while (true) {
        const history = trimHistory(getHistory(socket.id));
        const response = await openai.chat.completions.create({
          model: MODEL,
          messages: history,
          tools: schemaList,
          tool_choice: "auto",
        });

        const msg = response.choices[0].message;

        if (!msg.tool_calls?.length) {
          socket.emit("assistant_msg", msg.content ?? "");
          saveMessage(socket.id, {
            role: "assistant",
            content: msg.content ?? "",
          });
          break;
        }

        saveMessage(socket.id, {
          role: "assistant",
          tool_calls: msg.tool_calls,
        });

        for (const call of msg.tool_calls) {
          const result = await executeToolCall({ socket, call });
          saveMessage(socket.id, {
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
        }
      }
    } catch (err) {
      log.error("Error handling message", err);
      socket.emit("assistant_msg", "Something went wrong.");
    }
  });

  socket.on("disconnect", () => {
    if (idleTimer) clearTimeout(idleTimer);
    sessionMessagesByClient.delete(socket.id);
    log.info(`Client disconnected: ${socket.id}`);
  });
});

function generateSystemPrompt(): string {
  return `
You are ProjectGanttAssistant.

Your job is to help users control a DHTMLX Gantt chart using natural language.

Guidelines:
- Analyze the available tools and choose the best one for the user's request.
- If a tool matches, call it instead of describing the action abstractly.
- After all required tool calls are done, respond briefly in plain language.

Tool usage rules (STRICT):
- If the request depends on existing tasks or links, you MUST call get_gantt_state first.
- After you receive the get_gantt_state result, analyze it and then call the required tool.
- If state is already available, do not call it again.
- If a tool matches the request, you MUST call it.
- If the request does NOT match any tool → you MUST return the following message: ${SKIP_MESSAGE}.

Output rules:
- Don't return tools code.
- Final answer MUST be 1-2 sentences.
- Plain text only.

Examples:

User: "create a task called Design starting tomorrow for 3 days"
→ Call: add_task

User: "update a QA task"
→ Call: get_gantt_state
→ Call: add_task

User: "delete all tasks"
→ Call: get_gantt_state
→ Call: delete_tasks

Keep responses short and clear.
Today is ${new Date().toISOString().split("T")[0]}.
`;
}

httpServer.listen(3001, () => {
  console.log("API running on :3001");
});
