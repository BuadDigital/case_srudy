import { redirect } from "next/navigation";

/** PO intake opens as a modal on `/po` — legacy URL redirects here. */
export default function PoIntakeRedirectPage() {
  redirect("/po?intake=1");
}
