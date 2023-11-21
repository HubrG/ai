import NotFound from "@/app/not-found";
import { Separator } from "@/components/ui/separator";
import PdfCreator from "@/src/feature/main-feature/ai-pdf-creator/CreatePDF";
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
      <div className="flex flex-col gap-y-10 w-full">
        <div className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                <FontAwesomeIcon
                  icon={faHome}
                  className="rtl:rotate-180 w-3 h-3 -mt-0.5 text-gray-400 mx-2"
                />
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                />
                <Link
                  href="/ai/pdf"
                  className="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white">
                  Projects
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                />
                <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">
                  Generate a unique PDF on any topic
                </span>
              </div>
            </li>
          </ol>
        </div>

        <div>
          <h2 className="my-5 mt-0 text-3xl text-left font-bold">
            {/* <FontAwesomeIcon icon={faFilePdf} className="text-secondary-500" />{" "} */}
            Generate a unique PDF on any topic
          </h2>
          <Separator className="mb-5" />
          <PdfCreator params={params} />
        </div>
      </div>
    </>
  );
}
