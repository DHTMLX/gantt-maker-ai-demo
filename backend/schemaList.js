// ---------------------------------------------------------------------------
// JSON schemas for OpenAI "function-calling" mode
// ---------------------------------------------------------------------------
export const schemaList = [
  {
    type: "function",
    function: {
      name: "generate_project",
      description:
        "Turn a free-form description into a full project tree. \
	  Returns ready-to-parse `tasks[]` and (optionally) `links[]` " +
        "so the browser can call `gantt.parse()` immediately. The first task is a high-level project label and will be the root task.",
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            description: "Flat list of task objects exactly as dhtmlxGantt expects.",
            items: {
              type: "object",
              properties: {
                id: { type: ["string", "number"], description: "The ID of the task, can't be 0" },
                text: { type: "string" },
                start_date: { type: "string", format: "date", description: "ISO-8601 start date (e.g. 2025-05-01)" },
                duration: { type: "number", description: "Duration is always an integer" },
                parent: { type: ["string", "number"], description: "Task ID to nest under, or 0 for root" },
                progress: { type: "number", description: "The task progress ratio (0.0-1.0)", minimum: 0, maximum: 1 },
              },
              required: ["id", "text", "start_date", "duration", "parent", "progress"],
            },
            minItems: 1,
          },
          links: {
            type: "array",
            description: "Optional dependency list; same fields as `add_link` uses.",
            items: {
              type: "object",
              properties: {
                id: { type: ["string", "number"] },
                source: { type: ["string", "number"] },
                target: { type: ["string", "number"] },
                type: {
                  type: "string",
                  enum: ["0", "1", "2", "3"],
                  description: "0 is Finish to Start, 1 is Start to Start, 2 is Finish to Finish, 3 is Start to Finish",
                },
              },
              required: ["id", "source", "target", "type"],
            },
            minItems: 0,
          },
        },
        required: ["projectName", "tasks", "links"],
      },
    },
  },
  /* 1 ──────────────────────────  TASK CRUD  ───────────────────────────── */
  {
    type: "function",
    function: {
      name: "create_tasks",
      description:
        `If the user wants to create, add, generate more than one task. Turn a free-form description into a array of Gantt tasks. 
        Returns ready-to-parse 'tasks[]' and (optionally) 'links[]' so the browser can call 'gantt.parse()' immediately.`,
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            description: "Flat list of task objects exactly as dhtmlxGantt expects.",
            items: {
              type: "object",
              properties: {
                id: { type: ["string", "number"] },
                text: { type: "string" },
                start_date: { type: "string", format: "date", description: "ISO-8601 start date (e.g. 2025-05-01)" },
                duration: { type: "number", description: "Duration is always an integer" },
                parent: { type: ["string", "number", "null"], description: "Task ID to nest under, or null for root" },
                progress: { type: "number", description: "The task progress ratio (0.0-1.0)", minimum: 0, maximum: 1 },
              },
              required: ["id", "text", "start_date", "duration", "parent", "progress"],
            },
            minItems: 1,
          },
          links: {
            type: "array",
            description: "Optional dependency list; same fields as `add_link` uses.",
            items: {
              type: "object",
              properties: {
                id: { type: ["string", "number"] },
                source: { type: ["string", "number"] },
                target: { type: ["string", "number"] },
                type: {
                  type: "string",
                  enum: ["0", "1", "2", "3"],
                  description: "0 is Finish to Start, 1 is Start to Start, 2 is Finish to Finish, 3 is Start to Finish",
                },
              },
              required: ["id", "source", "target", "type"],
            },
            minItems: 0,
          },
        },
        required: ["projectName", "tasks", "links"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_tasks",
      description:
        `If the user wants to update, change one, several or all tasks. Turn a free-form description into a array of Gantt tasks. 
        Returns ready-to-parse 'tasks[]'`,
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            description: "Flat list of task objects exactly as dhtmlxGantt expects.",
            items: {
              type: "object",
              properties: {
                id: { type: ["string", "number"] },
                text: { type: "string" },
                start_date: { type: "string", format: "date", description: "ISO-8601 start date (e.g. 2025-05-01)" },
                duration: { type: "number", description: "Duration is always an integer" },
                parent: { type: ["string", "number", "null"], description: "Task ID to nest under, or null for root" },
                progress: { type: "number", description: "The task progress ratio (0.0-1.0)", minimum: 0, maximum: 1 },
              },
              required: ["id", "text", "start_date", "duration", "parent", "progress"],
            },
            minItems: 1,
          },
        },
        required: ["projectName", "tasks",],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_tasks",
      description:
        `If the user wants to delete one, several or all tasks. Turn a free-form description into a array of Gantt tasks. 
        Returns ready-to-parse 'tasks[]'`,
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            description: "Flat list of task objects exactly as dhtmlxGantt expects.",
            items: {
              type: "object",
              properties: {
                id: { type: ["string", "number"] },
                text: { type: "string" },
                start_date: { type: "string", format: "date", description: "ISO-8601 start date (e.g. 2025-05-01)" },
                duration: { type: "number", description: "Duration is always an integer" },
                parent: { type: ["string", "number", "null"], description: "Task ID to nest under, or null for root" },
                progress: { type: "number", description: "The task progress ratio (0.0-1.0)", minimum: 0, maximum: 1 },
              },
              required: ["id", "text", "start_date", "duration", "parent", "progress"],
            },
            minItems: 1,
          },
        },
        required: ["projectName", "tasks",],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_all",
      description: "Clear all tasks, links, markers, and layers from the Gantt.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Create a new task (optionally under a parent).",
      parameters: {
        type: "object",
        properties: {
          id: { type: ["string", "number"] },
          text: { type: "string" },
          start_date: { type: "string", format: "date", description: "ISO-8601 start date (e.g. 2025-05-01)" },
          duration: { type: "number", description: "Duration is always an integer" },
          parent: { type: ["string", "number", "null"], description: "Task ID to nest under, or null for root" },
        },
        required: ["text", "start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "split_task",
      description:
        "Replace a single task and its child tasks(if they exist), with updated child tasks(according to the split_placement property) and optionally wire Finish-to-Start links between them.",
      parameters: {
        type: "object",
        properties: {
          id: { type: ["string", "number"], description: "Task to split" },
          subtasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: ["string", "number"] },
                text: { type: "string" },
                start_date: { type: "string", format: "date", description: "ISO-8601 start date (e.g. 2025-05-01)" },
                duration: { type: "number", description: "Duration is always an integer" },
                split_placement : {type: "string", description: "'auto' (default) - a subtask is rendered as a subrow, 'inline' - a subtask is rendered on the parent row, 'subrow' - a subtask is rendered as a subrow"}
              },
              required: ["id", "text", "start_date", "duration", "split_placement"],
            },
            minItems: 1,
          },
          addFSLinks: { type: "boolean", description: "If true, chain the new subtasks Finish→Start" },
        },
        required: ["id", "subtasks"],
      },
    },
  },

  /* 2 ─────────────────────────  DEPENDENCIES(LINKS)  ─────────────────────────── */
  {
    type: "function",
    function: {
      name: "add_links",
      description: "If the user wants to create, add one, several or all links. Turn a free-form description into a array of Gantt links. Returns ready-to-parse 'links[]'",
      parameters: {
        type: "object",
          properties: {
          links: {
            type: "array",
            description: "Flat list of link objects exactly as dhtmlxGantt expects.",
            items: {
              type: "object",
              properties: {
                id: { type: ["string", "number"], description: "ID of the link" },
                source: { type: ["string", "number"], description: "ID of the source task" },
                target: { type: ["string", "number"], description: "ID of the target task" },
                type: {
                  type: "string",
                  enum: ["0", "1", "2", "3"],
                  description: "0 is Finish to Start, 1 is Start to Start, 2 is Finish to Finish, 3 is Start to Finish",
                },
              },
            },
            minItems: 1,
          },
        },
        required: ["source", "target", "type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_links",
      description: "If the user wants to delete one, several or all links. Turn a free-form description into a array of Gantt links. Returns ready-to-parse 'links[]'",
      parameters: {
        type: "object",
          properties: {
          links: {
            type: "array",
            description: "Flat list of link objects exactly as dhtmlxGantt expects.",
            items: {
              type: "object",
              properties: {
                id: { type: ["string", "number"], description: "ID of the link" },
                source: { type: ["string", "number"], description: "ID of the source task" },
                target: { type: ["string", "number"], description: "ID of the target task" },
                type: {
                  type: "string",
                  enum: ["0", "1", "2", "3"],
                  description: "0 is Finish to Start, 1 is Start to Start, 2 is Finish to Finish, 3 is Start to Finish",
                },
              },
            },
            minItems: 1,
          },
        },
        required: ["source", "target", "type", "id"],
      },
    },
  },

  /* 3 ─────────────────────────────  VIEW  ─────────────────────────────── */
  {
    type: "function",
    function: {
      name: "zoom",
      description: "Change timeline zoom level or fit entire project into view.",
      parameters: {
        type: "object",
        properties: {
          level: {
            type: "string",
            enum: ["hour", "day", "week", "month", "quarter", "year", "fit"],
          },
        },
        required: ["level"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "style_task",
      description: "Apply a color or CSS class to call attention to a task.",
      parameters: {
        type: "object",
        properties: {
          id: { type: ["string", "number"], description: "Task id or 'all' to style all tasks" },
          color: { type: "string", description: "CSS color, e.g. #FF0000" },
        },
        required: ["id", "color"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "style_link",
      description: "Change the color of a dependency link",
      parameters: {
        type: "object",
        properties: {
          id: { type: ["string", "number"], description: "Link id or 'all' to style all links" },
          color: { type: "string", description: "CSS color, e.g. #FF0000" },
        },
        required: ["id", "color"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_link_width",
      description: "Set the width of dependency links",
      parameters: {
        type: "object",
        properties: {
          width: { type: "number" },
        },
        required: ["width"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_links",
      description: "Show or hide dependency links in the Gantt Chart",
      parameters: {
        type: "object",
        properties: {
          show: { type: "boolean" },
        },
        required: ["show"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_text_color",
      description: "Change the color of the text inside the task bar ",
      parameters: {
        type: "object",
        properties: {
          id: { type: ["string", "number"], description: "Task id or 'all' to style the text of all tasks" },
          color: { type: "string" },
        },
        required: ["id", "color"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_progress_color",
      description: "Change the color of the task progress bar",
      parameters: {
        type: "object",
        properties: {
          id: { type: ["string", "number"], description: "Task id or 'all' to style progress bars of all tasks" },
          color: { type: "string" },
        },
        required: ["id", "color"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_task_tooltip",
      description: "Enable or disable the tooltip for the tasks",
      parameters: {
        type: "object",
        properties: {
          enable: { type: "boolean" },
        },
        required: ["enable"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_marker",
      description: "Add a marker to the timeline area (e.g. highlight a date).",
      parameters: {
        type: "object",
        properties: {
          id: { type: ["string", "number"], description: "Marker ID" },
          start_date: { type: "string", format: "date", description: "ISO date for marker (e.g. 2025-07-01)" },
          text: { type: "string", description: "Label text (e.g. today, start)" },
          title: {
            type: "string",
            description:
              "The marker's tooltip that has the following format: the label text + the date specified in the start_date field converted to a string (e.g. Today 20 July 2025)",
          },
        },
        required: ["id", "start_date", "text", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_scales",
      description: "Set custom timelines and weekend highlights optionally",
      parameters: {
        type: "object",
        properties: {
          scales: {
            type: "array",
            description: "Array of scale configurations for gantt.config.scales",
            items: {
              type: "object",
              properties: {
                unit: { type: "string", description: "Scale units: minute, hour, day, week, month, year" },
                step: { type: "number", description: "Default step - 1" },
                format: {
                  type: ["string", "null"],
                  description:
                    "Date output format (format string or null). Available formats: %d, %j, %M, %m, %n, %F, %W, %w, %y, %Y, %W, %D, %l, %H, %h, %i, %g, %G, %s, %a, %A",
                },
                cssClass: {
                  type: ["string", "null"],
                  description: "CSS class for weekend highlighting (e.g. 'weekend')",
                  default: "weekend",
                },
              },
              required: ["unit", "step"],
            },
          },
        },
        required: ["scales"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_skin",
      description:
        "Set a skin (theme) for the Gantt chart, one of: terrace, dark, material, contrast-white, contrast-black, skyblue, meadow, broadway",
      parameters: {
        type: "object",
        properties: {
          skin: {
            type: "string",
            description: "Name of the skin to apply",
            enum: ["terrace", "dark", "material", "contrast-white", "contrast-black", "skyblue", "meadow", "broadway"],
          },
        },
        required: ["skin"],
      },
    },
  },

  /* 4 ───────────────────────────  SCHEDULING  ─────────────────────────── */
  {
    type: "function",
    function: {
      name: "autoschedule",
      description: "Run Gantt auto-scheduling (entire project or from a given task).",
      parameters: {
        type: "object",
        properties: {
          anchorTaskId: {
            type: ["string", "number", "null"],
            description: "Task to start from or null for full project",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "hide_weekdays",
      description: "Hide specified days of the week on the chart (0-Sunday … 6-Saturday)",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "array",
            description:
              "Array of weekdays to be hidden. Weekdays and their indexes: 0 - Sunday, 1 - Monday, 2 - Tuesday, 3 - Wednesday, 4 - Thursday, 5 - Friday, 6 - Saturday",
            items: {
              type: "integer",
              enum: [0, 1, 2, 3, 4, 5, 6],
            },
            minItems: 1,
          },
        },
        required: ["days"],
      },
    },
  },

  /* 5 ────────────────────────────  SYSTEM  ────────────────────────────── */
  {
    type: "function",
    function: {
      name: "undo",
      description: "Undo the last user-visible action.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "export_png",
      description: "Trigger client-side `gantt.exportToPNG()` with an optional file name.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "File name, default gantt.png" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "export_to_pdf",
      description:
        "Export the current Gantt chart view to a PDF file using gantt.exportToPDF() with an optional file name.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "File name, default gantt.pdf",
          },
          raw: {
            type: "boolean",
            description: "Include all HTML markup and custom styles",
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'highlight_critical_path',
      description: 'Highlight the critical path in the Gantt chart.',
      parameters: {
        type: 'object',
        properties: {
          enable: { type: 'boolean' },
        },
        required: ['enable'],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "skip_command",
      description: "Use this function when the user request does not match any other Gantt functionality described in schema list. If the description doesn't fit to any of the provided tool functions use 'skip_command'",
      parameters: { 
        type: "object", 
        properties: {}, 
        required: [] 
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_gantt_state",
      description: "Return the current state of Gantt tasks[], links[] (optionally)",
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            description: "Flat list of task objects exactly from dhtmlxGantt",
            items: {
              type: "object",
              properties: {
                id: { type: ["string", "number"] },
                text: { type: "string" },
                start_date: { type: "string", format: "date", description: "ISO-8601 start date (e.g. 2025-05-01)" },
                duration: { type: "number", description: "Duration is always an integer" },
                parent: { type: ["string", "number"], description: "Task ID to nest under, or 0 for root" },
                progress: { type: "number", description: "The task progress ratio (0.0-1.0)", minimum: 0, maximum: 1 },
              },
              required: ["id", "text", "start_date", "duration", "parent", "progress"],
            },
            minItems: 1,
          },
          links: {
            type: "array",
            description: "Optional dependency list; same fields as `add_link` uses.",
            items: {
              type: "object",
              properties: {
                id: { type: ["string", "number"] },
                source: { type: ["string", "number"] },
                target: { type: ["string", "number"] },
                type: {
                  type: "string",
                  enum: ["0", "1", "2", "3"],
                  description: "0 is Finish to Start, 1 is Start to Start, 2 is Finish to Finish, 3 is Start to Finish",
                },
              },
              required: ["id", "source", "target", "type"],
            },
            minItems: 0,
          },
        },
        required: ["projectName", "tasks", "links"],
      },
    },
  },
];
