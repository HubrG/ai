"use client";
import React, { useMemo, useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import Showdown from "showdown";
import {
  createPdfPlan,
  getPdfPlanAndContent,
  updatePlan,
  updateContent,
  retrieveTokenRemaining,
} from "./utils.server";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/app/Context/store";
import DownloadButton from "./components/DownloadButton";

// SECTION: TYPES/INTERFACES
interface Plan {
  id: string;
  planTitle: string;
  planLevel?: string;
  tokenRemaining?: number;
}

interface ChapterContents {
  [title: string]: string;
}

type PdfCreatorProps = {
  params: { id: string };
};

// const gptModel = "gpt-4-1106-preview";
const gptModel = "gpt-3.5-turbo";
const maxTokens = 400;
//
const PdfCreator = ({ params }: PdfCreatorProps) => {
  const pdfId = params.id;
  const [abortControllers, setAbortControllers] = useState<AbortController[]>(
    []
  );
  const [activateAutomaticContent, setActivateAutomaticContent] =
    useState<boolean>(false);
  const { user, setUser } = useGlobalContext();
  const [subject, setSubject] = useState("");
  const [generatePlanDone, setGeneratePlanDone] = useState<boolean>(false);
  const [allContent, setAllContent] = useState<string>("");
  const [lang, setLang] = useState<string>("fr");
  const [chapterContent, setChapterContent] = useState<ChapterContents>({});
  const [loading, setLoading] = useState(false);
  const [responseSubject, setResponseSubject] = useState<string>("");
  const [regenerate, setRegenerate] = useState<boolean>(false);
  const [whatInProgress, setWhatInProgress] = useState<string>(""); // "plan" | "content" | ""
  const [createdPlans, setCreatedPlans] = useState<Plan[]>([]); // état pour stocker les plans créés
  const converter = useMemo(() => {
    return new Showdown.Converter();
  }, []);

  const handleUpdatePlanTitle = (planId: string, newTitle: string) => {
    setCreatedPlans((prevPlans) =>
      prevPlans.map((plan) => {
        if (plan.id === planId) {
          return { ...plan, planTitle: newTitle };
        }
        return plan;
      })
    );
    const upPlan = updatePlan(planId, newTitle);
    if (upPlan !== null) {
      console.log("Plan updated");
    } else {
      console.log("Plan not updated");
    }
  };

  const handleUpdateContent = (planId: string, newValue: string) => {
    setChapterContent((prevContent) => ({
      ...prevContent,
      [planId]: newValue,
    }));
    // Logique existante pour la mise à jour du contenu du plan dans la base de données ou autre
    const upContent = updateContent(planId, newValue);
    if (upContent !== null) {
      console.log("Content updated");
    } else {
      console.log("Content not updated");
    }
  };

  const updateContextTokenRemaining = useCallback(async () => {
    if (!user) {
      return;
    }
    const tokenResponse = await retrieveTokenRemaining();
    if (tokenResponse && user?.tokenRemaining !== undefined) {
      setUser((prevUser) => {
        if (prevUser === null) {
          return null;
        }
        return {
          ...prevUser,
          tokenRemaining: tokenResponse.tokenRemaining,
        };
      });
    }
  }, [user, setUser]);

  const markdownToHtml = useCallback(
    (markdown: string) => {
      return converter.makeHtml(markdown);
    },
    [converter]
  );
  const router = useRouter();

  // NOTE: Fetch PDF's
  const fetchPdf = useCallback(async () => {
    try {
      const pdfCreatorObject = await getPdfPlanAndContent(params.id);
      if (pdfCreatorObject && pdfCreatorObject.pdfPlan) {
        // On ajoute le plan à l'état createdPlans
        setCreatedPlans(pdfCreatorObject.pdfPlan);
        // On prépare le contenu des chapitres
        const contentObject: ChapterContents = {}; // Utilisation du type défini
        pdfCreatorObject.pdfPlan.forEach((plan) => {
          if (plan.pdfCreatorContent && plan.pdfCreatorContent.length > 0) {
            // Utiliser le premier élément de pdfCreatorContent ou une logique pour choisir le contenu
            contentObject[plan.id] = plan.pdfCreatorContent[0].planContent;
          }
        });
        // On met à jour l'état chapterContent avec les contenus récupérés
        setChapterContent(contentObject);
      } else {
        console.error("No pdfPlan found in the response");
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchPdf();
    }
  }, [params.id, fetchPdf]);

  const parseTitles = (text: string) => {
    const lines = text.split("\n");
    const newPlan: string[] = [];
    lines.forEach((line: string) => {
      line = line.replace("- ", "#### ");
      if (line.startsWith("# ")) {
        newPlan.push("# " + line.substring(2));
      } else if (line.startsWith("## ")) {
        newPlan.push("## " + line.substring(3));
      } else if (line.startsWith("### ")) {
        newPlan.push("### " + line.substring(4));
      } else if (line.startsWith("#### ")) {
        newPlan.push("#### " + line.substring(5));
      } else if (line.startsWith("##### ")) {
        newPlan.push("##### " + line.substring(6));
      } else if (line.startsWith("###### ")) {
        newPlan.push("###### " + line.substring(7));
      } else if (line.startsWith("- ")) {
        newPlan.push("- " + line.substring(2));
      }
    });
    return newPlan;
  };

  const handleCancel = () => {
    abortControllers.forEach((controller) => controller.abort()); // Annuler tous les processus en cours
    setAbortControllers([]); // Réinitialiser les contrôleurs

    // Votre logique existante pour réinitialiser l'état
    router.refresh();
    setLoading(false);
    setResponseSubject("");
    setCreatedPlans([]);
    setChapterContent({});
    setAllContent("");
  };

  const regeneratePlan = async () => {
    handleCancel();
    generatePlan();
  };

  // SECTION: GENERATE PLAN
  const generatePlan = async () => {
    const controller = new AbortController();
    setAbortControllers((prev) => [...prev, controller]);

    setLoading(true);
    let buffer = "";
    try {
      const response = await fetch("/api/pdfcreator/planCreator", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: subject,
          type: "plan",
          maxTokens: maxTokens,
          model: gptModel,
          lang: lang,
        }),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }
      // Mise à jour du contexte avec le nombre de tokens restants
      updateContextTokenRemaining();

      // Le code pour traiter la réponse de l'API
      const data = response.body;
      if (!data) {
        return;
      }

      // On stream le plan
      const reader = data.getReader();

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        setWhatInProgress("plan");
        const { value, done: doneReading } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          let bufferLines = buffer.split("\n");
          for (let i = 0; i < bufferLines.length - 1; i++) {
            const line = bufferLines[i];
            const titlesToAdd = parseTitles(line + "\n");
            if (titlesToAdd.length > 0) {
              const newPlans = await createPdfPlan(titlesToAdd, pdfId);
              setCreatedPlans((prevPlans) => [...prevPlans, ...newPlans]);
            }
          }
          buffer = bufferLines[bufferLines.length - 1];
        }

        if (doneReading) {
          done = true;
        }
      }
      if (done) {
        updateContextTokenRemaining();
        setGeneratePlanDone(true);
        setWhatInProgress("");
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          // Handle abort scenario, possibly clean up the reader if needed
          console.log("Fetch aborted:", error.message);
        } else {
          console.error("Fetch failed:", error.message);
        }
      }
    } finally {
      setLoading(false);
      // Any other cleanup if necessary
    }
  };

  // SECTION: GENERATE CONTENT
  const generateContent = useCallback(
    async (title: string, pdfId: string) => {
      const controller = new AbortController();
      setAbortControllers((prev) => [...prev, controller]); // Ajouter le nouveau contrôleur
      try {
        const response = await fetch("/api/pdfcreator/contentCreator", {
          method: "POST",
          signal: controller.signal, // Utilisez le signal de l'AbortController
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            lang,
            model: gptModel,
            maxTokens: maxTokens,
            pdfId,
            plan: createdPlans,
          }),
        });
        if (!response.ok) {
          throw new Error(`API call failed: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Error calling other API:", error);
        return null;
      }
    },
    [lang, createdPlans]
  );

  useEffect(() => {
    if (!loading && responseSubject && pdfId !== "") {
      // On s'assure que l'appel de fonction est correct :
      createPdfPlan(parseTitles(responseSubject), pdfId).then((newPlans) => {
        setCreatedPlans((prevPlans) => [...prevPlans, ...newPlans]);
      });
    }
  }, [loading, responseSubject, pdfId]);

  const handleTryAgain = () => {
    setResponseSubject("");
    handleCancel();
  };

  useEffect(() => {
    const aggregatedContent = createdPlans.reduce((accumulator, plan) => {
      const planTitleHtml = markdownToHtml(
        plan.planLevel + " " + plan.planTitle
      );
      const chapterHtml =
        plan.id in chapterContent
          ? markdownToHtml(chapterContent[plan.id])
          : "";
      return accumulator + planTitleHtml + chapterHtml;
    }, "");
    setAllContent(aggregatedContent);
  }, [createdPlans, chapterContent, markdownToHtml]);

  useEffect(() => {
    if (generatePlanDone && activateAutomaticContent) {
      setLoading(true);
      setWhatInProgress("content");
      const apiCalls = createdPlans.map((plan) =>
        generateContent(plan.planTitle, plan.id).then((apiResponse) => {
          if (apiResponse) {
            const newContent = apiResponse.planContent; // Assurez-vous que c'est le format correct
            setChapterContent((prevContent) => ({
              ...prevContent,
              [plan.id]: newContent, // Utilisez l'ID du plan comme clé
            }));
            // On met à jour le nombre de tokens restants
            updateContextTokenRemaining();
          }
        })
      );
      Promise.all(apiCalls)
        .then(() => {
          setLoading(false);
          setWhatInProgress("");
          setGeneratePlanDone(false);
          setRegenerate(true);
        })
        .catch((error) => {
          console.error("Error in one of the API calls:", error);
          setLoading(false);
          setWhatInProgress("");
          setGeneratePlanDone(false);
          setRegenerate(true);
        });
    }
  }, [
    generatePlanDone,
    createdPlans,
    generateContent,
    activateAutomaticContent,
    updateContextTokenRemaining,
  ]);

  return (
    <div className="min-h-screen  flex md:flex-row flex-col w-full gap-5">
      <div className="md:w-1/3 w-full sticky top-20">
        <div className="flex flex-col gap-x-2 items-center">
          <Input
            disabled={loading}
            placeholder="Sujet du PDF"
            value={subject}
            onChange={(e) => setSubject(e.currentTarget.value)}
          />
          <Input
            placeholder="Langue"
            value={lang}
            onChange={(e) => setLang(e.currentTarget.value)}
          />
        </div>
        <div className="flex flex-row gap-x-2">
          <Button
            onClick={!regenerate ? generatePlan : regeneratePlan}
            disabled={loading}>
            {loading && <Loader />}{" "}
            {loading && whatInProgress === ""
              ? "Génération du PDF"
              : loading && whatInProgress === "plan"
                ? "Génération du plan..."
                : loading && whatInProgress === "content"
                  ? "Génération du contenu..."
                  : !regenerate
                    ? "Générer le PDF"
                    : "Recommencer"}
          </Button>
          {loading && (
            <Button onClick={handleCancel}>Annuler la Demande</Button>
          )}
          {!loading && responseSubject && (
            <Button onClick={handleTryAgain}>Recommencer</Button>
          )}
        </div>
      </div>
      <div className="md:w-2/3 w-full sticky top-20 ">
        <div className="rounded-xl border bg-opacity-90 border-app-300 dark:border-app-950 shadow transition grid grid-cols-1 gap-x-2 items-start">
          <div className="rounded-t-xl p-2 py-3 mb-2 flex flex-row gap-x-2 dark:bg-app-700 bg-app-200 items-center">
            <DownloadButton allContent={allContent} subject={subject} />
          </div>
          <div className="row-span-3 hidden">
            {createdPlans.map((plan) => (
              <div className="flex flex-col gap-1" key={plan.id}>
                <div className="flex flex-row">
                  <span>{plan.planLevel}</span>
                  <Input
                    id={`title-${plan.id}`}
                    placeholder={`Titre`}
                    defaultValue={plan.planTitle}
                    onChange={(e) => {
                      handleUpdatePlanTitle(plan.id, e.currentTarget.value);
                    }}
                  />
                </div>
                <div>
                  {chapterContent[plan.id] && (
                    <Textarea
                      value={chapterContent[plan.id]}
                      onChange={(e) =>
                        handleUpdateContent(plan.id, e.currentTarget.value)
                      }
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-10 py-5 -mt-2 overflow-y-auto rounded-b-xl max-h-[83vh] bg-app-50 dark:bg-app-800">
            <article className="">
              {createdPlans.map((plan) => (
                <div key={plan.id}>
                  <div
                    className="text-left"
                    dangerouslySetInnerHTML={{
                      __html: markdownToHtml(
                        plan.planLevel + " " + plan.planTitle
                      ),
                    }}
                  />
                  {chapterContent[plan.id] && (
                    <div
                      className="text-left"
                      dangerouslySetInnerHTML={{
                        __html: markdownToHtml(chapterContent[plan.id]),
                      }}
                    />
                  )}
                </div>
              ))}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfCreator;
