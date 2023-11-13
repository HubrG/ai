import NotFound from '@/app/not-found'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RetrievePwdTokenForm } from '@/src/feature/layout/auth/RetrievePwdTokenForm'
import { checkTokenAndUser } from '@/src/feature/layout/auth/utils.server'
import React, { Suspense } from 'react'
import { Meta } from "@/src/feature/layout/metadata/Metadata";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: Meta("title", "Récupération du mot de passe"),
  description: "Ekoseon",
};
export default async function RetrievePwd({
  params,
}: {
  params: { userId:string, token:string };
  }) {

  const check = await checkTokenAndUser(params.token,params.userId)
  
  return (
    <>
      {check === true ? (
        <section>
          <div className="content  max-w-lg flex flex-col justify-center items-center">
            <h1 className="title-page">
              Récupération du mot de passe
            </h1>
            <Card>
              <Suspense fallback={<Skeleton />}>
                <RetrievePwdTokenForm userId={params.userId} token={params.token} />
              </Suspense>
            </Card>
          </div>
        </section>
      ) : (
        <NotFound />
      )}
    </>
  )
}
