import type { ContractTemplateType } from "@prisma/client";

export type ContractFieldDef = {
  key: string;
  label: string;
  type: "text" | "date" | "number" | "textarea";
  placeholder?: string;
  required?: boolean;
  /** Préremplissage depuis la fiche client */
  fromClient?: "name" | "siret" | "email" | "phone" | "notes";
  /** Valeur par défaut fixe */
  defaultValue?: string;
};

export type ContractTemplateDef = {
  type: ContractTemplateType;
  label: string;
  description: string;
  fields: ContractFieldDef[];
  body: string;
};

export const CONTRACT_TEMPLATES: ContractTemplateDef[] = [
  {
    type: "LETTRE_MISSION",
    label: "Lettre de mission",
    description:
      "Définit le périmètre des missions confiées au cabinet et les obligations réciproques.",
    fields: [
      { key: "date_contrat", label: "Date du contrat", type: "date", required: true },
      { key: "cabinet_nom", label: "Nom du cabinet", type: "text", required: true, defaultValue: "Cabinet Compta Pilot" },
      { key: "cabinet_adresse", label: "Adresse du cabinet", type: "textarea", required: true },
      { key: "client_nom", label: "Client (raison sociale)", type: "text", required: true, fromClient: "name" },
      { key: "client_siret", label: "SIRET client", type: "text", fromClient: "siret" },
      { key: "client_adresse", label: "Adresse client", type: "textarea" },
      { key: "missions", label: "Missions confiées", type: "textarea", required: true, defaultValue: "Tenue de comptabilité, établissement des déclarations fiscales et sociales, conseil en gestion." },
      { key: "honoraires", label: "Modalités d'honoraires", type: "textarea", required: true, defaultValue: "Honoraires forfaitaires mensuels selon devis joint. Facturation trimestrielle." },
      { key: "duree", label: "Durée / reconduction", type: "text", defaultValue: "Contrat à durée indéterminée, reconductible tacitement par périodes de 12 mois." },
    ],
    body: `LETTRE DE MISSION

Entre les soussignés

Le cabinet {{cabinet_nom}}, dont le siège est situé {{cabinet_adresse}}, représenté par {{cabinet_signataire}}, ci-après « le Cabinet »,

D'une part,

Et

{{client_nom}}, SIRET {{client_siret}}, domicilié {{client_adresse}}, représenté par {{client_signataire}}, ci-après « le Client »,

D'autre part,

Il a été convenu ce qui suit :

Article 1 : Objet du contrat
Le Client confie au Cabinet les missions suivantes :
{{missions}}

Article 2 : Honoraires
{{honoraires}}

Article 3 : Durée
{{duree}}

Article 4 : Responsabilité
Le Cabinet exécute sa mission conformément aux règles professionnelles de l'Ordre des experts-comptables.`,
  },
  {
    type: "CONVENTION_HONORAIRES",
    label: "Convention d'honoraires",
    description: "Tarification, facturation et conditions de paiement.",
    fields: [
      { key: "date_contrat", label: "Date", type: "date", required: true },
      { key: "client_nom", label: "Client", type: "text", required: true, fromClient: "name" },
      { key: "forfait_mensuel", label: "Forfait mensuel (€ HT)", type: "number", required: true },
      { key: "taux_horaire", label: "Taux horaire complémentaire (€ HT)", type: "number", defaultValue: "95" },
      { key: "delai_paiement", label: "Délai de paiement", type: "text", defaultValue: "30 jours fin de mois" },
      { key: "penalites", label: "Pénalités de retard", type: "text", defaultValue: "Taux légal en vigueur + indemnité forfaitaire de 40 € pour frais de recouvrement." },
      { key: "acompte", label: "Acompte à la signature (€ HT)", type: "number", defaultValue: "0" },
    ],
    body: `CONVENTION D'HONORAIRES

Entre les soussignés

Le cabinet et le client {{client_nom}}, à la date du {{date_contrat}}.

Il a été convenu ce qui suit :

Article 1 : Tarification
Forfait mensuel : {{forfait_mensuel}} € HT.
Heures supplémentaires : {{taux_horaire}} € HT / heure.
Acompte à la signature : {{acompte}} € HT.

Article 2 : Facturation et paiement
{{delai_paiement}}

Article 3 : Retard de paiement
{{penalites}}

Les parties reconnaissent avoir pris connaissance des présentes conditions.`,
  },
  {
    type: "ENGAGEMENT_ACOMPTE",
    label: "Engagement & acompte",
    description: "Confirmation d'engagement et versement d'un acompte.",
    fields: [
      { key: "date_contrat", label: "Date", type: "date", required: true },
      { key: "client_nom", label: "Client", type: "text", required: true, fromClient: "name" },
      { key: "montant_acompte", label: "Montant acompte (€ TTC)", type: "number", required: true },
      { key: "mission_precise", label: "Mission concernée", type: "textarea", required: true },
      { key: "echeance_solde", label: "Échéance du solde", type: "text", defaultValue: "À la remise des livrables" },
    ],
    body: `ENGAGEMENT ET ACOMPTE

Entre les soussignés

Le Client {{client_nom}} et le Cabinet, à la date du {{date_contrat}}.

Il a été convenu ce qui suit :

Article 1 : Objet
Le Client s'engage à verser un acompte de {{montant_acompte}} € TTC au titre de la mission suivante :
{{mission_precise}}

Article 2 : Solde
Le solde sera exigible : {{echeance_solde}}.`,
  },
  {
    type: "ACCORD_RGPD",
    label: "Accord RGPD / confidentialité",
    description: "Traitement des données personnelles et confidentialité.",
    fields: [
      { key: "date_contrat", label: "Date", type: "date", required: true },
      { key: "cabinet_nom", label: "Cabinet", type: "text", defaultValue: "Cabinet Compta Pilot" },
      { key: "client_nom", label: "Client", type: "text", required: true, fromClient: "name" },
      { key: "duree_conservation", label: "Durée de conservation", type: "text", defaultValue: "Durée légale applicable aux documents comptables et fiscaux." },
      { key: "contact_dpo", label: "Contact données", type: "text", defaultValue: "dpo@cabinet.fr" },
    ],
    body: `ACCORD RELATIF À LA PROTECTION DES DONNÉES

Entre les soussignés

{{cabinet_nom}}, responsable de traitement pour ses propres obligations, et {{client_nom}}, client, à la date du {{date_contrat}}.

D'une part,

D'autre part,

Il a été convenu ce qui suit :

Article 1 : Traitement des données
Le Cabinet traite les données nécessaires à l'exécution des missions comptables et fiscales.

Article 2 : Conservation
{{duree_conservation}}

Article 3 : Contact
{{contact_dpo}}

Article 4 : Droits du Client
Le Client reconnaît avoir été informé de ses droits (accès, rectification, effacement, limitation, opposition).`,
  },
];

