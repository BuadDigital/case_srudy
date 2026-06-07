import { PoPropertyDetailPage } from "@/components/views/PoPropertyDetailPage";
import { decodePoParam } from "@/lib/po-routes";
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
