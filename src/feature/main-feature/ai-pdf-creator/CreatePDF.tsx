"use client";
import React, { useMemo, useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import Showdown from "showdown";
import {
  createPdf,
  createPdfPlan,
  getPdfPlanAndContent,
  deletePlan,
  updatePlan,
  updateContent,
} from "./utils.server";
import { Textarea } from "@/components/ui/textarea";
import {
  downloadHtml,
  downloadPdf,
  downloadDocx,
  downloadMarkdown,
} from "@/src/function/ai/ai-pdf-creator/downloadInFormat";
import { useRouter } from "next/navigation";

// get_encoding
// SECTION: TYPES/INTERFACES
interface Plan {
  id: string;
  planTitle: string;
  planLevel?: string;
}

interface ChapterContents {
  [title: string]: string;
}

// NOTE: Operations
// 1. User enters a subject
// 2. User clicks on "Generate Plan"
// 3. The subject is sent to the API
// 4. The API returns a plan

const PdfCreator = () => {
  const [activateAutomaticContent, setActivateAutomaticContent] =
    useState<boolean>(true);

  const [tokenEncoding, setTokenEncoding] = useState(null);
  const [subject, setSubject] = useState("");
  const [generatePlanDone, setGeneratePlanDone] = useState<boolean>(false);
  const [plan, setPlan] = useState<string[]>([]);
  const [allContent, setAllContent] = useState<string>("");
  const [lang, setLang] = useState<string>("fr");
  const [chapterContent, setChapterContent] = useState<ChapterContents>({});
  const [loading, setLoading] = useState(false);
  const [pdfId, setPdfId] = useState<string>("");
  const [responseSubject, setResponseSubject] = useState<string>("");
  const [streamedContent, setStreamedContent] = useState<string>("");
  const [regenerate, setRegenerate] = useState<boolean>(false);
  const [whatInProgress, setWhatInProgress] = useState<string>(""); // "plan" | "content" | ""
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [abortContentController, setAbortContentController] =
    useState<AbortController | null>(null);
  const [createdPlans, setCreatedPlans] = useState<Plan[]>([]); // état pour stocker les plans créés
  const [displayPdf, setDisplayPdf] = useState<any>([]);
  const converter = useMemo(() => {
    return new Showdown.Converter();
  }, []);

  const markdownToHtml = useCallback(
    (markdown: string) => {
      return converter.makeHtml(markdown);
    },
    [converter]
  );
  // const gptModel = "gpt-4-1106-preview";
  const gptModel = "gpt-3.5-turbo";
  const maxTokens = 50;
  const router = useRouter();

  // NOTE: Fetch PDF's
  // const fetchPdf = async () => {
  //   try {
  //     const pdfCreatorObject = await getPdfPlanAndContent(
  //       "clozqvy9c02rn8zlojt373f7p"
  //     );
  //     if (pdfCreatorObject && pdfCreatorObject.pdfPlan) {
  //       setDisplayPdf(pdfCreatorObject.pdfPlan);
  //     } else {
  //       // Gérer le cas où pdfPlan n'est pas disponible
  //       console.error("No pdfPlan found in the response");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching planos:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchPdf();
  // }, []);

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
    if (abortController !== null) {
      abortController.abort();
    }
    if (abortContentController !== null) {
      abortContentController.abort();
    }
    deletePlan(pdfId);
    router.refresh();
    setAbortController(null);
    setAbortContentController(null);
    setLoading(false);
    setResponseSubject("");
    setCreatedPlans([]);
    setChapterContent({});
    setAllContent("");
    setStreamedContent("");
    setPlan([]);
    setPdfId("");
    // On supprime le plan
  };

  useEffect(() => {
    if (responseSubject) {
      const newPlan = parseTitles(responseSubject);
      setPlan(newPlan);
    }
  }, [responseSubject]);

  const regeneratePlan = async () => {
    handleCancel();
    generatePlan();
  };
  const generatePlan = async () => {
    const controller = new AbortController();
    setAbortController(controller);

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

      const data = response.body;
      if (!data) {
        return;
      }
      // On créé le PDF
      const pdfResponse = await createPdf(lang, subject);
      setPdfId(pdfResponse?.id || ""); // Assurez-vous que setPdfId est appelé avec un string

      // On stream le plan
      const reader = data.getReader();

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        setWhatInProgress("plan");
        const { value, done: doneReading } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true });

          // Traiter chaque ligne du buffer
          let bufferLines = buffer.split("\n");
          for (let i = 0; i < bufferLines.length - 1; i++) {
            const line = bufferLines[i];

            // Ajouter la ligne au contenu streamé
            setStreamedContent((prev) => prev + line + "\n");

            // Traiter le contenu textuel pour le PDF, etc.
            const titlesToAdd = parseTitles(line + "\n");
            if (titlesToAdd.length > 0 && pdfResponse.id) {
              const newPlans = await createPdfPlan(titlesToAdd, pdfResponse.id);
              setCreatedPlans((prevPlans) => [...prevPlans, ...newPlans]);
            }
          }
          // Reconstruire le buffer avec la dernière ligne incomplète
          buffer = bufferLines[bufferLines.length - 1];
        }

        if (doneReading) {
          done = true;
        }
      }
      // Juste après la boucle while, ce qui signifie que le flux est terminé
      if (done) {
        setGeneratePlanDone(true);
        setWhatInProgress("");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Fetch failed:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

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
    setPlan([]);
    setAbortController(null);
    setAbortContentController(null);
    // On supprime le plan
    deletePlan(pdfId);
  };

  // Exemple de fonction pour appeler votre autre API
  const generateContent = useCallback(
    async (title: string, pdfId: string) => {
      const controller = new AbortController();
      setAbortContentController(controller);
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
  ]);

  const handleUpdatePlanTitle = (planId: string, newTitle: string) => {
    // Mettez à jour l'état createdPlans
    setCreatedPlans((prevPlans) =>
      prevPlans.map((plan) => {
        if (plan.id === planId) {
          return { ...plan, planTitle: newTitle };
        }
        return plan;
      })
    );

    // Logique existante pour la mise à jour du plan dans la base de données ou autre
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

  return (
    <div className="min-h-screen">
      <div className="flex flex-row gap-x-2 items-center">
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
        {loading && <Button onClick={handleCancel}>Annuler la Demande</Button>}
        {!loading && responseSubject && (
          <Button onClick={handleTryAgain}>Recommencer</Button>
        )}
      </div>
      <div className="rounded-xl border bg-opacity-90 shadow-md transition grid grid-cols-1 gap-x-2 items-start">
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
        <div>
          {/* On converti tout en markdown */}
          <article className="p-10">
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
                {/* Ajout du contenu du plan si disponible en utilisant l'ID du plan */}
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
        {/* <div>
					{Object.entries(chapterContent).map(([title, content]) => (
						<div key={title}>
							<h3>{title}</h3>
							<p>{content}</p>
						</div>
					))}
				</div> */}
      </div>
      {/* <div className="streamed-content">
				<h2>Contenu Streamé</h2>
				<div
					dangerouslySetInnerHTML={{ __html: markdownToHtml(streamedContent) }}
				/>
			</div> */}
      <div className="flex flex-col gap-2">
        <button onClick={() => downloadPdf(allContent, "Fastuff-" + subject)}>
          Télécharger le PDF
        </button>
        <button onClick={() => downloadDocx(allContent, "Fastuff-" + subject)}>
          Télécharger le DocX
        </button>
        <button onClick={() => downloadHtml(allContent, "Fastuff-" + subject)}>
          Télécharger en HTML
        </button>
        <button
          onClick={() => {
            downloadMarkdown(
              converter.makeMarkdown(allContent),
              "Fastuff-" + subject
            );
          }}>
          Télécharger le MD
        </button>
        <div>
          {tokenEncoding && (
            <div>Encodage Token: {JSON.stringify(tokenEncoding)}</div>
          )}
        </div>
      </div>
      {/* <div className="streamed-content">
				<h2>Contenu Agrégé</h2>
				<div dangerouslySetInnerHTML={{ __html: markdownToHtml(allContent) }} />
			</div> */}
    </div>
  );
};

export default PdfCreator;
