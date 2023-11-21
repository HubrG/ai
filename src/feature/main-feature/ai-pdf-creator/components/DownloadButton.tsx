"use client";
import {
  downloadHtml,
  downloadPdf,
  downloadDocx,
  downloadMarkdown,
} from "@/src/function/ai/ai-pdf-creator/downloadInFormat";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faFileCode,
  faFileDoc,
  faFilePdf,
} from "@fortawesome/pro-duotone-svg-icons";
import { faMarkdown } from "@fortawesome/free-brands-svg-icons";
import Showdown from "showdown";

const converter = new Showdown.Converter();
//
export default function DownloadButton({
  allContent,
  subject,
}: {
  allContent: string;
  subject: string;
}) {
  return (
    <Popover>
      <PopoverTrigger>
        <div className="shadcnButton-default bg-opacity-30">
          <FontAwesomeIcon icon={faDownload} />
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <div
          className="downloadPdfButton"
          onClick={() => downloadPdf(allContent, "Fastuff-" + subject)}>
          <FontAwesomeIcon icon={faFilePdf} />
          <span>
            Download in <strong>PDF</strong>
          </span>
        </div>
        <div
          className="downloadPdfButton"
          onClick={() => downloadDocx(allContent, "Fastuff-" + subject)}>
          <FontAwesomeIcon icon={faFileDoc} />
          <span>
            Download in <strong>Docx</strong>
          </span>
        </div>
        <div
          className="downloadPdfButton"
          onClick={() => downloadHtml(allContent, "Fastuff-" + subject)}>
          <FontAwesomeIcon icon={faFileCode} />
          <span>
            Download in <strong>HTML</strong>
          </span>
        </div>
        <div
          className="downloadPdfButton"
          onClick={() => {
            downloadMarkdown(
              converter.makeMarkdown(allContent),
              "Fastuff-" + subject
            );
          }}>
          <FontAwesomeIcon icon={faMarkdown} />
          <div>
            Download in <strong>Markdown</strong>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
