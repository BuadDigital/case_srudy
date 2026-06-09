import { PoPropertyFailureRoute } from "@case-study/mfe";
import { decodePoParam } from "@case-study/mfe";
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
