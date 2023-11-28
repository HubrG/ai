"use client";
import React, { useMemo, useEffect, useCallback, useState } from "react";
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
  deletePlan,
  getTokenRequired,
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
  faCompassDrafting,
  faLanguage,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faCoinBlank,
  faCoinVertical,
  faCoins,
  faCompass,
  faFaceGlasses,
  faFiles,
  faICursor,
  faInfoCircle,
  faMusic,
  faPodiumStar,
  faRobot,
  faRuler,
  faSignature,
} from "@fortawesome/pro-duotone-svg-icons";
import { EditPartOfPdfButton } from "./components/EditPartOfPdfButton";
import { SelectModelGPT } from "../components/SelectGPTModel";
import { personalityToKey } from "@/src/list/ai/personalitiesList";
import { toneToKey } from "@/src/list/ai/tonesList";
import { Separator } from "@/components/ui/separator";
import { lengthToKey } from "@/src/list/ai/lengthList";
import { Counting } from "@/src/function/countWords";
import {
  TokensOnPdf,
  TokensSpentByProject,
} from "@/src/function/tokensSpentByProject";
import { Tooltip } from "react-tooltip";
import { GenerateButton } from "./components/GenerateButton";
import { tokenRequired } from "@prisma/client";
import { Toastify } from "@/src/toastify/Toastify";
import { isAuthorized } from "@/src/function/ai/ai-pdf-creator/isAuthorized";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PopoverClose } from "@radix-ui/react-popover";
// TODO --> pouvoir modifier un titre / content en tapant dans une input
// TODO --> Ajouter des options (sur le contenu) : racourcir / rallonger
// FIX --> Problème « génération all content » une fois le plan généré
// TYPES
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
  activeVersion?: Plan | any;
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
  content?: string;
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

