"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSession, signIn } from "next-auth/react";
import React, { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/pro-duotone-svg-icons";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Toastify } from "@/src/toastify/Toastify";
import { useRouter } from "next/navigation";
import { RetrievePwd } from "./RetrievePwd";
const LoginPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const email = useRef("");
  const pass = useRef("");

  const onSubmit = async (e: any) => {
    e.preventDefault(); // Ajouté pour empêcher le rechargement de la page
    setIsLoading(true);

    const res = await fetch("/api/auth/signIn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.current,
        password: pass.current,
      }),
    });

    setIsLoading(false);

    if (res.ok) {
      const result = await signIn("credentials", {
        email: email.current,
        password: pass.current,
        redirect: false,
        callbackUrl: "/profil/mes-commandes",
      });
      const session = await getSession();
      Toastify({
        type: "default",
        value: `Heureux de vous revoir  ${session?.user.name} !`,
      });
      router.refresh();
      router.push("/profil/mes-commandes");
    } else {
      const { error } = await res.json();
      Toastify({ type: "error", value: error });
    }
  };

  const onGithubSignIn = async () => {
    // Ajouté async
    setIsLoading(true);
    await signIn("github", { callbackUrl: "/" });
    setIsLoading(false);
  };

  return (
    <>
      <CardHeader className="no-card-header mt-5 mb-0 pb-2">
        <CardDescription className="text-center">
          Connectez-vous afin d&apos;accéder à toutes vos commandes
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Input
          onChange={(e) => (email.current = e.target.value)}
          placeholder="Adresse email"
          onKeyUp={(e) => {
            if (e.key === "Enter") onSubmit(e);
          }}
        />
        <Input
          placeholder="Mot de passe"
          type={"password"}
          onChange={(e) => (pass.current = e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") onSubmit(e);
          }}
        />
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading && (
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 h-4 w-4 animate-spin"
            />
          )}
          Connexion
        </Button>
        {/* <div className="separatorWithText">
          <div>
            <span />
          </div>
          <div>
            <span>Ou</span>
          </div>
        </div> */}
      </CardContent>
      <CardFooter>
        <RetrievePwd />
        <Button
          variant="ghost"
          onClick={onGithubSignIn}
          className="w-full mt-1"
          type="button"
          disabled={isLoading}>
          {isLoading ? (
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 h-4 w-4 animate-spin"
            />
          ) : (
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 21 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_13183_10121)">
                <path
                  d="M20.3081 10.2303C20.3081 9.55056 20.253 8.86711 20.1354 8.19836H10.7031V12.0492H16.1046C15.8804 13.2911 15.1602 14.3898 14.1057 15.0879V17.5866H17.3282C19.2205 15.8449 20.3081 13.2728 20.3081 10.2303Z"
                  fill="#3F83F8"></path>
                <path
                  d="M10.7019 20.0006C13.3989 20.0006 15.6734 19.1151 17.3306 17.5865L14.1081 15.0879C13.2115 15.6979 12.0541 16.0433 10.7056 16.0433C8.09669 16.0433 5.88468 14.2832 5.091 11.9169H1.76562V14.4927C3.46322 17.8695 6.92087 20.0006 10.7019 20.0006V20.0006Z"
                  fill="#34A853"></path>
                <path
                  d="M5.08857 11.9169C4.66969 10.6749 4.66969 9.33008 5.08857 8.08811V5.51233H1.76688C0.348541 8.33798 0.348541 11.667 1.76688 14.4927L5.08857 11.9169V11.9169Z"
                  fill="#FBBC04"></path>
                <path
                  d="M10.7019 3.95805C12.1276 3.936 13.5055 4.47247 14.538 5.45722L17.393 2.60218C15.5852 0.904587 13.1858 -0.0287217 10.7019 0.000673888C6.92087 0.000673888 3.46322 2.13185 1.76562 5.51234L5.08732 8.08813C5.87733 5.71811 8.09302 3.95805 10.7019 3.95805V3.95805Z"
                  fill="#EA4335"></path>
              </g>
              <defs>
                <clipPath id="clip0_13183_10121">
                  <rect
                    width="20"
                    height="20"
                    fill="white"
                    transform="translate(0.5)"></rect>
                </clipPath>
              </defs>
            </svg>
          )}{" "}
          Connexion avec Github
        </Button>
      </CardFooter>
    </>
  );
};

export default LoginPage;
