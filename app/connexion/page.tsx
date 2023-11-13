import LoginPage from "@/src/feature/auth/AuthForm";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Card
} from "@/components/ui/card";
import { faArrowRightToArc } from "@fortawesome/pro-duotone-svg-icons";
import Skeleton from "@/src/skeleton/Content";
import { Meta } from "@/src/metadata/Metadata";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: Meta("title", "Connexion"),
};

const Auth = async () => {
  const session = await getAuthSession();
  if (session) {
    redirect("/");
  }
 
  return (
    <section>
      <div className="content  max-w-lg flex flex-col justify-center items-center">
        <h1 className="title-page">
          <FontAwesomeIcon icon={faArrowRightToArc} /> Connexion sur {process.env.NEXT_PUBLIC_APP_NAME}
        </h1>
        <Card>
          <Suspense fallback={<Skeleton />}>
            <LoginPage />
          </Suspense>
        </Card>
      </div>
    </section>
  );
};

export default Auth;
