import "@dhx/trial-gantt/codebase/dhtmlxgantt.css";

import { Gantt } from "@dhx/trial-gantt";
import { io } from "socket.io-client";
import { initChat } from "./chat-widget.ts";
import initZoom from "./gantt-utils/zoom.ts";
import fitTaskText from "./gantt-utils/fit-text.ts";
import createCommandRunner from "./command-runner.ts";

const gantt = Gantt.getGanttInstance();
gantt.config.columns = [
  { name: "wbs", label: "WBS", width: 60, resize: true, template: gantt.getWBSCode },
  { name: "text", label: "Task name", tree: true, width: 250, resize: true },
  { name: "start_date", align: "center", width: 100, resize: true },
  { name: "duration", align: "center", width: 80, resize: true },
  { name: "add", width: 40 },
];
gantt.plugins({
  auto_scheduling: true,
  undo: true,
  export_api: true,
  marker: true,
  tooltip: true,
  critical_path: true,
});

gantt.config.auto_scheduling = true;
gantt.config.open_tree_initially = true;
gantt.config.auto_types = true;
gantt.config.scale_height = 60;
gantt.config.open_split_tasks = true;
initZoom(gantt);
fitTaskText(gantt);

function parseSmartDate(str: string) {
  if (typeof str !== "string") return null;
  const p = str.trim().replace(/\//g, "-").split("-");
  if (p.length !== 3) return null;

  const [y, m, d] = p[0].length === 4 ? p : [p[2], p[1], p[0]];
  const dt = new Date(+y, +m - 1, +d);
  return isNaN(dt as any) ? null : dt;
}
gantt.templates.parse_date = (date: string): Date => {
  const parsed = parseSmartDate(date);
  return parsed ?? new Date();
};

gantt.init("gantt_here");

const runCommand = createCommandRunner(gantt);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.origin}`;
const socket = io(SOCKET_URL);

initChat({
  socket,
  runCommand,
  getProject: () => gantt.serialize(),
});
