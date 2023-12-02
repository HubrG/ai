"use client";
import { pdfCreator } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useRef } from "react";
import { deletePdf } from "../utils.server";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@/components/ui/button";
interface pdfsProps {
  pdfs: pdfCreator[];
}
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Toastify } from "../../../../toastify/Toastify";

export const PDFList = ({ pdfs }: pdfsProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const handleDelete = async (id: string) => {
    const removePdf = await deletePdf(id);
    if (removePdf) {
      router.refresh();
      Toastify({ type: "success", value: "Project deleted" });
    }
  };
  const handleCancelClick = (itemId: string) => {
    if (closeButtonRef.current) {
      closeButtonRef.current.click();
    }
  };
  return (
    <>
      <div className="h-[80vh] relative overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-50 border-b-2 shadow-lg">
            <TableRow className="">
              <TableHead className="w-[100px]">Projects</TableHead>
              <TableHead>Created at</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pdfs &&
              pdfs.map((pdf: pdfCreator) => (
                <TableRow key={"pdfList"+pdf.id} className="py-2 my-2">
                  <TableCell className="font-medium w-[40%] text-left">
                    <Link href={`/ai/pdf/${pdf.id}`}>
                      {pdf.title !== "" ? pdf.title : "Untitled project"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {pdf.createdAt &&
                      new Date(pdf.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })}
                  </TableCell>
                  <TableCell>
                    {pdf.updatedAt &&
                      new Date(pdf.updatedAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant={"ghost"}
                          size={"sm"}
                          // onClick={() => handleDelete(pdf.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle className="text-center p-0 flex flex-col gap-5 m-0">
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="mr-2 text-4xl"
                            />
                            Are you sure you want to delete this project?
                          </DialogTitle>
                        </DialogHeader>
                        <Button
                          onClick={() => handleDelete(pdf.id)}
                          className="-mt-5">
                          Yes, delete permanently
                        </Button>
                        <Button
                          variant="link"
                          onClick={() => handleCancelClick(pdf.id)}>
                          Cancel
                        </Button>
                        <DialogClose
                          className="closeButton"
                          ref={closeButtonRef}
                        />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">{pdfs.length}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </>
  );
};
