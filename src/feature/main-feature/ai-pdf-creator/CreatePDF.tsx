"use client";
import React, { useMemo, useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import Showdown from "showdown";
import { Switch } from "@/components/ui/switch";
import {
  createPdfPlan,
  getPdfPlanAndContent,
  updatePlan,
  updateContent,
  retrieveTokenRemaining,
  updatePdfSettings,
  updatePlanIsSelected,
  updateContentIsSelected,
} from "./utils.server";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/app/Context/store";
import DownloadButton from "./components/DownloadButton";
import { languageList } from "@/src/list/ai/languagesList";
import { SelectLang } from "../components/SelectLang";
import { SelectTone } from "../components/SelectTone";
import { SelectPersonality } from "../components/SelectPersonality";
import { SelectLength } from "../components/SelectLength";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleChevronLeft,
  faCircleChevronRight,
  faLanguage,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faInfoCircle,
  faMusic,
  faPodiumStar,
  faRobot,
  faRuler,
} from "@fortawesome/pro-duotone-svg-icons";
import { EditPartOfPdfButton } from "./components/EditPartOfPdfButton";
import { SelectModelGPT } from "../components/SelectGPTModel";
import { personalityToKey } from "@/src/list/ai/personalitiesList";
import { toneToKey } from "@/src/list/ai/tonesList";
import { Separator } from "@/components/ui/separator";
import { lengthToKey } from "@/src/list/ai/lengthList";

// SECTION: TYPES/INTERFACES
interface Plan {
  id: string;
  planTitle: string;
  planLevel?: string;
  tokenRemaining?: number;
  isSelected?: boolean;
  idRef?: string;
  personality?: string;
  pdfCreatorContent?: {
    planContent: string;
  }[];
  tone?: string;
  length?: string;
  lang?: string;
  gptModelId?: any;
}
interface PlansWithAllVersions {
  [key: string]: {
    allVersions: Plan[];
    activeVersion: Plan | null;
  };
}
type LanguageCode = keyof typeof languageList;

interface ChapterContents {
  [key: string]: ChapterContentItem;
}
interface ChapterContentItem {
  content: string;
  lang?: LanguageCode; // Vous pouvez ajouter d'autres propriétés si nécessaire
}

type ContentType = {
  // ...définition de vos propriétés de contenu ici
  isSelected: boolean;
  id: string;
  idRef: string;
  planContent: string;
  createdAt?: string; // Assurez-vous que c'est le bon type
  lang?: string;
  tone?: string;
  length?: string;
  personality?: string;
  gptModel?: any;
};
type ContentsWithAllVersions = {
  allVersions: ContentType[];
  activeVersion: ContentType | null;
};

// Définissez le type pour l'ensemble de l'état 'contentsWithAllVersions'
type ContentsWithAllVersionsState = {
  [key: string]: ContentsWithAllVersions;
};
type PdfCreatorProps = {
  params: { id: string };
};

const maxTokens = 50;
//

