"use client";
import {
  downloadHtml,
  downloadDocx,
  downloadMarkdown,
  downloadToTxt,
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
import { Button } from "@/components/ui/button";
import { Tooltip } from "react-tooltip";
import { faText } from "@fortawesome/pro-solid-svg-icons";

const converter = new Showdown.Converter();
//
export default function DownloadButton({
  allContent,
  subject,
  disabled,
}: {
  allContent: string;
  subject: string;
  disabled?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled ? true : false}
        data-tooltip-id="downloadButtonTooltip">
        <>
          <Button disabled={disabled} variant={"default"}>
            <FontAwesomeIcon icon={faDownload} />
          </Button>
          <Tooltip
            id="downloadButtonTooltip"
            className="tooltip"
            opacity={1}
            place="bottom">
            <strong>Download</strong>
            <span className="block">
              Download your PDF in Docx, HTML or Markdown format.
            </span>
          </Tooltip>
        </>
      </PopoverTrigger>
      <PopoverContent>
        {/* <div
          className={`downloadPdfButton `}
          onClick={() => downloadPdf(allContent, "Fastuff-" + subject)}>
          <FontAwesomeIcon icon={faFilePdf} />
          <span>
            Download in <strong>PDF</strong>
          </span>
        </div> */}
        {/* <div
          className="downloadPdfButton"
          onClick={() => downloadDocx(allContent, "Fastuff-" + subject)}>
          <FontAwesomeIcon icon={faFileDoc} />
          <span>
            Download in <strong>Docx</strong>
          </span>
        </div> */}
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

        <div
          className="downloadPdfButton"
          onClick={() => {
            downloadToTxt(
              converter.makeMarkdown(allContent).replace(/\\/g, ""),
              "Fastuff-" + subject
            );
          }}>
          <FontAwesomeIcon icon={faText} />
          <div>
            Download in <strong>TXT</strong> (markdown)
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
