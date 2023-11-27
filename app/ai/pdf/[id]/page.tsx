import NotFound from "@/app/not-found";
import { Separator } from "@/components/ui/separator";
import PdfCreator from "@/src/feature/main-feature/ai-pdf-creator/CreatePDF";
import { CreateNewPdfButton } from "@/src/feature/main-feature/ai-pdf-creator/components/CreateNewPdfButton";
import { getPdf } from "@/src/feature/main-feature/ai-pdf-creator/utils.server";
import { getUserLog } from "@/src/query/user.query";
import {
  faArrowRight,
  faFilePdf,
  faHome,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export default async function GeneratePdfId({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUserLog();
  if (!user) {
    return <NotFound />;
  }
  const pdf = await getPdf(params.id);
  if (!pdf) {
    return <NotFound />;
  }
  if (pdf.userId !== user.id) {
    return "You are not authorized to view this page.";
  }

  return (
    <>
      <div className="flex flex-col gap-y-5 w-full">
        <div className="flex justify-between items-center" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium ">
                <FontAwesomeIcon
                  icon={faHome}
                  className="rtl:rotate-180 w-3 h-3 -mt-0.5 mx-2"
                />
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="rtl:rotate-180 w-3 h-3  mx-1"
                />
                <Link
                  href="/ai/pdf"
                  className="ms-1 text-sm font-medium ">
                  PDF Projects
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="rtl:rotate-180 w-3 h-3  mx-1"
                />
                <span className="ms-1 text-sm font-medium md:ms-2 ">
                  {pdf.title !== "" ? pdf.title : "Untitled project"}
                </span>
              </div>
            </li>
          </ol>
          <CreateNewPdfButton user={user} />
        </div>
        <div>
          <Separator className="" />
          <PdfCreator params={params} />
        </div>
      </div>
    </>
  );
}
