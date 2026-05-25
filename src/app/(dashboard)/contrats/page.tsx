import Link from "next/link";
import { ContractStatus } from "@prisma/client";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/stat-card";
import {
  contractStatusClass,
  contractStatusLabel,
  contractTemplateLabel,
} from "@/lib/contracts";
import { formatDateFr } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams?: Promise<{ status?: string; q?: string }>;
};

export default async function ContratsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = sp.q?.trim() ?? "";
  const statusFilter =
    sp.status &&
    Object.values(ContractStatus).includes(sp.status as ContractStatus)
      ? (sp.status as ContractStatus)
      : undefined;

  const contracts = await prisma.contract.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { client: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
    },
  });

  const counts = await prisma.contract.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all]),
  ) as Partial<Record<ContractStatus, number>>;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Contrats"
        description="Création, remplissage et signature des lettres de mission, conventions d'honoraires et accords clients."
        action={<ButtonLink href="/contrats/new">Nouveau contrat</ButtonLink>}
      />

      <div className="flex flex-wrap gap-2">
        <FilterChip href="/contrats" label="Tous" active={!statusFilter} />
        {(
          [
            "DRAFT",
            "PENDING_SIGNATURE",
            "SIGNED",
            "CANCELLED",
          ] as ContractStatus[]
        ).map((s) => (
          <FilterChip
            key={s}
            href={`/contrats?status=${s}`}
            label={`${contractStatusLabel(s)}${countByStatus[s] != null ? ` (${countByStatus[s]})` : ""}`}
            active={statusFilter === s}
          />
        ))}
      </div>

      <form method="get" className="flex gap-2">
        {statusFilter && (
          <input type="hidden" name="status" value={statusFilter} />
        )}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher par titre ou client…"
          className="ui-input flex-1"
        />
        <button type="submit" className="ui-btn ui-btn-secondary">
          Rechercher
        </button>
      </form>

      <Panel className="divide-y divide-slate-100">
        {contracts.map((c) => (
          <Link
            key={c.id}
            href={`/contrats/${c.id}`}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-emerald-50"
          >
            <div>
              <p className="font-medium text-slate-900">{c.title}</p>
              <p className="text-xs text-slate-500">
                {c.client.name} · {contractTemplateLabel(c.templateType)}
                {c.createdBy ? ` · ${c.createdBy.name}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${contractStatusClass(c.status)}`}
              >
                {contractStatusLabel(c.status)}
              </span>
              <span className="text-xs text-slate-500">
                {c.signedAt
                  ? `Signé le ${formatDateFr(c.signedAt)}`
                  : `Modifié le ${formatDateFr(c.updatedAt)}`}
              </span>
            </div>
          </Link>
        ))}
      </Panel>

      {contracts.length === 0 && (
        <p className="text-center text-sm text-slate-500">
          Aucun contrat pour le moment.{" "}
          <Link href="/contrats/new" className="text-theme-link font-medium hover:underline">
            Créer un contrat
          </Link>
        </p>
      )}
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-emerald-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </Link>
  );
}
