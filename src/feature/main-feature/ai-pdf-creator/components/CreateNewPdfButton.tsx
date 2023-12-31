"use client";
import { Button } from "@/components/ui/button";
import { User } from "@prisma/client";
import React from "react";
import { createPdf } from "../utils.server";
import { useRouter } from "next/navigation";

type Props = {
  user: User;
  className?: string;
};
export const CreateNewPdfButton = ({ user, className }: Props) => {
  const router = useRouter();
  const handleCreatePdf = async () => {
    const create = await createPdf({ lang: "en", subject: "", user: user });
    if (create) router.push(`/ai/pdf/${create.id}`);
  };
  return (
    <Button className={className} type="button" variant={"outline"} onClick={handleCreatePdf}>
      Create a new PDF
    </Button>
  );
};
