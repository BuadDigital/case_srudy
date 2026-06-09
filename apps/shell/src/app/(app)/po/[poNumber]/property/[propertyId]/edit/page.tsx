import { PoPropertyEditRoute } from "@case-study/mfe";
import { decodePoParam } from "@case-study/mfe";
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
