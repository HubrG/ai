"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import validator from "validator";
import { createToken } from "./utils.server";
import { Toastify } from "@/src/toastify/Toastify";
import { DialogClose } from "@radix-ui/react-dialog";

export const RetrievePwd = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClickPwd = async () => {
    setIsLoading(true);
    const token = await createToken(email);
    if (token || token === null) {
      Toastify({
        value:
          "Un email vient de vous être envoyé. Veuillez le consulter pour récupérer votre mot de passe",
        type: "success",
      }); // Token créé, email envoyé
      const closeButton = document.querySelector(".closeDialogPwdForget");
      if (closeButton !== null) {
        (document.querySelector('.closeDialogPwdForget') as HTMLElement)?.click();
      }
    } else {
      Toastify({ value: "Cet adresse email n'existe pas", type: "error" }); // Adresse email inexistante
    }
    setIsLoading(false);
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="py-2 h-auto">
          Mot de passe oublié ?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            Réinitialisation de votre mot de passe
          </DialogTitle>
          <DialogDescription className="text-center pt-0 bg-app-50 p-2 rounded-lg text-app-500">
            Veuillez entrer <strong>votre adresse email</strong> puis cliquer
            sur le bouton « Envoyer ». Vous recevrez un lien permettant la
            réinitialisation de votre mot de passe.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-0">
          <div className="flex flex-col  items-center gap-2">
            <Input
              id="retrieveEmail"
              onKeyUp={(e) => {
                if (e.key === "Enter") handleClickPwd();
              }}
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder="Adresse email"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={!validator.isEmail(email) || isLoading}
            onClick={handleClickPwd}>
            Envoyer
          </Button>
          <DialogClose asChild>
            <Button
              type="button"
            
              className="hidden closeDialogPwdForget"
              variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
