export const SKIP_MESSAGE = `
This AI helper can't do that yet.
Your request doesn't match any of the supported actions.
If this is something you'd like to see, please open an issue on GitHub: https://github.com/DHTMLX/gantt-maker-ai-demo/issues
`
export const MODEL = process.env.OPENAI_MODEL || "gpt-5-nano";

export const TIMEDOUT_SECONDS = 15_000;

export const MAX_MESSAGES = 20;