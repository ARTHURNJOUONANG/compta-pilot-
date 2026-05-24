import type {
  DocumentCategory,
  OcrStatus,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";

const statusLabels: Record<TaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  IN_VALIDATION: "En validation",
  DONE: "Terminé",
};

const priorityLabels: Record<TaskPriority, string> = {
  URGENT: "Urgent",
  IMPORTANT: "Important",
  NORMAL: "Normal",
};

export function taskStatusLabel(s: TaskStatus) {
  return statusLabels[s] ?? s;
}

export function taskPriorityLabel(p: TaskPriority) {
  return priorityLabels[p] ?? p;
}

const documentCategoryLabels: Record<DocumentCategory, string> = {
  FACTURE: "Facture",
  JUSTIFICATIF: "Justificatif",
  CONTRAT: "Contrat",
  AUTRE: "Autre",
};

export function documentCategoryLabel(c: DocumentCategory) {
  return documentCategoryLabels[c] ?? c;
}

const ocrStatusLabels: Record<OcrStatus, string> = {
  PENDING: "En attente",
  PROCESSING: "En cours",
  DONE: "Terminé",
  FAILED: "Échec",
  SKIPPED: "Non applicable",
};

export function ocrStatusLabel(s: OcrStatus) {
  return ocrStatusLabels[s] ?? s;
}

export function roleLabel(role: string) {
  switch (role) {
    case "DIRECTOR":
      return "Dirigeant";
    case "MANAGER":
      return "Manager";
    case "COLLABORATOR":
      return "Collaborateur";
    default:
      return role;
  }
}
