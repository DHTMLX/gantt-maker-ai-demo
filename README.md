# DHTMLX Gantt - AI Gantt Manager Demo

This demo shows how to connect **DHTMLX Gantt** with an **AI-powered chatbot** that can control the Gantt chart with natural language instructions.  
The chatbot understands natural language commands and can perform actions such as creating, updating, or deleting tasks directly in the chart.

### **[✨ Try the Live Demo >>>](https://dhtmlx.com/docs/demo/ai-gantt-maker/)**

The setup combines **DHTMLX Gantt** for project visualization, a **frontend app (Vite + React)** for UI, and a **backend (Express + Socket.IO)** for communication with an LLM (via OpenAI API or a compatible service). Everything is containerized with Docker.

## Features

- **AI-driven Gantt control** – interact with the Gantt Chart via chat using natural language instructions.
- **Project generation** – create complete project structures with tasks and dependencies.
- **Task management** – add, update, delete, and split tasks into subtasks with automatic chaining.
- **Dependency management** – create and modify task dependencies with different link types (Finish-to-Start, Start-to-Start, etc.).
- **Visual customization** – change task colors, text styles, progress bars, and apply different skins.
- **Timeline control** – zoom to different levels, add markers, and customize timeline scales.
- **Export functionality** – export your Gantt charts to PNG and PDF formats.

## How it works

This demo shows how a Gantt chart can be managed using natural language commands processed by an LLM. When the user types something like:

> _Generate a project called Website Relaunch with Design and QA phases._

the user's request provided via the chatbot, is sent to LLM, which then calls a function. The function returns a command and some data that is processed on the client. Finally, the chart is updated with the generated project and the user sees the result.

### The main flow works like this:

1. **Function calling with LLM**

- The backend uses the function calling feature of the OpenAI API.
- Available functions are defined in `backend/schemaList`.js.
- Each function has a schema describing the parameters the model can return.

2. **Client-side command runner**

- On the frontend, the returned tool calls are handled in `frontend/src/command-runner.js`

3. **System prompt and context**

- The LLM only receives a system prompt with project generation rules, the latest user message, and a current snapshot of tasks/links in the project.
- The model does not keep track of earlier conversation history, so each command is interpreted independently.

4. **Models and limitations**

- Works well with `gpt-5-nano` and `gpt-4.1-mini`.
- `gpt-4.1-nano` has noticeable limitations in following the schema.
- If experimenting with other providers, make sure they support **function calling**.

## Quick start

### Option 1: Production mode (Docker)

```bash
git clone https://github.com/DHTMLX/gantt-maker-ai-demo.git
cd gantt-maker-ai-demo
cp .env.example .env
# Edit .env with your API keys
docker compose up --build
```

Open http://localhost in your browser. The frontend runs on port 80, backend on port 3001. Make sure you have a valid OpenAI API key or another LLM provider configured in your .env.

### Option 2: Development mode (Docker)

Run with hot-reload for development:

```bash
git clone https://github.com/DHTMLX/gantt-maker-ai-demo.git
cd gantt-maker-ai-demo
cp .env.dev.example .env
# Edit .env with your API keys
docker compose -f docker-compose.dev.yml up --build
```

Open **http://localhost:3000** in your browser. Changes to code will auto-reload.

### Option 3: Local development (without Docker)

If you prefer running locally without Docker:

```bash
npm install
cp .env.dev.example .env
# Edit .env with your API keys

npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:3000
```

---

## Environment Variables

```bash
# LLM API configuration
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_BASE_URL=YOUR_OPENAI_BASE_URL

# Production mode (docker-compose.yml)
VITE_SOCKET_URL_DOCKER=http://localhost:3001
FRONTEND_ORIGIN_DOCKER=http://localhost

# Development mode (docker-compose.dev.yml)
VITE_SOCKET_URL_DOCKER=http://localhost:3001
FRONTEND_ORIGIN_DOCKER=http://localhost:3000
```

## Repo structure:

frontend/  
 ├─ src/  
 │ ├─ gantt-utils/  
 │ ├─ chat-widget.js  
 │ ├─ command-runner.js  
 │ ├─ style.css  
 │ └─ main.js  
 ├─ vite.config.js  
 ├─ Dockerfile  
 ├─ index.html  
 ├─ vite.config.js  
 ├─ .gitignore  
 ├─ package-lock.json  
 └─ package.json

backend/  
 ├─ .gitignore  
 ├─ Dockerfile  
 ├─ logger.js  
 ├─ schemaList.js  
 ├─ server.js  
 ├─ helper.js
 ├─ package-lock.json  
 └─ package.json

docker-compose.yml  
docker-compose.dev.yml
.env.example  
.env.dev.example  
package.json  
README.md  
.gitignore

## Scripts (without Docker)

If you prefer running locally:

```bash
npm install
cp .env.example .env

# Backend
npm run dev:backend    # http://localhost:3001

# Frontend
npm run dev:frontend    # http://localhost:3000
```

## License

Source code in this repo is released under the **MIT License**.

**DHTMLX Gantt** is a commercial library – use under a valid [DHTMLX license](https://dhtmlx.com/docs/products/licenses.shtml) or evaluation agreement.
Usage of OpenAI API (or other LLM providers) is subject to their terms of service and billing.

## Useful links

- [DHTMLX Gantt Product Page](https://dhtmlx.com/docs/products/dhtmlxGantt/)
- [DHTMLX Gantt Documentation](https://docs.dhtmlx.com/gantt/)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Socket.IO Docs](https://socket.io/docs/v4/)
- [DHTMLX technical support forum](https://forum.dhtmlx.com/)
