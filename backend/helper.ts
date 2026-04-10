import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";
import { type ChatCompletionMessageToolCall } from "openai/src/resources.js";
import { Socket } from "socket.io";
import { type ChatMessages, type ClientToolRequest, type ClientToolResult } from "./types.js";
import { MAX_MESSAGES, TIMEDOUT_SECONDS } from "./constants.js";

export const sessionMessagesByClient = new Map<string, ChatMessages>();

export function getMessagesHistoryByClient(
  socketId: string,
  systemPrompt: string,
): ChatMessages {
  let history = sessionMessagesByClient.get(socketId);

  if (!history) {
    history = [{ role: "system", content: systemPrompt }];
    sessionMessagesByClient.set(socketId, history);
    return history;
  }

  return history;
}

export function getHistory(socketId: string): ChatMessages {
  const history = sessionMessagesByClient.get(socketId);
  if (!history?.length) {
    throw new Error(`Session lost for socket: ${socketId}`);
  }
  return history;
}

export function trimHistory(history: ChatMessages, maxMessages = MAX_MESSAGES): ChatMessages {
  if (history.length <= 1) return history;

  const systemMessage = history[0];
  const rest = history.slice(1);

  const blocks: ChatMessages[] = [];
  let i = 0;

  while (i < rest.length) {
    const msg = rest[i];

    // TOOL BLOCK (assistant with tool_calls)
    if (
      msg.role === "assistant" &&
      "tool_calls" in msg &&
      msg.tool_calls &&
      msg.tool_calls.length > 0
    ) {
      const block: ChatMessages = [msg];
      i++;

      // collect ALL tool results for this assistant call
      while (i < rest.length && rest[i].role === "tool") {
        block.push(rest[i]);
        i++;
      }

      blocks.push(block);
      continue;
    }

    // USER MESSAGE
    if (msg.role === "user") {
      const block: ChatMessages = [msg];

      // if next is a normal assistant response → group them
      if (
        i + 1 < rest.length &&
        rest[i + 1].role === "assistant" &&
        !("tool_calls" in rest[i + 1])
      ) {
        block.push(rest[i + 1]);
        i += 2;
      } else {
        i++;
      }

      blocks.push(block);
      continue;
    }

    blocks.push([msg]);
    i++;
  }

  const trimmedBlocks = blocks.slice(-maxMessages);

  return [systemMessage, ...trimmedBlocks.flat()];
}

export function saveMessage(
  socketId: string,
  message: ChatCompletionMessageParam,
): void {
  const history = sessionMessagesByClient.get(socketId);
  if (!history) {
    throw new Error("No session history found for socket: " + socketId);
  }

  // Early returns for special cases (already typed ideally)
  if (
    message.role === "assistant" &&
    "tool_calls" in message &&
    message.tool_calls
  ) {
    history.push({
      role: "assistant",
      content: null,
      tool_calls: message.tool_calls,
    } as ChatCompletionAssistantMessageParam);
    return;
  }

  if (
    message.role === "tool" &&
    "tool_call_id" in message &&
    message.content != null
  ) {
    history.push({
      role: "tool",
      content: message.content,
      tool_call_id: message.tool_call_id!,
    } as ChatCompletionToolMessageParam);
    return;
  }

  // Exhaustive generic case with narrowing
  switch (message.role) {
    case "system":
      history.push({
        role: "system",
        content: message.content!,
      } as ChatCompletionSystemMessageParam);
      break;
    case "user":
      history.push({
        role: "user",
        content: message.content!,
      } as ChatCompletionUserMessageParam);
      break;
    case "assistant":
      history.push({
        role: "assistant",
        content: message.content ?? null,
      });
      break;
    default:
      throw new Error(`Unsupported role: ${message.role}`);
  }
}

export async function executeToolCall({
  socket,
  call,
}: {
  socket: Socket;
  call: ChatCompletionMessageToolCall;
}): Promise<ClientToolResult> {
  const params = parseToolArguments(call.function.arguments);
  return requestClientToolExecution(socket, {
    toolCallId: call.id,
    cmd: call.function.name,
    params,
  });
}

function parseToolArguments(rawArgs: string): Record<string, unknown> {
  if (!rawArgs) return {};

  const parsed = JSON.parse(rawArgs) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Tool arguments must be a JSON object");
  }

  return parsed as Record<string, unknown>;
}

function requestClientToolExecution(
  socket: Socket,
  payload: ClientToolRequest,
): Promise<ClientToolResult> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(`Timed out waiting for tool result: ${payload.cmd}`),
      );
    }, TIMEDOUT_SECONDS);

    socket.emit(
      "tool_call",
      payload,
      (result: ClientToolResult | undefined) => {
        clearTimeout(timeout);

        if (!result) {
          reject(
            new Error(
              `No tool result received for: ${payload.cmd}`,
            ),
          );
          return;
        }

        resolve(result);
      },
    );
  });
}
