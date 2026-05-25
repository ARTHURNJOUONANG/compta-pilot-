import { ContractStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import {
  contractPdfFilename,
  generateContractPdfBuffer,
} from "@/lib/contract-pdf";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, email: true, siret: true } },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  }

  if (contract.status !== ContractStatus.SIGNED) {
    return NextResponse.json(
      { error: "Le PDF est disponible uniquement pour un contrat signé." },
      { status: 400 },
    );
  }

  try {
    const buffer = await generateContractPdfBuffer(contract);
    const filename = contractPdfFilename(contract);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
