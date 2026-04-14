import type { ChatCompletionTool } from "openai/resources/index.mjs";

const taskProperties = {
  id: { type: ["string", "number"] },
  text: { type: "string" },
  start_date: {
    type: "string",
    format: "date",
    description: "ISO-8601 start date, for example 2025-05-01",
  },
  duration: {
    type: "number",
    description: "Task duration in whole chart units",
  },
  parent: {
    type: ["string", "number", "null"],
    description: "Parent task id, or null for root",
  },
  progress: {
    type: "number",
    description: "Task progress ratio from 0 to 1",
    minimum: 0,
    maximum: 1,
  },
  end_date: {
    type: "string",
    format: "date",
    description: "Optional ISO-8601 end date, for example 2025-05-10",
  },
} as const;

const fullTaskSchema = {
  type: "object",
  additionalProperties: false,
  properties: taskProperties,
  required: ["id", "text", "start_date", "duration", "parent", "progress"],
} as const;

const partialTaskSchema = {
  type: "object",
  additionalProperties: false,
  properties: taskProperties,
  required: ["id"],
} as const;

const deleteTaskSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: taskProperties.id,
  },
  required: ["id"],
} as const;

const linkProperties = {
  id: { type: ["string", "number"], description: "Link id" },
  source: { type: ["string", "number"], description: "Source task id" },
  target: { type: ["string", "number"], description: "Target task id" },
  type: {
    type: "string",
    enum: ["0", "1", "2", "3"],
    description:
      "0 is Finish to Start, 1 is Start to Start, 2 is Finish to Finish, 3 is Start to Finish",
  },
} as const;

const fullLinkSchema = {
  type: "object",
  additionalProperties: false,
  properties: linkProperties,
  required: ["id", "source", "target", "type"],
} as const;

const addLinkSchema = {
  type: "object",
  additionalProperties: false,
  properties: linkProperties,
  required: ["source", "target", "type"],
} as const;

const deleteLinkSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: linkProperties.id,
  },
  required: ["id"],
} as const;

const scalesItemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    unit: {
      type: "string",
      description: "Scale unit: minute, hour, day, week, month, or year",
    },
    step: { type: "number", description: "Scale step size" },
    format: {
      type: ["string", "null"],
      description: "Optional DHTMLX date format string",
    },
    cssClass: {
      type: ["string", "null"],
      description: "Optional CSS class hint for special styling",
    },
  },
  required: ["unit", "step"],
} as const;

