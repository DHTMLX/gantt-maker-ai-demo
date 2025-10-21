import { marked } from 'marked';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify/dist/purify.es.js';
import MicroModal from 'micromodal';

export const initChat = ({ socket, runCommand, getProject }) => {
  (function () {
    const chatWidgetContainer = document.querySelector('#chat_panel');
    chatWidgetContainer.dataset.id = '0';

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

    const chatInput = document.getElementById('chat-input');
    const chatSubmit = document.getElementById('chat-submit');
    const chatMessages = document.getElementById('chat-messages');

    chatSubmit.addEventListener('click', function () {
      const message = chatInput.value.trim();
      if (!message) return;
      chatMessages.scrollTop = chatMessages.scrollHeight;
      chatInput.value = '';
      sendUserMessage(message);
    });

    chatMessages.addEventListener('click', function (event) {
      if (event.target.closest('.prompt-pill')) {
        const pillText = event.target.closest('.prompt-pill').innerText;
        sendUserMessage(pillText);
      }
    });

    chatInput.addEventListener('keyup', function (event) {
      if (event.key === 'Enter') {
        chatSubmit.click();
      }
    });

    const loader = document.getElementById('loader');

    function showLoader() {
      loader.classList.remove('hidden');
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideLoader() {
      loader.classList.add('hidden');
    }

    function sendUserMessage(message) {
      if (!message) return;
      displayUserMsg(message);
      chatInput.value = '';

      const payload = {
        message,
        project: getProject(),
      };
      showLoader();
      socket.emit('user_msg', JSON.stringify(payload));
    }

    function displayUserMsg(msg) {
      const div = document.createElement('div');
      div.className = 'flex justify-end mb-3';
      div.innerHTML = `<div class="bg-gray-800 text-white rounded-lg py-2 px-4 max-w-[70%]">${msg}</div>`;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    socket.on('assistant_msg', (txt) => {
      hideLoader();
      displayReply(txt);
    });

    socket.on('tool_call', (txt) => {
      let handled = false;
      try {
        const { cmd, params } = JSON.parse(txt);

        if (cmd && cmd !== 'none') {
          runCommand(cmd, params);
          hideLoader();
          // displayReply(`Running command **${cmd}**`);
          onCallback(cmd, params);
        }
        handled = true;
      } catch (e) {
        hideLoader();
        displayReply(`Something wrong had happened: ${e.message}`);
        handled = true;
      }
      if (!handled) displayReply(`Couldn't handle this: ${txt}`);
    });

    function displayReply(message) {
      const div = document.createElement('div');
      div.className = 'flex mb-3';
      const html = DOMPurify.sanitize(marked.parse(message));
      div.innerHTML = `<div class="bg-gray-100 text-black rounded-lg py-2 px-4 max-w-[70%]">${html}</div>`;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    let injectedMain = false;
    let injectedChart = false;
    function onCallback(cmd, params) {
      if (!injectedMain && cmd === 'generate_project') {
        injectedMain = true;
        displayReply(buildMainSuggestionsBlock(params.tasks));
        return;
      }
      if (!injectedChart) {
        injectedChart = true;
        displayReply(buildChartSuggestionsBlock(params.tasks));
        return;
      }
    }

    function buildMainSuggestionsBlock(tasks) {
      const { regular, summaries, any } = pickTaskNames(tasks, 8);

      const t1 = any[0] || 'Design';
      const t2 = any[1] || 'Build';
      const t3 = any[2] || 'QA';
      const t4 = any[2] || 'Review';
      const tSplit = regular[0] || t1;

      const pills = [
        `Zoom to fit the screen`,
        `Set "${t1}" to start after "${t2}"`,
        `Split "${tSplit}" into subtasks and link them FS`,
        `Set progress of "${t3}" to 60%`,
        `Mark the task "${t4}" red`,
      ];

      return `
  <p>Your project is ready. Keep shaping it with natural language. Try:</p>
  <div class="suggestion-pills">
    ${pills.map((p) => `<button class="prompt-pill">${p}</button>`).join('')}
  </div>`;
    }

    function buildChartSuggestionsBlock(tasks) {
      const pills = [
        `Add date marker "Kickoff" on Monday next week`,
        `Switch to dark theme`,
        `Clear the project`,
        `Print project as PDF`,
      ];
      return `<p>Pro tip: you can also configure the chart itself. For example: </p>
<div class="suggestion-pills">
  ${pills.map((p) => `<button class="prompt-pill">${p}</button>`).join('')}
</div>`;
    }

    function pickTaskNames(tasks, max = 8) {
      const reg = [];
      const sum = [];
      const all = [];
      const seen = new Set();

      for (const t of tasks) {
        const name = (t?.text || '').trim();
        if (!name || seen.has(name)) continue;
        seen.add(name);
        all.push(name);
        if (t?.type === 'project') sum.push(name);
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

    function shuffle(arr) {
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
  })();

  MicroModal.init({ disableScroll: true });
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => (btn.textContent = 'Copy'), 1000);
      });
    });
  });

  const modalBodyWrapper = document.querySelector('.modal__body-wrapper');
  const modalScrollTopBtn = document.getElementById('btn-scroll-top');

  modalBodyWrapper.addEventListener('scroll', () => {
    modalScrollTopBtn.style.display = modalBodyWrapper.scrollTop > 200 ? 'block' : 'none';
  });

  modalScrollTopBtn.addEventListener('click', () => {
    modalBodyWrapper.scrollTo({ top: 0, behavior: 'smooth' });
  });
};
