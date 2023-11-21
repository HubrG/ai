import { getUserLog } from "@/src/query/user.query";
import { getPdfs } from "@/src/query/pdf.query";
import NotFound from "@/app/not-found";
import { CreateNewPdfButton } from "@/src/feature/main-feature/ai-pdf-creator/components/CreateNewPdfButton";
import Link from "next/link";
import { pdfCreator } from "@prisma/client";

export default async function GeneratePDF() {
  const user = await getUserLog();
  if (!user) {
    return <NotFound />;
  }
  const pdfs = await getPdfs();

  return (
    <>
      <div className="flex flex-col gap-y-10 w-full">
        <div className="flex flex-row gap-2 w-full">
          <div className="my-5 mt-0 text-3xl text-left font-bold w-1/2">
            {user && <CreateNewPdfButton user={user} />}
          </div>
          <div>
            {/* On map */}
            <ul className="text-left">
              {pdfs &&
                pdfs.map(
                  (pdf:pdfCreator) =>
                    pdf.title && (
                      <li key={pdf.id}>
                        <Link href={`/ai/pdf/${pdf.id}`}>
                          {pdf.title !== "" ? pdf.title : "Projet sans titre"}
                        </Link>
                      </li>
                    )
                )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
