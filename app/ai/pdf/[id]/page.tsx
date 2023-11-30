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
        <div
          className="flex justify-between items-center"
          aria-label="Breadcrumb">
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
                <Link href="/ai/pdf" className="ms-1 text-sm font-medium ">
                  PDF Projects
                </Link>
              </div>
            </li>
            <li aria-current="page" className="max-sm:hidden">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="rtl:rotate-180 w-3 h-3  mx-1"
                />
                <span className="ms-1 text-sm font-medium md:ms-2 ">
                  <span className="lg:block md:hidden  hidden">
                    {pdf.title.length > 100
                      ? pdf.title.slice(0, 100) + "..."
                      : pdf.title}
                  </span>
                  <span className="lg:hidden md:block sm:hidden hidden">
                    {pdf.title.length > 54
                      ? pdf.title.slice(0, 54) + "..."
                      : pdf.title}
                  </span>
                  <span className="lg:hidden md:hidden sm:block hidden">
                    {pdf.title.length > 40
                      ? pdf.title.slice(0, 40) + "..."
                      : pdf.title}
                  </span>
                </span>
              </div>
            </li>
          </ol>
        </div>
        <div className="block sm:hidden ms-1 text-sm font-medium md:ms-2 text-left -mt-5">
          {pdf.title.length > 54 ? pdf.title.slice(0, 54) + "..." : pdf.title}
        </div>
        <div>
          <Separator className="" />
          <PdfCreator params={params} />
        </div>
      </div>
    </>
  );
}