const PdfCreator = ({ params }: PdfCreatorProps) => {
  const pdfId = params.id;
  const router = useRouter();
  const [activateAutomaticContent, setActivateAutomaticContent] =
    useState<boolean>(true);
  const [abortControllers, setAbortControllers] = useState<AbortController[]>(
    []
  );
  const { user, setUser } = useGlobalContext();
  const [subject, setSubject] = useState("");
  const [generatePlanDone, setGeneratePlanDone] = useState<boolean>(false);
  const [allContent, setAllContent] = useState<string>("");
  const [chapterContent, setChapterContent] = useState<ChapterContents>({});
  const [loading, setLoading] = useState(false);
  const [responseSubject, setResponseSubject] = useState<string>("");
  const [regenerate, setRegenerate] = useState<boolean>(false);
  const [whatInProgress, setWhatInProgress] = useState<string>("");
  const [createdPlans, setCreatedPlans] = useState<Plan[]>([]);
  const [gptModel, setGptModel] = useState<string>("gpt-3.5-turbo");
  const [plansWithAllVersions, setPlansWithAllVersions] =
    useState<PlansWithAllVersions>({});
  const [contentsWithAllVersions, setContentsWithAllVersions] =
    useState<ContentsWithAllVersionsState>({});

  //
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | "">(
    "en"
  );
  const [selectedTone, setSelectedTone] = useState("energetic");
  const [selectedPersonality, setSelectedPersonality] = useState("deep");
  const [selectedLength, setSelectedLength] = useState("medium");
  const [selectedToneValue, setSelectedToneValue] = useState(
    "Energetic and enthusiastic"
  );
  const [selectedPersonalityValue, setSelectedPersonalityValue] =
    useState("Deep Thinker");
  const [selectedLengthValue, setSelectedLengthValue] = useState("Medium");
  //
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
        [planId]: { content: newValue },
      }));
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
  // NOTE: Fetch PDF's
  const fetchPdf = useCallback(async () => {
    try {
      const pdfCreatorObject = await getPdfPlanAndContent(params.id);

      if (pdfCreatorObject && pdfCreatorObject.pdfPlan) {
        const plansWithAllVersions: PlansWithAllVersions = {};
        const contentsWithAllVersions: { [key: string]: any } = {};

        pdfCreatorObject.pdfPlan.forEach((plan: Plan) => {
          const planKey = plan.idRef || plan.id;
          if (!plansWithAllVersions[planKey]) {
            plansWithAllVersions[planKey] = {
              allVersions: [],
              activeVersion: null,
            };
          }
          plansWithAllVersions[planKey].allVersions.push(plan);
          if (plan.isSelected) {
            plansWithAllVersions[planKey].activeVersion = plan;
          }

          // Traiter le contenu de chaque plan
          if (plan.pdfCreatorContent && plan.pdfCreatorContent.length > 0) {
            // Trier le contenu par createdAt
            const sortedContent = plan.pdfCreatorContent.sort(
              (a: any, b: any) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );

            sortedContent.forEach((content: any) => {
              if (!contentsWithAllVersions[planKey]) {
                contentsWithAllVersions[planKey] = {
                  allVersions: [],
                  activeVersion: null,
                };
              }
              contentsWithAllVersions[planKey].allVersions.push(content);
              if (content.isSelected) {
                contentsWithAllVersions[planKey].activeVersion = content;
              }
            });
          }
        });

        setPlansWithAllVersions(plansWithAllVersions);
        setContentsWithAllVersions(contentsWithAllVersions);

        // Transformer en tableau de Plan[] contenant seulement les versions actives
        const activePlans = Object.values(plansWithAllVersions)
          .map((item) => item.activeVersion)
          .filter((plan) => plan !== null) as Plan[];

        setCreatedPlans(activePlans);
        // On prépare le contenu des chapitres
        const contentObject: ChapterContents = {};
        pdfCreatorObject.pdfPlan.forEach((plan: any) => {
          if (plan.pdfCreatorContent && plan.pdfCreatorContent.length > 0) {
            contentObject[plan.id] = {
              content: plan.pdfCreatorContent[0].planContent,
              lang: plan.lang, // Assurez-vous que la propriété 'lang' est disponible ici
            };
          }
        });

        // On met à jour l'état chapterContent avec les contenus récupérés
        setChapterContent(contentObject);
        setSelectedLanguage(pdfCreatorObject.lang as LanguageCode);
        setSelectedTone(pdfCreatorObject.tone);
        setSelectedPersonality(pdfCreatorObject.personality);
        setSelectedLength(pdfCreatorObject.length);
        setSubject(pdfCreatorObject.subject);
        setActivateAutomaticContent(pdfCreatorObject.automaticContent);
        if (pdfCreatorObject.gptModel?.GPTModel === undefined) {
          setGptModel("gpt-3.5-turbo");
        } else {
          setGptModel(pdfCreatorObject.gptModel.GPTModel);
        }
        // On met à jour la langue
        return pdfCreatorObject;
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
    //
    setLoading(false);
    setResponseSubject("");
    setCreatedPlans([]);
    setChapterContent({});
    setAllContent("");
    router.refresh();
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
          lang: selectedLanguage,
          tone: selectedToneValue,
          length: selectedLengthValue,
          personality: selectedPersonalityValue,
        }),
      });
      // On met à jour les states lang, tone, length, personality en BDD

      if (!response.ok) {
        throw new Error(response.statusText);
      }
      updatePdfSettings(
        pdfId,
        selectedLanguage,
        selectedTone,
        selectedPersonality,
        selectedLength,
        subject,
        activateAutomaticContent,
        gptModel
      );
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
              const newPlans = await createPdfPlan(
                titlesToAdd,
                pdfId,
                gptModel,
                selectedLanguage,
                selectedLength,
                selectedPersonality,
                selectedTone
              );
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
          console.log("Fetch aborted:", error.message);
        } else {
          console.error("Fetch failed:", error.message);
        }
      }
    } finally {
      setLoading(false);
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
            title: title,
            model: gptModel,
            lang: selectedLanguage,
            pdfId: pdfId,
            maxTokens: maxTokens,
            plan: createdPlans,
            personality: selectedPersonalityValue,
            length: selectedLengthValue,
            tone: selectedToneValue,
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
    [
      selectedLanguage,
      createdPlans,
      selectedToneValue,
      selectedLengthValue,
      selectedPersonalityValue,
      gptModel,
    ]
  );

  useEffect(() => {
    if (!loading && responseSubject && pdfId !== "") {
      // On s'assure que l'appel de fonction est correct :
      createPdfPlan(
        parseTitles(responseSubject),
        pdfId,
        gptModel,
        selectedLanguage,
        selectedLength,
        selectedPersonality,
        selectedTone
      ).then((newPlans) => {
        setCreatedPlans((prevPlans) => [...prevPlans, ...newPlans]);
      });
    }
  }, [
    loading,
    responseSubject,
    pdfId,
    gptModel,
    selectedLanguage,
    selectedLength,
    selectedPersonality,
    selectedTone,
  ]);

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
          ? markdownToHtml(chapterContent[plan.id].content)
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
            const newContent = apiResponse.planContent;

            setChapterContent((prevContent) => ({
              ...prevContent,
              [plan.id]: {
                content: newContent, // Ou une autre valeur
              },
            }));

            const contentsWithAllVersions: ContentsWithAllVersions = {
              allVersions: [
                {
                  isSelected: true,
                  id: apiResponse.id,
                  idRef: apiResponse.idRef,
                  planContent: newContent,
                },
              ],
              activeVersion: {
                isSelected: true,
                id: apiResponse.id,
                idRef: apiResponse.idRef,
                planContent: newContent,
              },
            };

            setContentsWithAllVersions((prev) => ({
              ...prev,
              [plan.id]: contentsWithAllVersions,
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


  const handleLanguageChange = async (language: LanguageCode) => {
    setSelectedLanguage(language);
  };

  const handleToneChange = (toneKey: string, toneValue: string) => {
    console.log(toneKey, toneValue);
    setSelectedTone(toneKey);
    setSelectedToneValue(toneValue);
  };

  const handlePersonalityChange = (
    personalityKey: string,
    personalityValue: string
  ) => {
    setSelectedPersonality(personalityKey);
    setSelectedPersonalityValue(personalityValue);
  };

  const handleLengthChange = (lengthKey: string, lengthValue: string) => {
    setSelectedLength(lengthKey);
    setSelectedLengthValue(lengthValue);
  };

  const handleGptModelChange = (modelValue: string) => {
    setGptModel(modelValue);
  };

  const handleRefresh = () => {
    fetchPdf();
    updateContextTokenRemaining();

  };

  const navigatePlanVersion = async (
    planKey: string,
    direction: "prev" | "next"
  ) => {
    const planVersions = plansWithAllVersions[planKey].allVersions;
    const activeVersionIndex = planVersions.findIndex(
      (plan) => plan.isSelected
    );

    let newActiveIndex = activeVersionIndex;
    if (direction === "prev" && activeVersionIndex > 0) {
      newActiveIndex -= 1;
    } else if (
      direction === "next" &&
      activeVersionIndex < planVersions.length - 1
    ) {
      newActiveIndex += 1;
    }
    // On récupère l'ID et on l'envoie en BDD
    const newId = planVersions[newActiveIndex].id;
    const up = await updatePlanIsSelected(
      newId,
      planVersions[newActiveIndex].idRef || ""
    );

    const newActiveVersion = planVersions[newActiveIndex];

    // Mettre à jour l'état local
    const updatedPlansWithAllVersions = { ...plansWithAllVersions };
    updatedPlansWithAllVersions[planKey].allVersions.forEach((plan) => {
      plan.isSelected = plan.id === newActiveVersion.id;
    });
    updatedPlansWithAllVersions[planKey].activeVersion = newActiveVersion;
    setPlansWithAllVersions(updatedPlansWithAllVersions);

    // Mettre à jour l'état createdPlans
    const updatedCreatedPlans = createdPlans.map((plan) =>
      plan.idRef === planKey || plan.id === planKey ? newActiveVersion : plan
    );
    setCreatedPlans(updatedCreatedPlans);
  };

  const navigateContentVersion = async (
    contentKey: string,
    planId: string,
    direction: "prev" | "next"
  ) => {
    const totalVersions =
      contentsWithAllVersions[contentKey]?.allVersions.length || 0;
    let activeVersionIndex =
      contentsWithAllVersions[contentKey]?.allVersions.findIndex(
        (p: ContentType) => p.isSelected
      ) || 0;

    if (direction === "prev" && activeVersionIndex > 0) {
      activeVersionIndex--;
    } else if (direction === "next" && activeVersionIndex < totalVersions - 1) {
      activeVersionIndex++;
    }

    // Mettre à jour les versions pour refléter quelle version est actuellement sélectionnée
    const updatedVersions = contentsWithAllVersions[
      contentKey
    ]?.allVersions.map((content: ContentType, index: number) => ({
      ...content,
      isSelected: index === activeVersionIndex,
    }));

    // On récupère l'ID et on l'envoie en BDD
    const newId = updatedVersions[activeVersionIndex].id;
    const up = await updateContentIsSelected(newId, planId);

    // Mettre à jour le state
    setContentsWithAllVersions((prev) => {
      return {
        ...prev,
        [contentKey]: {
          allVersions: updatedVersions,
          activeVersion: updatedVersions[activeVersionIndex],
        },
      };
    });

   

    // Mettre à jour en base de données si nécessaire
    // ...
  };

  return (
    <div className="flex md:flex-row items-start flex-col w-full gap-5">
      <div className="md:w-3/12 sticky md:top-24 top-32 dark:bg-transparent dark:border bg-app-200 w-full h-auto py-5 p-3 rounded-lg ">
        <div className="flex flex-col items-center gap-5 flex-wrap h-auto">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label
              htmlFor="subject"
              className="flex flex-row justify-between items-center">
              Subject of your PDF
            </Label>
            <Input
              className=" h-12 text-base font-semibold"
              id="subject"
              disabled={loading}
              placeholder="Your subject, any..."
              value={subject}
              onChange={(e) => setSubject(e.currentTarget.value)}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="language">
              <span>Language</span>
              <FontAwesomeIcon icon={faLanguage} className="font-ligth" />{" "}
            </Label>
            <SelectLang
              id="language"
              onLanguageChange={handleLanguageChange}
              selectedLangInit={selectedLanguage}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label
              htmlFor="tone"
              className="flex flex-row justify-between items-center px-1">
              <span>The tone</span>
              <FontAwesomeIcon icon={faMusic} className="font-ligth" />
            </Label>
            <SelectTone
              id="tone"
              onToneChange={handleToneChange}
              selectedToneInit={selectedTone}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label
              htmlFor="personality"
              className="flex flex-row justify-between items-center px-1">
              <span>The personality</span>
              <FontAwesomeIcon icon={faPodiumStar} className="font-ligth" />
            </Label>
            <SelectPersonality
              id="personality"
              onPersonalityChange={handlePersonalityChange}
              selectedPersonalityInit={selectedPersonality}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label
              htmlFor="gptModel"
              className="flex flex-row justify-between items-center px-1">
              <span>The robot</span>
              <FontAwesomeIcon icon={faRobot} className="font-ligth" />
            </Label>
            <SelectModelGPT
              id="gptModel"
              onGPTModelChange={handleGptModelChange}
              selectedModelGPTInit={gptModel}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label
              htmlFor="length"
              className="flex flex-row justify-between items-center px-1">
              <span>The length</span>
              <FontAwesomeIcon icon={faRuler} className="font-ligth" />
            </Label>
            <SelectLength
              id="length"
              onLengthChange={handleLengthChange}
              selectedLengthInit={selectedLength}
            />
          </div>
          <div className="flex items-center justify-between w-full mb-2 space-x-2">
            <Switch
              id="activeGenerateContent"
              checked={activateAutomaticContent}
              onCheckedChange={(checked) => {
                setActivateAutomaticContent(checked);
              }}
            />
            <Label htmlFor="activeGenerateContent">
              <p className="text-right text-sm">
                Generate content automatically
              </p>
            </Label>
          </div>
          <div className="infoForm -mt-4 text-left w-full flex flex-row items-start gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="font-ligth" />
            <span className="text-justify">
              Once the plan is generated, the content of each point will be
              generated automatically. Disable this option if you want to
              validate the plan before generating the content.
            </span>
          </div>
          <div className="flex w-full flex-row gap-x-2">
            <Button
              className="w-full"
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
      </div>
      <div className="md:w-9/12 w-full sticky md:top-28 top-52 ">
        <div className="rounded-xl  bg-opacity-90  shadow-xl  transition grid grid-cols-1 gap-x-2 items-start mb-10">
          <div className="rounded-t-xl p-2 py-3 mb-2 md:shadow-none shadow-t-md flex flex-row gap-x-2 dark:bg-app-700 bg-app-200 items-center border-b border-white dark:border-app-900">
            <DownloadButton
              allContent={allContent}
              subject={subject}
              disabled={createdPlans.length === 0}
            />
            <div>Nombre de mots</div>
            <div>Tokens dépensés</div>
            <div>Temps de lect</div>
            {/* FIXME: pouvoir modifier un titre / content en tapant dans une input */}
            {/* FIXME: gérér "All content" qui déconne, et ne se met pas à jour */}
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
                      value={chapterContent[plan.id].content}
                      onChange={(e) =>
                        handleUpdateContent(plan.id, e.currentTarget.value)
                      }
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="py-5 -mt-2 overflow-y-auto  px-14 pr-20 rounded-b-xl max-h-[71vh] bg-app-50 dark:bg-app-800">
            <article className="">
              {createdPlans.length === 0 && (
                <div className="text-center w-full border-2 p-5 border-app-200 bg-white dark:bg-app-800 my-5 rounded-lg border-dashed dark:border-app-900 ">
                  <p className="text-center ">
                    <span className="opacity-70">
                      Fill out the form and widen your eyes...
                    </span>{" "}
                    🤩
                  </p>
                </div>
              )}
              {createdPlans.map((plan) => {
                // Calculs pour la navigation entre les versions
                const planKey = plan.idRef || plan.id;
                const totalVersions =
                  plansWithAllVersions[planKey]?.allVersions.length || 0;
                const activeVersionIndex =
                  plansWithAllVersions[planKey]?.allVersions.findIndex(
                    (p) => p.isSelected
                  ) || 0;

                const contentKey = plan.idRef || plan.id;
                const totalContentVersions =
                  contentsWithAllVersions[contentKey]?.allVersions.length || 0;
                const activeContentVersionIndex =
                  contentsWithAllVersions[contentKey]?.allVersions.findIndex(
                    (content) => content.isSelected
                  ) || 0;

                const activeContent =
                  contentsWithAllVersions[contentKey]?.activeVersion;
                return (
                  <>
                    <div key={plan.id} className="space-y-4">
                      <div className="relative">
                        <div
                          className="text-left"
                          dangerouslySetInnerHTML={{
                            __html: markdownToHtml(
                              plan.planLevel + " " + plan.planTitle
                            ),
                          }}
                        />
                        <div className="flex flex-col absolute md:-right-14 -right-[4.2rem] top-3">
                          <div className="flex flex-row gap-0.5">
                            <FontAwesomeIcon
                              icon={faCircleChevronLeft}
                              onClick={() =>
                                navigatePlanVersion(planKey, "prev")
                              }
                              className={`
                            select-none	
                            ${
                              activeVersionIndex <= 0
                                ? "opacity-50"
                                : "opacity-80 hover:opacity-100 cursor-pointer"
                            }`}
                            />
                            <FontAwesomeIcon
                              icon={faCircleChevronRight}
                              onClick={() =>
                                navigatePlanVersion(planKey, "next")
                              }
                              className={`
                            select-none	
                            ${
                              activeVersionIndex >= totalVersions - 1
                                ? "opacity-50"
                                : "opacity-80 hover:opacity-100 cursor-pointer"
                            }`}
                            />
                          </div>
                          {totalVersions > 1 && (
                            <p className="py-0 my-1 text-xs text-center">
                              v.{activeVersionIndex + 1}/{totalVersions}
                            </p>
                          )}
                        </div>

                        <EditPartOfPdfButton
                          type="plan"
                          id={plan.id}
                          toneInit={
                            !plan.tone
                              ? selectedTone
                              : toneToKey(plan.tone) || selectedTone
                          }
                          lengthInit={selectedLength}
                          personalityInit={
                            !plan.personality
                              ? selectedPersonality
                              : personalityToKey(plan.personality) ||
                                selectedPersonality
                          }
                          gptModelInit={gptModel}
                          langInit={plan.lang ? plan.lang : selectedLanguage}
                          lengthValueInit={selectedLengthValue}
                          toneValueInit={selectedToneValue}
                          personalityValueInit={selectedPersonalityValue}
                          valueInit={plan.planTitle}
                          plan={createdPlans}
                          subject={subject}
                          pdfId={pdfId}
                          planLevel={plan.planLevel}
                          idRef={plan.idRef}
                          onRefresh={handleRefresh}
                        />
                      </div>
                      {(chapterContent[plan.idRef as string] ||
                        chapterContent[plan.id as string]) && (
                        <div className="relative group">
                          {activeContent && (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: markdownToHtml(
                                  activeContent.planContent
                                ),
                              }}
                            />
                          )}
                          {/* Boutons pour naviguer entre les versions du contenu */}
                          <div className="flex flex-col absolute md:-right-14 -right-[4.2rem] top-3">
                            <div className="flex flex-row gap-0.5">
                              <FontAwesomeIcon
                                icon={faCircleChevronLeft}
                                onClick={() =>
                                  navigateContentVersion(
                                    contentKey,
                                    plan.id,
                                    "prev"
                                  )
                                }
                                className={`select-none ${
                                  activeContentVersionIndex <= 0
                                    ? "opacity-50"
                                    : "opacity-80 hover:opacity-100 cursor-pointer"
                                }`}
                              />
                              <FontAwesomeIcon
                                icon={faCircleChevronRight}
                                onClick={() =>
                                  navigateContentVersion(
                                    contentKey,
                                    plan.id,
                                    "next"
                                  )
                                }
                                className={`select-none ${
                                  activeContentVersionIndex >=
                                  totalContentVersions - 1
                                    ? "opacity-50"
                                    : "opacity-80 hover:opacity-100 cursor-pointer"
                                }`}
                              />
                            </div>
                            {totalContentVersions > 1 && (
                              <p className="py-0 my-1 text-xs text-center">
                                v.{activeContentVersionIndex + 1}/
                                {totalContentVersions}
                              </p>
                            )}
                          </div>
                          
                          <EditPartOfPdfButton
                            type="content"
                            id={plan.id}
                            toneInit={
                              !activeContent?.tone
                                ? selectedTone
                                : toneToKey(activeContent.tone) || selectedTone
                            }
                            lengthInit={!activeContent?.length ? selectedLength : lengthToKey(activeContent.length) ?? selectedLength}
                            personalityInit={
                              !activeContent?.personality
                                ? selectedPersonality
                                : personalityToKey(activeContent.personality) ||
                                  selectedPersonality
                            }
                            gptModelInit={gptModel}
                            langInit={!activeContent?.lang ? selectedLanguage : activeContent.lang}
                            lengthValueInit={selectedLengthValue}
                            toneValueInit={selectedToneValue}
                            personalityValueInit={selectedPersonalityValue}
                            valueInit={activeContent?.planContent || ""}
                            plan={createdPlans}
                            subject={subject}
                            pdfId={pdfId}
                            planLevel={plan.planLevel}
                            idRef={plan.idRef}
                            onRefresh={handleRefresh}
                          />
                        </div>
                      )}
                    </div>
                    <Separator />
                  </>
                );
              })}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfCreator;
