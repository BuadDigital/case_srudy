"use client";

import { use } from "react";
import {
  CaseStudyWorkspaceView,
  decodeTaskParam,
} from "@case-study/mfe";
import { EvaluatorAdvisoryPanel } from "@/components/prototype/evaluator/EvaluatorAdvisoryPanel";

export default function CaseStudyWorkspacePage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  return (
    <CaseStudyWorkspaceView
      taskId={decodeTaskParam(taskId)}
      renderPartiesExtras={({ task, property, tasks }) =>
        property?.id ? (
          <div style={{ marginTop: 16 }}>
            <EvaluatorAdvisoryPanel
              parentTask={task}
              propertyId={property.id}
              tasks={tasks}
            />
          </div>
        ) : null
      }
    />
  );
}
