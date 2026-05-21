import { PoPropertyFailureRoute } from "@/components/views/po-routes/PoPropertyFailureRoute";
import { decodePoParam } from "@/lib/po-routes";

export default async function PoPropertyFailurePage({
  params,
}: {
  params: Promise<{ poNumber: string; propertyId: string }>;
}) {
  const { poNumber, propertyId } = await params;
  return (
    <PoPropertyFailureRoute
      poNumber={decodePoParam(poNumber)}
      propertyId={decodePoParam(propertyId)}
    />
  );
}
