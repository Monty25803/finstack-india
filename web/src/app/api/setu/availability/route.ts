import { checkAccountAvailability } from "@/lib/setu";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { mobileNumber?: string };
    const accounts = await checkAccountAvailability(body.mobileNumber ?? "9999999999");
    return Response.json({ ok: true, accounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Availability failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
