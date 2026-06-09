import { PoHeaderEditRoute } from "@case-study/mfe";
import { decodePoParam } from "@case-study/mfe";
export default async function PoHeaderEditPage({
  params,
}: {
  params: Promise<{ poNumber: string }>;
}) {
  const { poNumber } = await params;
  return <PoHeaderEditRoute poNumber={decodePoParam(poNumber)} />;
}
