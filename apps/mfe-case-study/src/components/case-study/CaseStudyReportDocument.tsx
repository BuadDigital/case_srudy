import {
  Note,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  cn,
} from "@platform/design-system";
import type { CaseStudyReportModel } from "../../lib/prototype/case-study-report-model";

type Props = {
  model: CaseStudyReportModel;
  id?: string;
  className?: string;
};

function ReportMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] w-[18px] items-center justify-center rounded-[3px] border-[1.5px] border-border-md text-[11px] font-bold",
        checked && "border-primary bg-primary text-white",
      )}
    >
      {checked ? "✓" : ""}
    </span>
  );
}

export function CaseStudyReportDocument({ model, id, className }: Props) {
  return (
    <article
      id={id}
      className={cn("bg-white text-xs text-text", className)}
      dir="rtl"
      lang="ar"
    >
      {model.sections.map((section) => (
        <details
          key={section.id}
          className="group mb-3 overflow-hidden rounded-xl border border-border"
          open
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 bg-primary p-2 px-3 text-xs font-bold text-white [&::-webkit-details-marker]:hidden">
            <span
              className="h-0 w-0 shrink-0 border-y-4 border-y-transparent border-s-[5px] border-s-white/85 transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
            {section.title}
          </summary>
          <div className="bg-white">
            <Table>
              <THead>
                <Tr hoverable={false}>
                  <Th className="text-[10px]">الأسئلة</Th>
                  <Th className="w-[90px] text-center text-[10px]">
                    {section.colAHeader}
                  </Th>
                  <Th className="w-[90px] text-center text-[10px]">
                    {section.colBHeader}
                  </Th>
                </Tr>
              </THead>
              <TBody>
                {section.rows.map((row, i) => (
                  <Tr key={`${section.id}-${i}`} hoverable={false}>
                    <Td className="leading-snug">{row.question}</Td>
                    <Td className="text-center">
                      <ReportMark checked={row.markA} />
                    </Td>
                    <Td className="text-center">
                      <ReportMark checked={row.markB} />
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            {section.extras?.map((line) => (
              <p
                key={line}
                className="m-0 border-t border-border bg-surface-2 px-3 py-1.5 text-[11px]"
              >
                {line}
              </p>
            ))}
            {section.remarks ? (
              <Note tone="warn" className="mb-0 rounded-none border-r-0">
                <span className="mb-1 block font-bold">ملاحظات:</span>
                <p className="m-0">{section.remarks}</p>
              </Note>
            ) : null}
          </div>
        </details>
      ))}
    </article>
  );
}