export function getContractTemplate(
  type: ContractTemplateType,
): ContractTemplateDef {
  const t = CONTRACT_TEMPLATES.find((x) => x.type === type);
  if (!t) throw new Error("Modèle de contrat introuvable");
  return t;
}

export function buildDefaultFields(
  template: ContractTemplateDef,
  client: {
    name: string;
    siret: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
  },
): Record<string, string> {
  const today = new Date().toISOString().slice(0, 10);
  const out: Record<string, string> = {};

  for (const f of template.fields) {
    if (f.defaultValue !== undefined) {
      out[f.key] = f.defaultValue;
    } else if (f.fromClient) {
      const v = client[f.fromClient];
      out[f.key] = v ?? "";
    } else if (f.type === "date" && f.key.includes("date")) {
      out[f.key] = today;
    } else {
      out[f.key] = "";
    }
  }

  return out;
}

export function renderContractBody(
  body: string,
  fields: Record<string, string>,
  signers?: { cabinet?: string; client?: string },
): string {
  let text = body;
  for (const [key, value] of Object.entries(fields)) {
    text = text.replaceAll(`{{${key}}}`, value || "—");
  }
  if (signers?.cabinet) {
    text = text.replaceAll("{{cabinet_signataire}}", signers.cabinet);
  }
  if (signers?.client) {
    text = text.replaceAll("{{client_signataire}}", signers.client);
  }
  text = text.replaceAll(/\{\{[a-z0-9_]+\}\}/gi, "—");
  return text;
}
