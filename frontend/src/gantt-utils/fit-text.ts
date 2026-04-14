import type { GanttStatic, Task } from "@dhx/trial-gantt";

export default function fitTaskText(gantt: GanttStatic) {
  gantt.config.font_width_ratio = 7;
  gantt.templates.leftside_text = function leftSideTextTemplate(_start, _end, task) {
    if (getTaskFitValue(task) === "left") {
      return task.text;
    }
    return "";
  };
  gantt.templates.rightside_text = function rightSideTextTemplate(_start, _end, task) {
    if (getTaskFitValue(task) === "right") {
      return task.text;
    }
    return "";
  };
  gantt.templates.task_text = function taskTextTemplate(_start, _end, task) {
    if (getTaskFitValue(task) === "center") {
      return task.text;
    }
    return "";
  };

  function getTaskFitValue(task: Task) {
    let taskStartPos = gantt.posFromDate(task.start_date!),
      taskEndPos = gantt.posFromDate(task.end_date!);

    let width = taskEndPos - taskStartPos;
    let textWidth = (task.text || "").length * gantt.config.font_width_ratio;

    if (width < textWidth) {
      let ganttLastDate = gantt.getState().max_date;
      let ganttEndPos = gantt.posFromDate(ganttLastDate);
      if (ganttEndPos - taskEndPos < textWidth) {
        return "left"
      }
      else {
        return "right"
      }
    }
    else {
      return "center";
    }
  }
}