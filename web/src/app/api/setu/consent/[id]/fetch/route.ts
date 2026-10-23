import { createDataSession, getDataSession, listDataSessions, mapFiToLedger } from "@/lib/setu";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { userId?: string };
    let sessionId = "";
    try {
      const session = await createDataSession(id);
      sessionId = session.id;
    } catch (error) {
      const existing = await listDataSessions(id);
      sessionId = existing[0]?.sessionId ?? "";
      if (!sessionId) throw error;
    }
    let current = (await getDataSession(sessionId)) as Record<string, unknown>;
    for (let i = 0; i < 8; i += 1) {
      const status = String(current.status ?? "");
      if (status === "PARTIAL" || status === "COMPLETED") break;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      current = (await getDataSession(sessionId)) as Record<string, unknown>;
    }
    const ledger = mapFiToLedger(current, body.userId ?? "usr_local");
    return Response.json({
      ok: true,
      sessionId,
      status: current.status,
      accounts: ledger.accounts,
      transactions: ledger.transactions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FI fetch failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
