import { listSetuFips } from "@/lib/setu";

export async function GET() {
  try {
    const fips = await listSetuFips();
    return Response.json({
      ok: true,
      sandbox: true,
      count: fips.length,
      banks: fips.slice(0, 12).map((fip) => fip.name ?? fip.id ?? fip.fipId ?? "Unknown FIP"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setu request failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
