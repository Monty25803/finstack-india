import { getSetuConsent } from "@/lib/setu";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const consent = await getSetuConsent(id);
    return Response.json({ ok: true, consent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Get consent failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
