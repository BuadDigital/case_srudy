import { redirect } from "next/navigation";
import { decodeTaskParam, primaryDataTaskPath } from "@/lib/my-task-routes";

export default async function MyTaskWorkPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  redirect(primaryDataTaskPath(decodeTaskParam(taskId)));
}
