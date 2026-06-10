/** Domain types for إدارة المفاتيح — expand when operations/keys API exists. */
export type KeyCustodyRow = {
  id: string;
  court: string;
  status: "held" | "released" | "pending";
};
