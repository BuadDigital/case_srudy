UPDATE "WorkOrders" w
SET "ExpectedPropertyCount" = GREATEST(1, (
    SELECT COUNT(*)::int FROM "WorkOrderProperties" p WHERE p."WorkOrderId" = w."Id"
))
WHERE "ExpectedPropertyCount" = 0;

ALTER TABLE "WorkOrders" ALTER COLUMN "ExpectedPropertyCount" SET DEFAULT 1;
