import { PoPropertiesPage } from "@/components/views/PoPropertiesPage";
import { decodePoParam } from "@/lib/po-routes";
export default async function PoPropertiesListPage({
  params,
}: {
  params: Promise<{ poNumber: string }>;
}) {
  const { poNumber } = await params;
  return <PoPropertiesPage poNumber={decodePoParam(poNumber)} />;
}
