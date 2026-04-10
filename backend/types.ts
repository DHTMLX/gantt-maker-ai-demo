import { type ChatCompletionMessageParam } from "openai/resources.mjs";

export type UserMsgPayload = {
  message: string;
  state?: unknown;
};

export type ClientToolRequest = {
  toolCallId: string;
  cmd: string;
  params: Record<string, unknown> | string;
};

export type ClientToolResult =
  | {
      ok: true;
      cmd: string;
      data?: unknown;
    }
  | {
      ok: false;
      cmd: string;
      error: string;
    };

export type Role = "system" | "user" | "assistant" | "tool";

export type ChatMessage = ChatCompletionMessageParam;
export type ChatMessages = ChatMessage[];