"use client";
import { pdfCreator } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { deletePdf } from "../utils.server";
interface pdfsProps {
  pdfs: pdfCreator[];
}

export const PDFList = ({ pdfs }: pdfsProps) => {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    const removePdf = await deletePdf(id);
    if (removePdf) {
      router.refresh();
    }
  };
  return (
    <>
      {pdfs &&
        pdfs.map((pdf: pdfCreator) => (
          <li key={pdf.id} className="flex w-full flex-row gap-5 items-center">
            <div>
              <Link href={`/ai/pdf/${pdf.id}`}>
                {pdf.title !== "" ? pdf.title : "Untitled project"}
              </Link>
            </div>
            <div>
              <span onClick={() => handleDelete(pdf.id)}>Delete</span>
            </div>
          </li>
        ))}
    </>
  );
};
