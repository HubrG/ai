"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import Showdown from "showdown";
import {
  createPdf,
  createPdfPlan,
  deletePlan,
  updatePlan,
} from "./utils.server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// SECTION: TYPES/INTERFACES
interface Plan {
  id: string;
  planTitle: string;
  planLevel?: string;
}

// NOTE: Operations
// 1. User enters a subject
// 2. User clicks on "Generate Plan"
// 3. The subject is sent to the API
// 4. The API returns a plan

const PdfCreator = () => {
  const [subject, setSubject] = useState("");
  const [plan, setPlan] = useState<string[]>([]);
  const [lang, setLang] = useState<string>("fr");
  const [chapterContent, setChapterContent] = useState({});
  const [loading, setLoading] = useState(false);
  const [pdfId, setPdfId] = useState<string>("");
  const [selectedPlanContent, setSelectedPlanContent] = useState("");
  const [responseSubject, setResponseSubject] = useState<string>("");
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [createdPlans, setCreatedPlans] = useState<Plan[]>([]); // état pour stocker les plans créés
  const converter = new Showdown.Converter();

  const markdownToHtml = (markdown: string) => {
    return converter.makeHtml(markdown);
  };

  const parseTitles = (text: string) => {
    const lines = text.split("\n");
    const newPlan: string[] = [];
    lines.forEach((line: string) => {
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
      const response = await fetch("/api/pdfcreator", {
        method: "POST",
        signal: controller.signal, // Ajout du signal au fetch
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: subject,
          type: "plan",
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
      const pdfResponse = await createPdf(lang);
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

            // On traite les lignes complètes ici
            console.log(pdfResponse.id);
            if (completeLines && pdfResponse.id !== undefined) {
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
      if (buffer) {
        await handleNewPlanTitles(buffer);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Fetch failed:", error.message);
      }
    } finally {
      if (buffer) {
        await handleNewPlanTitles(buffer);
      }
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
    // On supprime le plan
    deletePlan(pdfId);
  };

  const handleNewPlanTitles = async (titlesChunk: string) => {
    const titles = parseTitles(titlesChunk);
    if (titles.length > 0 && pdfId !== "") {
      const newPlans = await createPdfPlan(titles, pdfId);
      // On s'assure que newPlans contient bien les données et qu'elles sont au format attendu :
      setCreatedPlans((prevPlans) => [...prevPlans, ...newPlans]);
    }
  };

  const generateChapter = (chapterIndex: number) => {
    // Appel à l'API ChatGPT pour générer le contenu du chapitre
    // setChapterContent({...chapterContent, [chapterIndex]: responseFromChatGPT});
  };
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
            <div className="flex flex-row" key={plan.id}>
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
          ))}
        </div>
        <div>
          {/* On converti tout en markdown */}
          {createdPlans.map((plan) => (
            <div key={plan.id}>
              {/* <h1>{converter.makeHtml(plan.planLevel + " " + plan.planTitle)}</h1> */}
              <article
                className="text-left"
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(plan.planLevel + " " + plan.planTitle),
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PdfCreator;
