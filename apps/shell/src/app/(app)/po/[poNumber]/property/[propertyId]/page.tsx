import { PoPropertyDetailPage } from "@case-study/mfe";
import { decodePoParam } from "@case-study/mfe";
export default async function PoPropertyDetailRoutePage({
  params,
}: {
  params: Promise<{ poNumber: string; propertyId: string }>;
}) {
  const { poNumber, propertyId } = await params;
  return (
    <PoPropertyDetailPage
      poNumber={decodePoParam(poNumber)}
      propertyId={decodePoParam(propertyId)}
    />
  );
}
