import { PoPropertyCreateRoute } from "@/components/views/po-routes/PoPropertyCreateRoute";
import { decodePoParam } from "@/lib/po-routes";
export default async function PoPropertyNewPage({
  params,
}: {
  params: Promise<{ poNumber: string }>;
}) {
  const { poNumber } = await params;
  return <PoPropertyCreateRoute poNumber={decodePoParam(poNumber)} />;
}
