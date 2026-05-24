import type { TaskPriority, TaskStatus } from "@prisma/client";
import { taskPriorityLabel, taskStatusLabel } from "@/lib/labels";

const statusClass: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-800 ring-slate-500/15",
  IN_PROGRESS: "bg-sky-100 text-sky-900 ring-sky-500/20",
  IN_VALIDATION: "bg-amber-100 text-amber-900 ring-amber-500/20",
  DONE: "bg-emerald-100 text-emerald-900 ring-emerald-600/20",
};

const priorityClass: Record<TaskPriority, string> = {
  URGENT: "bg-rose-100 text-rose-900 ring-rose-500/25",
  IMPORTANT: "bg-orange-100 text-orange-900 ring-orange-500/20",
  NORMAL: "bg-slate-100 text-slate-700 ring-slate-500/15",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusClass[status]}`}
    >
      {taskStatusLabel(status)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${priorityClass[priority]}`}
    >
      {taskPriorityLabel(priority)}
    </span>
  );
}