const PdfCreator = ({ params }: PdfCreatorProps) => {
  // SECTION --> States
  const maxTokens = 100;
  const counter = new Counting();
  const pdfId = params.id;
  const router = useRouter();
  const [init, setInit] = useState<boolean>(true);
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
  const [regenerate, setRegenerate] = useState<boolean>(false);
  const [whatInProgress, setWhatInProgress] = useState<string>("");
  const [createdPlans, setCreatedPlans] = useState<Plan[]>([]);
  const [gptModel, setGptModel] = useState<string>("gpt-3.5-turbo");
  const [plansWithAllVersions, setPlansWithAllVersions] =
    useState<PlansWithAllVersions>({});
  const [contentsWithAllVersions, setContentsWithAllVersions] =
    useState<ContentsWithAllVersionsState>({});
  const [generatePlanButton, setGeneratePlanButton] = useState<boolean>(false);
  //
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | "">(
    "en"
  );
  const [tokenSpentForThisProject, setTokenSpentForThisProject] =
    useState<TokensOnPdf>();
  const [selectedTone, setSelectedTone] = useState("energetic");
  const [selectedPersonality, setSelectedPersonality] = useState("deep");
  const [selectedLength, setSelectedLength] = useState("medium");
  const [selectedToneValue, setSelectedToneValue] = useState(
    "Energetic and enthusiastic"
  );
  const [selectedPersonalityValue, setSelectedPersonalityValue] =
    useState("Deep Thinker");
  const [selectedLengthValue, setSelectedLengthValue] = useState("Medium");
  const [tokenRequired, setTokenRequired] = useState<tokenRequired[]>();
  //

  // SECTION --> Functions
  const converter = useMemo(() => {
    return new Showdown.Converter();
  }, []);
  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };
  const setGeneratePlanButtonState = (newState: boolean) => {
    // Vérifier si l'utilisateur a assez de jetons pour générer un plan
    const authorize = isAuthorized(tokenRequired, user, "pdf-content");
    if (!authorize) {
      return Toastify({
        value: "You don't have enough credits to generate all content",
        type: "error",
      });
    }
    setGeneratePlanButton(newState);
  };

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

  const spentTokenForThisProject = useCallback(
    async (id: string) => {
      if (pdfId) {
        const spentByProject = new TokensSpentByProject();
        const totalToken = await spentByProject.getTotalTokensForPdf(id);
        setTokenSpentForThisProject(totalToken);
      }
    },
    [pdfId]
  );

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

  const markdownToHtml = useCallback(
    (markdown: string) => {
      return converter.makeHtml(markdown);
    },
    [converter]
  );

  const handleCancel = () => {
    abortControllers.forEach((controller) => controller.abort()); // Annuler tous les processus en cours
    setAbortControllers([]); // Réinitialiser les contrôleurs
    //
    setLoading(false);
    setRegenerate(true);
    setWhatInProgress("");
    router.refresh();
  };

  const regeneratePlan = async () => {
    handleCancel();
    await deletePlan(pdfId);
    setCreatedPlans([]);
    setChapterContent({});
    setAllContent("");
    setRegenerate(false);
    setContentsWithAllVersions({});
    setPlansWithAllVersions({});
    generatePlan();
  };

  const handleTryAgain = () => {
    handleCancel();
  };

  const aggregatedContent = (
    Object.keys(plansWithAllVersions).length === 0
      ? createdPlans
      : Object.values(plansWithAllVersions)
  ).reduce((accumulator, planOrVersion) => {
    let activePlan;

    // Si plansWithAllVersions est utilisé, prenez la version active du plan
    if (planOrVersion.hasOwnProperty("activeVersion")) {
      activePlan = planOrVersion.activeVersion;
    } else {
      // Sinon, utilisez le plan tel quel
      activePlan = planOrVersion;
    }

    if (!activePlan) return accumulator;

    const planTitleHtml = markdownToHtml(
      activePlan.planLevel + " " + activePlan.planTitle
    );

    // Récupérer la version active du contenu
    const activeContent =
      contentsWithAllVersions[activePlan.id]?.activeVersion?.planContent || "";
    const chapterHtml = markdownToHtml(activeContent);

    return accumulator + planTitleHtml + chapterHtml;
  }, "");
  const handleLanguageChange = async (language: LanguageCode) => {
    setSelectedLanguage(language);
  };

  const handleToneChange = (toneKey: string, toneValue: string) => {
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
  };
  // IMPORTANT --> FetchPDF
  const fetchPdf = useCallback(async () => {
    try {
      const pdfCreatorObject = await getPdfPlanAndContent(params.id);
      const tokenReq = await getTokenRequired();
      if (tokenReq) {
        setTokenRequired(tokenReq.map((token) => token));
      }

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
        setInit(false);

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

  const handleRefresh = useCallback(() => {
    fetchPdf();
    updateContextTokenRemaining();
  }, [fetchPdf, updateContextTokenRemaining]);

  // IMPORTANT --> Plan generate
  const generatePlan = async () => {
    // Vérifier si l'utilisateur a assez de jetons pour générer un plan
    const authorize = isAuthorized(tokenRequired, user, "pdf-plan");
    if (!authorize) {
      return Toastify({
        value: "You don't have enough credits to generate a plan",
        type: "error",
      });
    }
    // Si oui, on génère le plan
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
          pdfId: pdfId,
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
        setWhatInProgress("");
        // Vérifier si l'utilisateur a assez de jetons pour générer un plan
        const authorize = isAuthorized(tokenRequired, user, "pdf-content");
        if (!authorize) {
          return Toastify({
            value: "You don't have enough credits to generate a content",
            type: "error",
          });
        }
        setGeneratePlanDone(true);
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
  // IMPORTANT --> Content generate
  const generateContent = useCallback(
    async (title: string, pdfId: string) => {
      const authorize = isAuthorized(tokenRequired, user, "pdf-content");
      if (!authorize) {
        return Toastify({
          value: "You don't have enough credits to generate all content",
          type: "error",
        });
      }
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
      user,
      tokenRequired,
    ]
  );
  // SECTION --> useEffects
  useEffect(() => {
    if (params.id) {
      fetchPdf();
    }
  }, [params.id, fetchPdf]);

  useEffect(() => {
    if (!init) {
      document.getElementById("subject")?.focus();
    }
  }, [init]);

  useEffect(() => {
    const content = aggregatedContent;
    setAllContent(content);
  }, [
    plansWithAllVersions,
    contentsWithAllVersions,
    markdownToHtml,
    allContent,
    aggregatedContent,
    createdPlans,
    chapterContent,
  ]);
  // IMPORTANT --> Content generation trigger
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
            updateContextTokenRemaining();
            setContentsWithAllVersions((prev) => ({
              ...prev,
              [plan.id]: contentsWithAllVersions,
            }));
          }
        })
      );

      Promise.all(apiCalls)
        .then(() => {
          handleRefresh;
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
    } else {
      router.refresh();
    }
  }, [
    generatePlanDone,
    createdPlans,
    generateContent,
    activateAutomaticContent,
    generatePlanButton,
    router,
    handleRefresh,
    updateContextTokenRemaining,
  ]);

  useEffect(() => {
    spentTokenForThisProject(pdfId);
  }, [
    allContent,
    pdfId,
    spentTokenForThisProject,
    createdPlans,
    chapterContent,
    plansWithAllVersions,
    contentsWithAllVersions,
  ]);

  const [loadingRefreshPart, setLoadingRefreshPart] = useState<{
    loading: boolean;
    type: string;
    id: string;
  }>({
    loading: false,
    type: "",
    id: "",
  });

  const handleLoadingRefreshPart = (
    loading: boolean,
    type: string,
    id: string
  ) => {
    setLoadingRefreshPart({ loading, type, id });
  };
  // SECTION --> Return
  return (
    <>
      <div className="flex md:flex-row items-start flex-col w-full gap-5 -mt-7">
        {!init ? (
          <>
            {/* ELEMENT --> Side */}
            {Object.keys(chapterContent).length > 0 && !loading && (
              <Tooltip
                id="PDFForbidden"
                className="tooltip"
                noArrow={true}
                place="top"
                opacity={1}>
                Your PDF has already been generated. If you wish to regenerate
                it please create a new project.
              </Tooltip>
            )}
            <div
              data-tooltip-id="PDFForbidden"
              className={`md:w-3/12 sticky md:top-24  top-32  border  w-full h-auto mt-5 py-5 p-3 rounded-lg z-0`}>
              <div
                className={`flex flex-col  items-center gap-5 flex-wrap h-auto ${
                  Object.keys(chapterContent).length > 0 && whatInProgress == ""
                    ? "opacity-70 pointer-events-none"
                    : ""
                }`}>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label
                    htmlFor="subject"
                    className="flex flex-row justify-between items-center">
                    Subject of your PDF
                  </Label>
                  <Input
                    className={`h-12 text-base font-semibold ${
                      !loading &&
                      createdPlans.length > 0 &&
                      "disabled:opacity-70"
                    }`}
                    id="subject"
                    disabled={loading || createdPlans.length > 0 ? true : false}
                    placeholder="Your subject, any..."
                    value={subject}
                    onChange={(e) => setSubject(e.currentTarget.value)}
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="language">
                    <span>Language</span>
                    <FontAwesomeIcon
                      icon={faLanguage}
                      className="font-ligth"
                    />{" "}
                  </Label>
                  <SelectLang
                    id="language"
                    onLanguageChange={handleLanguageChange}
                    selectedLangInit={selectedLanguage}
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label
                    htmlFor="personality"
                    className="flex flex-row justify-between items-center px-1">
                    <span>The personality</span>
                    <FontAwesomeIcon
                      icon={faPodiumStar}
                      className="font-ligth"
                    />
                  </Label>
                  <SelectPersonality
                    id="personality"
                    onPersonalityChange={handlePersonalityChange}
                    selectedPersonalityInit={selectedPersonality}
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center justify-between w-full mb-2 space-x-2">
                  <Switch
                    disabled={loading || createdPlans.length > 0 ? true : false}
                    id="activeGenerateContent"
                    checked={activateAutomaticContent}
                    onCheckedChange={(checked) => {
                      setActivateAutomaticContent(checked);
                      setGeneratePlanDone(true);
                    }}
                  />
                  <div className="flex flex-row items-center w-full">
                    <Label htmlFor="activeGenerateContent">
                      <p className="text-left text-sm">
                        Generate content automatically
                      </p>
                    </Label>
                    <div className="">
                      <FontAwesomeIcon
                        icon={faInfoCircle}
                        className="font-ligth"
                        data-tooltip-id="infoAutomaticContentGenerateTooltip"
                      />
                      <Tooltip
                        place="top-end"
                        classNameArrow="hidden"
                        id="infoAutomaticContentGenerateTooltip"
                        className="tooltip"
                        opacity={1}>
                        Once the plan has been generated, the content of each
                        point will be generated automatically. Deactivate this
                        option if you wish to validate the plan before
                        generating the content.
                      </Tooltip>
                    </div>
                  </div>
                </div>
                <div className="flex w-full flex-row gap-x-2">
                  {/* ELEMENT --> Generate Button */}
                  <GenerateButton
                    whatInProgress={whatInProgress}
                    createdPlans={createdPlans.length}
                    chapterContent={Object.keys(chapterContent).length}
                    setGeneratePlanButtonState={setGeneratePlanButtonState}
                    handleCancel={handleCancel}
                    regeneratePlan={regeneratePlan}
                    generatePlan={generatePlan}
                    loading={loading}
                    disabled={subject ? false : true}
                    // tokenRemaining={user?.tokenRemaining ?? 0}
                  />
                </div>
              </div>
            </div>
            {/* ELEMENT --> Text window */}
            <div className="md:w-9/12 w-full bg-background z-30">
              <div className="rounded-xl   transition grid grid-cols-1 gap-x-2 items-start mb-10">
                <div className="rounded-t-xl pb-5 mb-2 md:shadow-none sticky bg-background top-[4.8rem] pt-5 flex flex-row justify-between gap-x-2  items-center border-b-2 z-50 ">
                  <div className="flex flex-row gap-2 justify-between w-full">
                    <div className="flex flex-row gap-2">
                      <DownloadButton
                        allContent={allContent}
                        subject={subject}
                        disabled={createdPlans.length === 0}
                      />
                      <Popover>
                        <PopoverTrigger                         
                          asChild>
                            <div data-tooltip-id="navigateTooltip">
                          <Button
                            disabled={createdPlans.length === 0}
                            variant="outline">
                            <FontAwesomeIcon icon={faCompass} />
                          </Button>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className={`w-80 ${createdPlans.length === 0 && "hidden"}`}>
                          <ScrollArea className="h-96 w-full flex flex-col gap-3">
                            <div className="flex flex-col gap-2">
                              {createdPlans.map((plan) => (
                                <>
                                  <a
                                    className="pdf-navigation"
                                    onClick={() => {
                                      scrollToElement(plan.id);
                                      document
                                        .getElementById(`closePopoverSummary`)
                                        ?.click();
                                    }}>
                                    <strong>{plan.planLevel}</strong>
                                    <br />
                                    {plan.planTitle}
                                  </a>
                                </>
                              ))}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                        <PopoverClose>
                          <span id={`closePopoverSummary`}></span>
                        </PopoverClose>
                      </Popover>
                      <Tooltip
                        id="navigateTooltip"
                        className="tooltip"
                        opacity={1}
                        place="bottom">
                        <strong>Navigation</strong>
                        <span className="block">
                          Click on a title to navigate to the corresponding
                          section
                        </span>
                      </Tooltip>
                    </div>
                    <div className="p-2 text-sm py-2.5 bg-background select-none cursor-default rounded-lg flex flex-row gap-x-3">
                      <div data-tooltip-id="countWordTooltip">
                        <FontAwesomeIcon icon={faSignature} />
                        <span className="max-md:hidden">
                          &nbsp;
                          {counter.countWords(allContent)} w.
                        </span>
                        <Tooltip
                          opacity={1}
                          id="countWordTooltip"
                          className="tooltip "
                          place="bottom">
                          <strong>Words</strong>
                          <span className="md:hidden block">
                            &nbsp;
                            {counter.countWords(allContent)} w.
                          </span>
                        </Tooltip>
                      </div>
                      <div data-tooltip-id="readingTimeTooltip">
                        <FontAwesomeIcon icon={faFaceGlasses} />{" "}
                        <span className="max-md:hidden">
                          {counter.countReadingTime(allContent, "format")}
                        </span>
                        <Tooltip
                          opacity={1}
                          id="readingTimeTooltip"
                          className="tooltip "
                          place="bottom">
                          <strong>Reading time</strong>
                          <span className="md:hidden block">
                            {counter.countReadingTime(allContent, "format")}
                          </span>
                        </Tooltip>
                      </div>
                      <div data-tooltip-id="totalCharactersTooltip">
                        <FontAwesomeIcon icon={faICursor} />
                        <span className="max-md:hidden">
                          &nbsp;{counter.countCharacters(allContent)}
                        </span>
                        <Tooltip
                          opacity={1}
                          id="totalCharactersTooltip"
                          className="tooltip "
                          place="bottom">
                          <strong>Characters</strong>
                          <span className="md:hidden block">
                            &nbsp;{counter.countCharacters(allContent)}
                          </span>
                        </Tooltip>
                      </div>
                      <div data-tooltip-id="totalPagesTooltip">
                        <FontAwesomeIcon icon={faFiles} />
                        <span className="max-md:hidden">
                          &nbsp;
                          {counter.countPages(allContent) > 1
                            ? counter.countPages(allContent) + " pages"
                            : counter.countPages(allContent) + " page"}
                        </span>
                        <Tooltip
                          opacity={1}
                          id="totalPagesTooltip"
                          className="tooltip"
                          place="bottom">
                          <strong>Pages (approximately)</strong>
                          <span className="block md:hidden">
                            &nbsp;
                            {counter.countPages(allContent) > 1
                              ? counter.countPages(allContent) + " pages"
                              : counter.countPages(allContent) + " page"}
                          </span>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="p-2   self-end  rounded-lg flex md:flex-row gap-2">
                      <div>
                        <FontAwesomeIcon
                          icon={faCoins}
                          data-tooltip-id="totalTokenSpentToolTip"
                        />
                        <Tooltip
                          id="totalTokenSpentToolTip"
                          variant="dark"
                          className="tooltip "
                          place="bottom"
                          opacity={1}>
                          <strong>
                            {tokenSpentForThisProject
                              ? tokenSpentForThisProject.totalToken
                              : 0}{" "}
                          </strong>
                          total credits spent
                        </Tooltip>
                      </div>
                      <div>
                        <FontAwesomeIcon
                          icon={faCoinBlank}
                          data-tooltip-id="totalTokenSpentInputTooltip"
                        />
                        <Tooltip
                          id="totalTokenSpentInputTooltip"
                          variant="dark"
                          className="tooltip "
                          place="bottom"
                          opacity={1}>
                          <strong>
                            {tokenSpentForThisProject
                              ? tokenSpentForThisProject.totalTokenInput
                              : 0}{" "}
                          </strong>
                          credits spent for content analyze
                        </Tooltip>
                      </div>
                      <div>
                        <FontAwesomeIcon
                          icon={faCoinVertical}
                          data-tooltip-id="totalTokenSpentOutputTooltip"
                        />
                        <Tooltip
                          id="totalTokenSpentOutputTooltip"
                          variant="dark"
                          className="tooltip "
                          place="bottom"
                          opacity={1}>
                          <strong>
                            {tokenSpentForThisProject
                              ? tokenSpentForThisProject.totalTokenOutput
                              : 0}
                          </strong>{" "}
                          credits spent for generation
                        </Tooltip>
                      </div>
                      <div>
                        {tokenSpentForThisProject
                          ? tokenSpentForThisProject.totalCost.toFixed(3)
                          : 0}
                        €
                      </div>
                    </div>
                  </div>
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
                            handleUpdatePlanTitle(
                              plan.id,
                              e.currentTarget.value
                            );
                          }}
                        />
                      </div>
                      <div>
                        {chapterContent[plan.id] && (
                          <Textarea
                            value={chapterContent[plan.id].content}
                            onChange={(e) =>
                              handleUpdateContent(
                                plan.id,
                                e.currentTarget.value
                              )
                            }
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="py-5 -mt-2 md:px-14 px-5 md:pr-20 rounded-b-xl ">
                  <article className="">
                    {createdPlans.length === 0 && (
                      <div className="text-center w-full border-2 md:p-5 p-2  my-5 rounded-lg border-dashed  ">
                        <p className="text-center ">
                          <span>Fill out the form and widen your eyes...</span>{" "}
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
                        contentsWithAllVersions[contentKey]?.allVersions
                          .length || 0;
                      const activeContentVersionIndex =
                        contentsWithAllVersions[
                          contentKey
                        ]?.allVersions.findIndex(
                          (content) => content.isSelected
                        ) || 0;

                      const activeContent =
                        contentsWithAllVersions[contentKey]?.activeVersion;
                      return (
                        <>
                          <div key={plan.id} id={plan.id} className="space-y-4">
                            <div className="relative">
                              <div
                                className={`text-left ${
                                  loadingRefreshPart.id === plan.id &&
                                  loadingRefreshPart.loading &&
                                  loadingRefreshPart.type === "plan" &&
                                  "opacity-80  blur-sm select-none"
                                }`}
                                dangerouslySetInnerHTML={{
                                  __html: markdownToHtml(
                                    plan.planLevel + " " + plan.planTitle
                                  ),
                                }}
                              />
                              <div
                                className={`
                                  absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2
                                  ${
                                    loadingRefreshPart.id === plan.id &&
                                    loadingRefreshPart.loading &&
                                    loadingRefreshPart.type === "plan"
                                      ? "block"
                                      : "hidden"
                                  }`}>
                                <Loader />
                              </div>
                              <div
                                className={`${
                                  loading && "hidden"
                                } pdfNavigationButton`}>
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
                              {!loading && (
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
                                  langInit={
                                    plan.lang ? plan.lang : selectedLanguage
                                  }
                                  lengthValueInit={selectedLengthValue}
                                  toneValueInit={selectedToneValue}
                                  personalityValueInit={
                                    selectedPersonalityValue
                                  }
                                  valueInit={plan.planTitle}
                                  plan={createdPlans}
                                  subject={subject}
                                  pdfId={pdfId}
                                  planLevel={plan.planLevel}
                                  idRef={plan.idRef}
                                  onRefresh={handleRefresh}
                                  maxTokens={maxTokens}
                                  createVoidContent={false}
                                  loadingRefreshPart={handleLoadingRefreshPart}
                                  tokenRequired={tokenRequired}
                                  user={user}
                                />
                              )}
                            </div>
                            {/* NOTE: Contenu en cours de génération, on affiche le loader */}
                            {whatInProgress === "content" &&
                              !chapterContent[plan.id] && (
                                <div className="flex flex-col items-center justify-center mb-5 opacity-50">
                                  <Loader />
                                </div>
                              )}
                            {/* NOTE : Si un contenu n'a pas été créé */}
                            {!chapterContent[plan.id] &&
                              !activeContent &&
                              !loading && (
                                <>
                                  <div className="relative">
                                    <div className="mb-5 h-auto relative">
                                      <div
                                        className={`
                                          absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2
                                          ${
                                            loadingRefreshPart.id === plan.id &&
                                            loadingRefreshPart.loading &&
                                            loadingRefreshPart.type ===
                                              "content"
                                              ? "block"
                                              : "hidden"
                                          }`}>
                                        <Loader />
                                      </div>
                                      <div
                                        className={` ${
                                          loadingRefreshPart.id === plan.id &&
                                          loadingRefreshPart.loading &&
                                          loadingRefreshPart.type === "content"
                                            ? "blur-sm select-none"
                                            : ""
                                        }`}>
                                        <EditPartOfPdfButton
                                          type="content"
                                          id={plan.id}
                                          toneInit={
                                            !plan.tone
                                              ? selectedTone
                                              : toneToKey(plan.tone) ||
                                                selectedTone
                                          }
                                          lengthInit={selectedLength}
                                          personalityInit={
                                            !plan.personality
                                              ? selectedPersonality
                                              : personalityToKey(
                                                  plan.personality
                                                ) || selectedPersonality
                                          }
                                          gptModelInit={gptModel}
                                          langInit={
                                            plan.lang
                                              ? plan.lang
                                              : selectedLanguage
                                          }
                                          lengthValueInit={selectedLengthValue}
                                          toneValueInit={selectedToneValue}
                                          personalityValueInit={
                                            selectedPersonalityValue
                                          }
                                          valueInit={plan.planTitle}
                                          plan={createdPlans}
                                          subject={subject}
                                          pdfId={pdfId}
                                          planLevel={plan.planLevel}
                                          idRef={plan.idRef}
                                          onRefresh={handleRefresh}
                                          maxTokens={maxTokens}
                                          createVoidContent={true}
                                          loadingRefreshPart={
                                            handleLoadingRefreshPart
                                          }
                                          tokenRequired={tokenRequired}
                                          user={user}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            {(chapterContent[plan.idRef as string] ||
                              chapterContent[plan.id as string]) && (
                              <div className="relative group">
                                {activeContent && (
                                  <div
                                    className={`text-left ${
                                      loadingRefreshPart.id === plan.id &&
                                      loadingRefreshPart.loading &&
                                      loadingRefreshPart.type === "content" &&
                                      "opacity-80  blur-sm select-none"
                                    }`}
                                    dangerouslySetInnerHTML={{
                                      __html: markdownToHtml(
                                        activeContent.planContent
                                      ),
                                    }}
                                  />
                                )}
                                <div
                                  className={`
                                  absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2
                                  ${
                                    loadingRefreshPart.id === plan.id &&
                                    loadingRefreshPart.loading &&
                                    loadingRefreshPart.type === "content"
                                      ? "block"
                                      : "hidden"
                                  }`}>
                                  <Loader />
                                </div>
                                {/* Boutons pour naviguer entre les versions du contenu */}
                                <div
                                  className={`${
                                    loading && "hidden"
                                  } pdfNavigationButton`}>
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
                                {/* NOTE : Modification d'un contneu existant */}
                                {!loading && (
                                  <EditPartOfPdfButton
                                    type="content"
                                    id={plan.id}
                                    toneInit={
                                      !activeContent?.tone
                                        ? selectedTone
                                        : toneToKey(activeContent.tone) ||
                                          selectedTone
                                    }
                                    lengthInit={
                                      !activeContent?.length
                                        ? selectedLength
                                        : lengthToKey(activeContent.length) ??
                                          selectedLength
                                    }
                                    personalityInit={
                                      !activeContent?.personality
                                        ? selectedPersonality
                                        : personalityToKey(
                                            activeContent.personality
                                          ) || selectedPersonality
                                    }
                                    gptModelInit={gptModel}
                                    langInit={
                                      !activeContent?.lang
                                        ? selectedLanguage
                                        : activeContent.lang
                                    }
                                    lengthValueInit={selectedLengthValue}
                                    toneValueInit={selectedToneValue}
                                    personalityValueInit={
                                      selectedPersonalityValue
                                    }
                                    valueInit={activeContent?.planContent || ""}
                                    plan={createdPlans}
                                    subject={subject}
                                    pdfId={pdfId}
                                    planLevel={plan.planLevel}
                                    idRef={plan.idRef}
                                    onRefresh={handleRefresh}
                                    maxTokens={maxTokens}
                                    loadingRefreshPart={
                                      handleLoadingRefreshPart
                                    }
                                    tokenRequired={tokenRequired}
                                    user={user}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                          <Separator className={`dark:bg-border mt-5 mb-0`} />
                        </>
                      );
                    })}
                  </article>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-[80vh] flex  flex-col justify-center items-center">
            <Loader />
            <p className="text-center">Project loading...</p>
          </div>
        )}
      </div>
    </>
  );
};
export default PdfCreator;
