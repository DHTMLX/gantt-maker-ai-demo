export default function (gantt) {
  return function runCommand(cmd, args) {
    const strToDate = gantt.date.str_to_date("%Y-%m-%d");
    const dateToStr = gantt.date.date_to_str("%Y-%m-%d");

    switch (cmd) {
      case "add_task":
        gantt.addTask(args);
        break;

      case "update_task":
        Object.assign(gantt.getTask(args.id), args);
        gantt.updateTask(args.id);
        break;

      case "delete_task":
        gantt.deleteTask(args.id);
        break;

      case "split_task": {
        const parent = gantt.getTask(args.id || args.task_id);
        parent.$open = true;
        const newIds = [];
        (args.subtasks || args.new_tasks).forEach((t) => {
          newIds.push(gantt.addTask({ ...t, id: gantt.uid(), parent: parent.id }));
        });
        if (args.addFSLinks) {
          for (let i = 1; i < args.subtasks.length; i++) {
            gantt.addLink({
              source: newIds[i - 1],
              target: newIds[i],
              type: gantt.config.links.finish_to_start,
            });
          }
        }
        break;
      }

      case "add_link":
        gantt.addLink({
          id: gantt.uid(),
          source: args.source,
          target: args.target,
          type: args.type,
        });
        break;

      case "delete_link":
        gantt.deleteLink(args.id);
        break;

      case "style_task": {
        const { id, color } = args;

        const apply = (task) => {
          task.color = color;
          gantt.refreshTask(task.id);
        };
        if (id === "all") {
          gantt.eachTask((task) => apply(task));
        } else {
          gantt.batchUpdate(() => {
            const task = gantt.getTask(id);
            if (task) apply(task);
          });
        }
        break;
      }

      case "style_link":
        const { id: linkId, color } = args;

        const apply = (link) => {
          link.color = color;
          gantt.refreshLink(link.id);
        };
        if (linkId === "all") {
          gantt.getLinks().forEach((link) => apply(link));
        } else {
          gantt.batchUpdate(() => {
            const link = gantt.getLink(linkId);
            if (link) apply(link);
          });
        }
        break;

      case "set_link_width":
        gantt.config.link_line_width = args.width;
        gantt.render();
        break;

      case "set_link_wrapper_width":
        gantt.config.link_wrapper_width = args.width;
        gantt.render();
        break;

      case "show_links":
        gantt.config.show_links = args.show;
        gantt.render();
        break;

      case "set_text_color":
        const { id: taskId, color: textColor } = args;

        const applyTextColor = (task) => {
          task.textColor = textColor;
          gantt.refreshTask(task.id);
        };
        if (taskId === "all") {
          gantt.batchUpdate(() => {
            gantt.eachTask((task) => applyTextColor(task));
          });
        } else {
          const task = gantt.getTask(taskId);
          if (task) applyTextColor(task);
        }
        break;

      case "set_progress_color":
        const { id: taskId2, color: progressColor } = args;

        const applyProgressColor = (task) => {
          task.progressColor = progressColor;
          gantt.refreshTask(task.id);
        };
        if (taskId2 === "all") {
          gantt.batchUpdate(() => {
            gantt.eachTask((task) => applyProgressColor(task));
          });
        } else {
          const task = gantt.getTask(taskId2);
          if (task) applyProgressColor(task);
        }

        break;

      case "set_task_tooltip":
        if (args.enable) {
          gantt.templates.tooltip_text = (start, end, task) => {
            const taskText = "<b>Task:</b>" + task.text + "<br/>";
            const startDate = "<b>Start date:</b> " + dateToStr(start) + "<br/>";
            const endDate = "<b>End date:</b> " + dateToStr(end);
            return `${taskText} ${startDate} ${endDate}`;
          };
        } else {
          gantt.templates.tooltip_text = () => {
            return false;
          };
        }
        break;

      case "add_marker":
        const { id, start_date, text, title } = args;

        gantt.addMarker({
          id,
          start_date: strToDate(start_date),
          text,
          title,
        });
        break;

      case "set_scales": {
        const { scales } = args;
        if (!Array.isArray(scales)) break;

        const newScales = scales.map((s) => {
          const obj = { unit: s.unit, step: s.step };
          if (s.format) obj.format = s.format;
          if (s.cssClass) {
            obj.css = function (date) {
              if (date.getDay() === 0 || date.getDay() === 6) return "weekend";
            };
          }
          return obj;
        });

        if (scales.length >= 2) {
          gantt.config.scale_height = 70;
        } else {
          gantt.config.scale_height = 40;
        }
        gantt.config.scales = newScales;
        gantt.render();
        break;
      }

      case "set_skin":
        gantt.setSkin(args.skin);
        break;

      case "zoom":
        if (args.level === "fit") {
          gantt.ext.zoomToFit();
        } else {
          gantt.ext.zoom.setLevel(args.level);
        }
        break;

      case "autoschedule":
        gantt.autoSchedule(args.anchorTaskId || undefined);
        break;

      case "hide_weekdays":
        const days = args.days;
        gantt.ignore_time = function (date) {
          if (days.includes(date.getDay())) return true;
        };
        gantt.render();
        break;

      case "undo":
        gantt.ext.undo.undo();
        break;

      case "export_png":
        gantt.exportToPNG({ name: args.name || "gantt.png" });
        break;

      case "export_to_pdf":
        gantt.exportToPDF({
          name: args.name || "gantt.pdf",
          raw: args.raw ?? true,
        });
        break;

      case "generate_project":
        gantt.clearAll();

        gantt.parse({
          data: args.tasks,
          links:
            (args.links || []).map((l) => {
              return {
                source: l.source || l.sourceId,
                target: l.target || l.targetId,
                type: l.type,
                lag: l.lag || 0,
              };
            }) || [],
        });
        break;

      case "clear_all":
        gantt.clearAll();
        break;

      default:
        console.warn("Unknown cmd:", cmd, args);
    }
  };
}
