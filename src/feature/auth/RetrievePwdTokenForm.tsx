"use client";
import { Button } from "@/components/ui/button";
import {
  CardHeader,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { faSpinner } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useTransition } from "react";
import { Toastify } from "@/src/toastify/Toastify";
import { updatePassword } from "./utils.server";
import { useRouter } from "next/navigation";

interface RetrievePwdTokenFormProps {
  userId: string;
  token: string;
}

export const RetrievePwdTokenForm = ({
  userId,
  token,
}: RetrievePwdTokenFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");

  const handleChangePwd = async () => {
    if (password && passwordConfirm && password === passwordConfirm) {
      setIsLoading(true);
      const update = await updatePassword(token, userId, password);
      if (update) {
        Toastify({
          type: "success",
          value: "Votre mot de passe a bien été changé",
        });
        return router.push("/connexion");
      } else {
        Toastify({
          type: "error",
          value: "Une erreur est survenue",
        });
      }
      setIsLoading(false);
    } else {
      Toastify({
        type: "error",
        value: "Les mots de passe ne correspondent pas",
      });
    }
  };

  return (
    <>
      <CardHeader className="no-card-header mt-5 mb-0 pb-2">
        <CardDescription className="text-center">
          Entrez les informations ci-dessous pour récupérer votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Input
          placeholder="Nouveau mot de passe"
          type={"password"}
          onChange={(e) => setPassword(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") handleChangePwd();
          }}
        />
        <Input
          placeholder="Confirmer le nouveau mot de passe"
          type={"password"}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") handleChangePwd();
          }}
        />
        <Button
          onClick={handleChangePwd}
          disabled={
            isLoading ||
            !password ||
            !passwordConfirm ||
            passwordConfirm !== password
          }>
          {isLoading && (
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 h-4 w-4 animate-spin"
            />
          )}
          Changer le mot de passe
        </Button>
      </CardContent>
    </>
  );
};
