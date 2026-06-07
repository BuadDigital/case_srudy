import { PoPropertyEditRoute } from "@/components/views/po-routes/PoPropertyEditRoute";
import { decodePoParam } from "@/lib/po-routes";
export default async function PoPropertyEditPage({
  params,
}: {
  params: Promise<{ poNumber: string; propertyId: string }>;
}) {
  const { poNumber, propertyId } = await params;
  return (
    <PoPropertyEditRoute
      poNumber={decodePoParam(poNumber)}
      propertyId={decodePoParam(propertyId)}
    />
  );
}
