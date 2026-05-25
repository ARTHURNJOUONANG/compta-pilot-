import type { ContractStatus, ContractTemplateType } from "@prisma/client";

const statusLabels: Record<ContractStatus, string> = {
  DRAFT: "Brouillon",
  PENDING_SIGNATURE: "En attente de signature",
  SIGNED: "Signé",
  CANCELLED: "Annulé",
};

const templateLabels: Record<ContractTemplateType, string> = {
  LETTRE_MISSION: "Lettre de mission",
  CONVENTION_HONORAIRES: "Convention d'honoraires",
  ENGAGEMENT_ACOMPTE: "Engagement & acompte",
  ACCORD_RGPD: "Accord RGPD",
};

export function contractStatusLabel(s: ContractStatus) {
  return statusLabels[s] ?? s;
}

export function contractTemplateLabel(t: ContractTemplateType) {
  return templateLabels[t] ?? t;
}

export function contractStatusClass(s: ContractStatus): string {
  switch (s) {
    case "DRAFT":
      return "bg-slate-100 text-slate-800 ring-slate-500/15";
    case "PENDING_SIGNATURE":
      return "bg-amber-100 text-amber-900 ring-amber-500/20";
    case "SIGNED":
      return "bg-emerald-100 text-emerald-800 ring-emerald-600/20";
    case "CANCELLED":
      return "bg-rose-100 text-rose-800 ring-rose-500/20";
    default:
      return "bg-slate-100 text-slate-800";
  }
}