export const schemaList: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "generate_project",
      description:
        "Generate a full project tree with tasks and optional links, ready for gantt.parse().",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          tasks: {
            type: "array",
            items: fullTaskSchema,
            minItems: 1,
          },
          links: {
            type: "array",
            items: fullLinkSchema,
          },
        },
        required: ["tasks", "links"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_tasks",
      description:
        "Create multiple tasks and optional links from the user's request.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          tasks: {
            type: "array",
            items: fullTaskSchema,
            minItems: 1,
          },
          links: {
            type: "array",
            items: fullLinkSchema,
          },
        },
        required: ["tasks", "links"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_tasks",
      description:
        "Update one or more existing tasks. Include each task id and only the fields that should change.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          tasks: {
            type: "array",
            items: partialTaskSchema,
            minItems: 1,
          },
        },
        required: ["tasks"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_tasks",
      description: "Delete one or more existing tasks by id.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          tasks: {
            type: "array",
            items: deleteTaskSchema,
            minItems: 1,
          },
        },
        required: ["tasks"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_all",
      description: "Clear all tasks, links, markers, and layers from the Gantt.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Create a single new task, optionally under a parent task.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: taskProperties.id,
          text: taskProperties.text,
          start_date: taskProperties.start_date,
          duration: taskProperties.duration,
          parent: taskProperties.parent,
          progress: taskProperties.progress,
        },
        required: ["text", "start_date", "duration"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "split_task",
      description:
        "Replace a task with generated subtasks and optionally connect them with Finish-to-Start links.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: ["string", "number"],
            description: "Existing task id to split",
          },
          subtasks: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                text: { type: "string" },
                start_date: taskProperties.start_date,
                duration: taskProperties.duration,
                split_placement: {
                  type: "string",
                  enum: ["auto", "inline", "subrow"],
                  description:
                    "How the subtask should be rendered relative to the parent row",
                },
              },
              required: ["text", "start_date", "duration"],
            },
          },
          addFSLinks: {
            type: "boolean",
            description: "Whether to connect generated subtasks with FS links",
          },
        },
        required: ["id", "subtasks"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_links",
      description: "Create one or more dependency links.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          links: {
            type: "array",
            items: addLinkSchema,
            minItems: 1,
          },
        },
        required: ["links"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_links",
      description: "Delete one or more dependency links by id.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          links: {
            type: "array",
            items: deleteLinkSchema,
            minItems: 1,
          },
        },
        required: ["links"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "zoom",
      description: "Change the timeline zoom level or fit the full chart into view.",
      parameters: {
        type: "object",
        additionalProperties: false,
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
      description: "Apply a color to a task or to all tasks.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: ["string", "number"],
            description: "Task id or all",
          },
          color: { type: "string", description: "CSS color value" },
        },
        required: ["id", "color"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "style_link",
      description: "Apply a color to a dependency link or to all links.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: ["string", "number"],
            description: "Link id or all",
          },
          color: { type: "string", description: "CSS color value" },
        },
        required: ["id", "color"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_link_width",
      description: "Set the width of dependency links.",
      parameters: {
        type: "object",
        additionalProperties: false,
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
      description: "Show or hide dependency links.",
      parameters: {
        type: "object",
        additionalProperties: false,
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
      description: "Change the text color inside a task bar.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: ["string", "number"],
            description: "Task id or all",
          },
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
      description: "Change the progress bar color for a task or for all tasks.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: ["string", "number"],
            description: "Task id or all",
          },
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
      description: "Enable or disable task tooltips.",
      parameters: {
        type: "object",
        additionalProperties: false,
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
      description: "Add a marker to the timeline.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: ["string", "number"] },
          start_date: {
            type: "string",
            format: "date",
            description: "ISO marker date",
          },
          text: { type: "string", description: "Marker label" },
          title: {
            type: "string",
            description: "Marker tooltip text",
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
      description: "Set custom chart scales.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          scales: {
            type: "array",
            items: scalesItemSchema,
            minItems: 1,
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
      description: "Set the chart skin or theme.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          skin: {
            type: "string",
            enum: [
              "terrace",
              "dark",
              "material",
              "contrast-white",
              "contrast-black",
              "skyblue",
              "meadow",
              "broadway",
            ],
          },
        },
        required: ["skin"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "autoschedule",
      description:
        "Run auto-scheduling for the whole chart or starting from a specific task.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          anchorTaskId: {
            type: ["string", "number", "null"],
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
      description: "Hide one or more weekdays on the chart.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          days: {
            type: "array",
            minItems: 1,
            items: {
              type: "integer",
              enum: [0, 1, 2, 3, 4, 5, 6],
            },
          },
        },
        required: ["days"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "undo",
      description: "Undo the last user-visible action.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "export_png",
      description: "Export the current Gantt chart to PNG.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", description: "Optional file name" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "export_to_pdf",
      description: "Export the current Gantt chart to PDF.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", description: "Optional file name" },
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
    type: "function",
    function: {
      name: "highlight_critical_path",
      description: "Enable or disable critical path highlighting.",
      parameters: {
        type: "object",
        additionalProperties: false,
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
      name: "get_gantt_state",
      description:
        "Read the current chart state, including tasks and links, when the request depends on existing Gantt data.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {},
        required: [],
      },
    },
  },
];
