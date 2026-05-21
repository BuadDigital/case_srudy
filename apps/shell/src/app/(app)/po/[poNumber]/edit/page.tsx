import { PoHeaderEditRoute } from "@/components/views/po-routes/PoHeaderEditRoute";
import { decodePoParam } from "@/lib/po-routes";

export default async function PoHeaderEditPage({
  params,
}: {
  params: Promise<{ poNumber: string }>;
}) {
  const { poNumber } = await params;
  return <PoHeaderEditRoute poNumber={decodePoParam(poNumber)} />;
}
