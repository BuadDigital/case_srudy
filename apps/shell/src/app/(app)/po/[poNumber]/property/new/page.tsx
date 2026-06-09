import { PoPropertyCreateRoute } from "@case-study/mfe";
import { decodePoParam } from "@case-study/mfe";
export default async function PoPropertyNewPage({
  params,
}: {
  params: Promise<{ poNumber: string }>;
}) {
  const { poNumber } = await params;
  return <PoPropertyCreateRoute poNumber={decodePoParam(poNumber)} />;
}
