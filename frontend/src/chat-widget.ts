import { marked } from "marked";
import DOMPurify from 'dompurify';
import MicroModal from "micromodal";
import type { Socket } from "socket.io-client";

interface InitChatOptions {
  socket: Socket;
  runCommand: (cmd: string, params: any) => void;
  getProject: () => any;
}

interface Task {
  text?: string;
  type?: string;
}

interface TaskNames {
  regular: string[];
  summaries: string[];
  any: string[];
}

export const initChat = ({ socket, runCommand, getProject }: InitChatOptions) => {
  (function () {
    const chatWidgetContainer = document.querySelector("#chat_panel") as HTMLElement;
    if (chatWidgetContainer) {
      chatWidgetContainer.dataset.id = "0";

      chatWidgetContainer.innerHTML = `
        <div id="chat-popup" class="relative left-0 bottom-0 w-full h-full bg-white rounded-md shadow-md flex flex-col transition-all">
          <div id="chat-header" class="flex justify-between items-center p-4 bg-gray-800 text-white rounded-t-md">
            <h3 class="m-0 text-lg">DHX Assistant</h3>
             <button data-micromodal-trigger="modal-1" class="help-btn">?</button>
          </div>
          <div id="chat-messages" class="flex-1 p-4 pb-1 overflow-y-auto text-base"></div>
          <div id="loader" class="hidden justify-start mb-3">
            <div class="spinner m-auto"></div>
          </div>
          <div id="chat-input-container" class="p-4 border-t border-gray-200">
            <div class="flex space-x-4 items-center">
           <input type="text" id="chat-input" class="flex-1 border border-gray-300 rounded-md px-4 py-2 outline-none w-3/4" placeholder="Type your message...">
           <button id="chat-submit" class="bg-gray-800 text-white rounded-md px-4 py-2 cursor-pointer">Send</button>
            </div>
          </div>
        </div>
      `;

      const chatInput = document.getElementById("chat-input") as HTMLInputElement;
      const chatSubmit = document.getElementById("chat-submit") as HTMLButtonElement;
      const chatMessages = document.getElementById("chat-messages") as HTMLElement;
      const loader = document.getElementById("loader") as HTMLElement;

      chatSubmit.addEventListener("click", () => {
        const message = chatInput.value.trim();
        if (!message) return;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.value = "";
        sendUserMessage(message);
      });

      chatMessages.addEventListener("click", (event: MouseEvent) => {
        const target = (event.target as Element)?.closest(".prompt-pill") as HTMLElement;
        if (target) {
          const pillText = target.innerText;
          sendUserMessage(pillText);
        }
      });

      chatInput.addEventListener("keyup", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
          chatSubmit.click();
        }
      });

      function showLoader(): void {
        loader.classList.remove("hidden");
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      function hideLoader(): void {
        loader.classList.add("hidden");
      }

      function sendUserMessage(message: string): void {
        if (!message) return;
        displayUserMsg(message);
        chatInput.value = "";
        chatSubmit.disabled = true;
        showLoader();
        socket.emit("user_msg", JSON.stringify({ message }));
      }

      function displayUserMsg(msg: string): void {
        const div = document.createElement("div");
        div.className = "flex justify-end mb-3";
        div.innerHTML = `<div class="bg-gray-800 text-white rounded-lg py-2 px-4 max-w-[70%]">${DOMPurify.sanitize(msg)}</div>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      socket.on("assistant_msg", (txt: string) => {
        hideLoader();
        displayReply(txt);
        chatSubmit.disabled = false;
      });

      socket.on("tool_call", (payload: { cmd: string; params: any }, ack?: (response: any) => void) => {
        let handled = false;

        try {
          const { cmd, params } = payload;

          if (cmd && cmd !== "none") {
            runCommand(cmd, params);
            onCallback(cmd, params);

            if (typeof ack === "function") {
              ack({
                ok: true,
                cmd,
                data: getProject(),
              });
            } else {
              hideLoader();
              chatSubmit.disabled = false;
            }
          }

          handled = true;
        } catch (e: any) {
          hideLoader();
          displayReply(`Something wrong had happened: ${e.message}`);

          if (typeof ack === "function") {
            ack({
              ok: false,
              cmd: payload?.cmd || "unknown",
              error: e.message,
            });
          }
          handled = true;
        }

        if (!handled) {
          displayReply(`Couldn't handle this: ${JSON.stringify(payload)}`);
        }
      });

      function displayReply(message: string): void {
        const div = document.createElement("div");
        div.className = "flex mb-3";
        const html = DOMPurify.sanitize(marked.parse(message) as string);
        div.innerHTML = `<div class="bg-gray-100 text-black rounded-lg py-2 px-4 max-w-[70%]">${html}</div>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      let injectedMain = false;
      let injectedChart = false;
      function onCallback(cmd: string, params: { tasks: Task[] }): void {
        if (!injectedMain && cmd === "generate_project") {
          injectedMain = true;
          displayReply(buildMainSuggestionsBlock(params.tasks));
          return;
        }
        if (!injectedChart) {
          injectedChart = true;
          displayReply(buildChartSuggestionsBlock());
          return;
        }
      }

      function buildMainSuggestionsBlock(tasks: Task[]): string {
        const { regular, any } = pickTaskNames(tasks, 8);

        const t1 = any[0] || "Design";
        const t2 = any[1] || "Build";
        const t3 = any[2] || "QA";
        const t4 = any[2] || "Review";
        const tSplit = regular[0] || t1;

        const pills = [
          `Zoom to fit the screen`,
          `Set "${t1}" to start after "${t2}"`,
          `Split "${tSplit}" into subtasks and link them FS`,
          `Set progress of "${t3}" to 60%`,
          `Mark the task "${t4}" red`,
        ];

        return `<p>Your project is ready. Keep shaping it with natural language. Try:</p>
          <div class="suggestion-pills">
            ${pills.map((p) => `<button class="prompt-pill">${p}</button>`).join("")}
          </div>`;
      }

      function buildChartSuggestionsBlock(): string {
        const pills = [
          `Add date marker "Kickoff" on Monday next week`,
          `Switch to dark theme`,
          `Clear the project`,
          `Print project as PDF`,
        ];
        return `<p>Pro tip: you can also configure the chart itself. For example: </p>
<div class="suggestion-pills">
  ${pills.map((p) => `<button class="prompt-pill">${p}</button>`).join("")}
</div>`;
      }

      function pickTaskNames(tasks: Task[], max: number = 8): TaskNames {
        const reg: string[] = [];
        const sum: string[] = [];
        const all: string[] = [];
        const seen = new Set<string>();

        for (const t of tasks) {
          const name = (t?.text || "").trim();
          if (!name || seen.has(name)) continue;
          seen.add(name);
          all.push(name);
          if (t?.type === "project") sum.push(name);
          else reg.push(name);
        }

        shuffle(reg);
        shuffle(sum);
        shuffle(all);

        return {
          regular: reg.slice(0, max),
          summaries: sum.slice(0, max),
          any: all.slice(0, max),
        };
      }

      function shuffle<T>(arr: T[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      }

      displayReply(`## Welcome to the AI Project Wizard!

I can create, edit, or style your Gantt chart with plain-language commands.
<br/>
<br/>

Try things like:

<div class="suggestion-pills">
<button class="prompt-pill">Generate a project called Website Relaunch with Design, Build and QA phases.</button>
<button class="prompt-pill">Plan a Conference 2026 with Venue & Speakers, Sponsorships, Marketing, Run-of-Show, Post-Event.</button>
<button class="prompt-pill">Generate a Grant Application project with Eligibility Check, Narrative Draft, Budget, Reviews, Submission.</button>
</div>`);
    }
  })();

  MicroModal.init({ disableScroll: true });
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-text");
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          (btn as HTMLButtonElement).textContent = "Copied!";
          setTimeout(() => ((btn as HTMLButtonElement).textContent = "Copy"), 1000);
        });
      }
    });
  });

  const modalBodyWrapper = document.querySelector(".modal__body-wrapper") as HTMLElement;
  const modalScrollTopBtn = document.getElementById("btn-scroll-top") as HTMLButtonElement;

  modalBodyWrapper.addEventListener("scroll", () => {
    modalScrollTopBtn.style.display = modalBodyWrapper.scrollTop > 200 ? "block" : "none";
  });

  modalScrollTopBtn.addEventListener("click", () => {
    modalBodyWrapper.scrollTo({ top: 0, behavior: "smooth" });
  });
};