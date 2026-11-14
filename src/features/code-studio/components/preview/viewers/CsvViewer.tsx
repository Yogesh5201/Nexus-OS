"use client";

import { useMemo } from "react";

/** Parse CSV text into rows, honouring quoted fields and escaped quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r[0] ?? "").trim() !== "");
}

/** Tabular CSV preview with a sticky header. */
export default function CsvViewer({ content }: { content: string }) {
  const rows = useMemo(() => parseCsv(content), [content]);

  if (rows.length === 0) {
    return <p className="p-5 text-sm text-muted/60">Empty CSV.</p>;
  }

  const [header, ...body] = rows;
  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead className="sticky top-0 bg-surface/95 backdrop-blur">
          <tr>
            <th className="border border-border/10 px-2 py-1 text-right text-muted/50">#</th>
            {header.map((h, i) => (
              <th
                key={i}
                className="border border-border/10 px-2.5 py-1.5 text-left font-semibold text-text/90"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri} className="hover:bg-glass/30">
              <td className="border border-border/10 px-2 py-1 text-right text-muted/40 tabular-nums">
                {ri + 1}
              </td>
              {header.map((_, ci) => (
                <td key={ci} className="border border-border/10 px-2.5 py-1 text-text/80">
                  {r[ci] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
