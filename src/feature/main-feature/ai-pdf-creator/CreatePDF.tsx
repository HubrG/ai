"use client";
import React, { useEffect, useCallback, useState } from "react";
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
} from "./utils.server";
import { pdfCreatorContent } from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";

// SECTION: TYPES/INTERFACES
interface Plan {
  id: string;
  planTitle: string;
  planLevel?: string;
}
interface ApiResponse {
  content: string; // Assurez-vous que cela correspond à la structure de votre réponse d'API
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
  const [subject, setSubject] = useState("");
  const [generatePlanDone, setGeneratePlanDone] = useState<boolean>(false);
  const [plan, setPlan] = useState<string[]>([]);
  const [lang, setLang] = useState<string>("fr");
  const [chapterContent, setChapterContent] = useState<ChapterContents>({});
  const [loading, setLoading] = useState(false);
  const [pdfId, setPdfId] = useState<string>("");
  const [responseSubject, setResponseSubject] = useState<string>("");
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [createdPlans, setCreatedPlans] = useState<Plan[]>([]); // état pour stocker les plans créés
  const converter = new Showdown.Converter();
  const markdownToHtml = (markdown: string) => {
    return converter.makeHtml(markdown);
  };
  const [displayPdf, setDisplayPdf] = useState<any>([]);

  const fetchPdf = async () => {
    try {
      const pdfCreatorObject = await getPdfPlanAndContent(
        "clozqvy9c02rn8zlojt373f7p"
      );
      if (pdfCreatorObject && pdfCreatorObject.pdfPlan) {
        setDisplayPdf(pdfCreatorObject.pdfPlan);
      } else {
        // Gérer le cas où pdfPlan n'est pas disponible
        console.error("No pdfPlan found in the response");
      }
    } catch (error) {
      console.error("Error fetching planos:", error);
    }
  };

  useEffect(() => {
    fetchPdf();
  }, []);

  // console.log(planos);

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
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      setResponseSubject("");
      setCreatedPlans([]);
      setPlan([]);
      setPdfId("");
      // On supprime le plan
    }
  };

  useEffect(() => {
    if (responseSubject) {
      const newPlan = parseTitles(responseSubject);
      setPlan(newPlan);
    }
  }, [responseSubject]);

  const generatePlan = async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    let buffer = "";

    try {
      const response = await fetch("/api/pdfcreator/planCreator", {
        method: "POST",
        signal: controller.signal, // Ajout du signal au fetch
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: subject,
          type: "plan",
          // gpt-3.5-turbo | gpt-4-1106-preview
          model: "gpt-3.5-turbo",
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
        const { value, done: doneReading } = await reader.read();
        if (value && pdfResponse.id) {
          buffer += decoder.decode(value, { stream: true });
          // Si nous avons reçu un saut de ligne, on traite le buffer
          if (buffer.includes("\n")) {
            // On sépare le buffer en lignes complètes et le reste du buffer
            let [completeLines, ...rest] = buffer.split("\n");
            buffer = rest.join("\n"); // Reconstruisez le buffer avec le reste

            if (completeLines && pdfResponse.id !== undefined) {
              // On traite les lignes complètes ici
              const titlesToAdd = parseTitles(completeLines + "\n");
              if (titlesToAdd.length > 0) {
                const newPlans = await createPdfPlan(
                  titlesToAdd,
                  pdfResponse?.id
                );
                setCreatedPlans((prevPlans) => [...prevPlans, ...newPlans]);
              }
            } else {
              done = doneReading;
            }
          }
        }
        done = doneReading;
      }
      // Juste après la boucle while, ce qui signifie que le flux est terminé
      if (done) {
        setGeneratePlanDone(true);
        // Autres logiques si nécessaire
      }
      if (buffer) {
        // await handleNewPlanTitles(buffer);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Fetch failed:", error.message);
      }
    } finally {
      if (buffer) {
        // await handleNewPlanTitles(buffer);
        // On fait un appel à l'autre API pour générer le contenu des chapitres
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && responseSubject && pdfId !== "") {
      console.log("ok");
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
    // On supprime le plan
    deletePlan(pdfId);
  };

  // Exemple de fonction pour appeler votre autre API
  const callYourOtherAPI = useCallback(
    async (title: string, pdfId: string) => {
      try {
        const response = await fetch("/api/pdfcreator/contentCreator", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, lang, model: "gpt-3.5-turbo", pdfId }),
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
    [lang]
  );

  useEffect(() => {
    if (generatePlanDone) {
      setLoading(true);
      const apiCalls = createdPlans.map((plan) =>
        callYourOtherAPI(plan.planTitle, plan.id).then((apiResponse) => {
          if (apiResponse) {
            const newContent = apiResponse.planContent; // Vérifiez que c'est le format correct
            setChapterContent((prevContent) => ({
              ...prevContent,
              [plan.planTitle]: newContent,
            }));
          }
        })
      );

      Promise.all(apiCalls)
        .then(() => {
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error in one of the API calls:", error);
          setLoading(false);
        });

      setGeneratePlanDone(false); // Réinitialisez si nécessaire
    }
  }, [generatePlanDone, createdPlans, callYourOtherAPI]);

  const handleUpdatePlanTitle = (planId: string, newTitle: string) => {
    const upPlan = updatePlan(planId, newTitle);
    if (upPlan !== null) {
      console.log("Plan updated");
    } else {
      console.log("Plan not updated");
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
        <Button onClick={generatePlan} disabled={loading}>
          {loading && <Loader />} Générer le Plan
        </Button>
        {loading && <Button onClick={handleCancel}>Annuler la Demande</Button>}
        {!loading && responseSubject && (
          <Button onClick={handleTryAgain}>Recommencer</Button>
        )}
      </div>
      <div className="rounded-xl border bg-opacity-90 shadow-md transition grid grid-cols-2 gap-x-2 items-start">
        <div className="row-span-3">
          {createdPlans.map((plan) => (
            <div className="flex flex-col gap-1" key={plan.id}>
              <div className="flex flex-row">
                <span>{plan.planLevel}</span>
                <Input
                  key={plan.id}
                  id={`title-${plan.id}`}
                  placeholder={`Titre`}
                  defaultValue={plan.planTitle}
                  onChange={(e) => {
                    handleUpdatePlanTitle(plan.id, e.currentTarget.value);
                  }}
                />
              </div>
              <div>
                {chapterContent[plan.planTitle] && (
                  <Textarea value={chapterContent[plan.planTitle]} readOnly />
                )}
              </div>
            </div>
          ))}
        </div>
        <div>
          {/* On converti tout en markdown */}
          <article>
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
                {/* Ajout du contenu du plan si disponible */}
                {chapterContent[plan.planTitle] && (
                  <div
                    className="text-left"
                    dangerouslySetInnerHTML={{
                      __html: markdownToHtml(chapterContent[plan.planTitle]),
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
    </div>
  );
};

export default PdfCreator;
