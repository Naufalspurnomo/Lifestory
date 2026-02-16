import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const pdfCatalog: Record<string, { relativePath: string; downloadName: string }> = {
  "mak-book-re-arrange-1": {
    relativePath: path.join("Images", "pdf", "Mak Book Re-Arrange 1.pdf"),
    downloadName: "Mak Book Re-Arrange 1.pdf",
  },
};

export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const pdfEntry = pdfCatalog[params.slug];

  if (!pdfEntry) {
    return NextResponse.json({ error: "PDF not found." }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), pdfEntry.relativePath);
    const pdfBuffer = await readFile(filePath);
    const totalSize = pdfBuffer.byteLength;
    const baseHeaders = {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdfEntry.downloadName}"`,
      "Cache-Control": "public, max-age=604800, immutable",
      "Accept-Ranges": "bytes",
    };
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const rangeMatch = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());

      if (!rangeMatch) {
        return new NextResponse("Invalid range request.", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${totalSize}`,
          },
        });
      }

      const hasStart = rangeMatch[1] !== "";
      const hasEnd = rangeMatch[2] !== "";
      let start = 0;
      let end = totalSize - 1;

      if (hasStart && hasEnd) {
        start = Number(rangeMatch[1]);
        end = Number(rangeMatch[2]);
      } else if (hasStart) {
        start = Number(rangeMatch[1]);
      } else if (hasEnd) {
        const suffixLength = Number(rangeMatch[2]);
        start = Math.max(totalSize - suffixLength, 0);
      }

      end = Math.min(end, totalSize - 1);

      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start < 0 ||
        start >= totalSize ||
        end < start
      ) {
        return new NextResponse("Range not satisfiable.", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${totalSize}`,
          },
        });
      }

      const partialBuffer = pdfBuffer.subarray(start, end + 1);

      return new NextResponse(partialBuffer, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Content-Length": String(partialBuffer.byteLength),
        },
      });
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        ...baseHeaders,
        "Content-Length": String(totalSize),
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to load PDF file." }, { status: 500 });
  }
}
