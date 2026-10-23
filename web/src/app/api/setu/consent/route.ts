import { createSetuConsent } from "@/lib/setu";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { mobileNumber?: string };
    const consent = await createSetuConsent(body.mobileNumber ?? "9999999999");
    return Response.json({ ok: true, consent });
  } catch (error) {
    const err = error as Error & { status?: number; code?: string };
    return Response.json(
      { ok: false, error: err.message, code: err.code ?? "CreateConsentFailed" },
      { status: err.status && err.status >= 400 ? err.status : 500 },
    );
  }
}
