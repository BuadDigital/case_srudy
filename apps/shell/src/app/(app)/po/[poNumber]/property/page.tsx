import { PoPropertiesPageClient } from "@/components/po/PoPropertiesPageClient";
import { decodePoParam } from "@case-study/mfe";

export default async function PoPropertiesListPage({
  params,
}: {
  params: Promise<{ poNumber: string }>;
}) {
  const { poNumber } = await params;
  return <PoPropertiesPageClient poNumber={decodePoParam(poNumber)} />;
}
