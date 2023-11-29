"use client";
import React, { useEffect, useState } from "react";
import { faCirclePlus, faSparkles } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@/components/ui/button";
import { isAuthorized } from "@/src/function/ai/ai-pdf-creator/isAuthorized";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SelectTone } from "../../components/SelectTone";
import { languageList } from "@/src/list/ai/languagesList";
import { SelectLang } from "../../components/SelectLang";
import { SelectModelGPT } from "../../components/SelectGPTModel";
import { SelectPersonality } from "../../components/SelectPersonality";
import { SelectLength } from "../../components/SelectLength";
import { Tooltip } from "react-tooltip";
import { PopoverClose } from "@radix-ui/react-popover";
import { User, tokenRequired } from "@prisma/client";
import { Toastify } from "@/src/toastify/Toastify";
import { Textarea } from "@/components/ui/textarea";

type EditPartOfPdfButtonProps = {
  type: "plan" | "content";
  toneInit: string;
  lengthInit: string;
  personalityInit: string;
  langInit: string;
  gptModelInit: string;
  lengthValueInit: string;
  toneValueInit: string;
  personalityValueInit: string;
  id: string;
  valueInit: string;
  plan: any;
  subject: string;
  pdfId: string;
  planLevel?: string;
  idRef: string | undefined;
  onRefresh: any;
  maxTokens: number;
  createVoidContent?: boolean;
  loadingRefreshPart?: (loading: boolean, type: string, id: string) => void;
  tokenRequired: any;
  user: any
};

export const EditPartOfPdfButton = ({
  type,
  toneInit,
  lengthInit,
  personalityInit,
  langInit,
  gptModelInit,
  lengthValueInit,
  toneValueInit,
  personalityValueInit,
  id,
  valueInit,
  plan,
  subject,
  pdfId,
  planLevel,
  idRef,
  onRefresh,
  maxTokens,
  createVoidContent,
  loadingRefreshPart,
  tokenRequired,
  user
}: EditPartOfPdfButtonProps) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [gptModel, setGptModel] = useState<string>(gptModelInit);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | "">(
    langInit as LanguageCode
  );
  const [selectedTone, setSelectedTone] = useState(toneInit);
  const [selectedPersonality, setSelectedPersonality] =
    useState(personalityInit);
  const [selectedLength, setSelectedLength] = useState(lengthInit);
  const [selectedToneValue, setSelectedToneValue] = useState(toneValueInit);
  const [selectedPersonalityValue, setSelectedPersonalityValue] =
    useState(personalityValueInit);
  const [selectedLengthValue, setSelectedLengthValue] =
    useState(lengthValueInit);
  const [loadingRefreshState, setLoadingRefresh] = useState(false);
  type LanguageCode = keyof typeof languageList;

  const handleLanguageChange = async (language: LanguageCode) => {
    setSelectedLanguage(language);
  };

  const handleToneChange = (toneKey: string, toneValue: string) => {
    setSelectedTone(toneKey);
    setSelectedToneValue(toneValue);
    console.log(toneKey, toneValue);
  };

  const handlePersonalityChange = (
    personalityKey: string,
    personalityValue: string
  ) => {
    setSelectedPersonality(personalityKey);
    setSelectedPersonalityValue(personalityValue);
    console.log(personalityKey, personalityValue);
  };

  const handleLengthChange = (lengthKey: string, lengthValue: string) => {
    setSelectedLength(lengthKey);
    setSelectedLengthValue(lengthValue);
    console.log(lengthKey, lengthValue);
  };

  const handleGptModelChange = (modelValue: string) => {
    setGptModel(modelValue);
    console.log(modelValue);
  };
  // On créé une string du titre du plan (map)
  let aggregatedPlan = "";
  //  On reçoit le plan en props et on le map pour récupérer planLevel et planTitle
  plan.forEach((plan: any) => {
    // On récupère le planLevel et on le map pour récupérer planTitle
    aggregatedPlan += "-- " + plan.planLevel + " ";
    aggregatedPlan += plan.planTitle;
    aggregatedPlan += "\n";
  });

  const update = async () => {
    const authorize = isAuthorized(tokenRequired, user, "pdf-refresh-" + type);
    if (!authorize) {
      return Toastify({
        value: "You don't have enough credits to regenerate this " + type,
        type: "error",
      });
    }
    loadingRefreshPart?.(true, type, id);
    try {
      const response = await fetch("/api/pdfcreator/updateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: type,
          id: id,
          value: valueInit,
          lang: selectedLanguage,
          gptModel: gptModel,
          toneValue: selectedToneValue,
          personalityValue: selectedPersonalityValue,
          plan: aggregatedPlan,
          subject: subject,
          length: selectedLengthValue,
          pdfId: pdfId,
          planLevel: planLevel ? planLevel : "",
          idRef: idRef ? idRef : "",
          maxTokens: maxTokens,
        }),
      });
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
      onRefresh();
      loadingRefreshPart?.(false, type, id);
      // router.refresh();
      return await response.json();
    } catch (error) {
      loadingRefreshPart?.(false, type, id);
      console.error("Error calling other API:", error);
      return null;
    }
  };

  useEffect(() => {
    setSelectedLanguage(langInit as LanguageCode);
    setSelectedTone(toneInit);
    setSelectedPersonality(personalityInit);
    setSelectedLength(lengthInit);
    setSelectedToneValue(toneValueInit);
    setSelectedPersonalityValue(personalityValueInit);
    setSelectedLengthValue(lengthValueInit);
    setGptModel(gptModelInit);
  }, [
    langInit,
    toneInit,
    personalityInit,
    lengthInit,
    toneValueInit,
    personalityValueInit,
    lengthValueInit,
    gptModelInit,
  ]);

  return (
    <div
      className={`${
        !createVoidContent && "absolute right-full top-1"
      } rounded-lg cursor-pointer  px-3 pt-0.5`}>
      <Popover>
        <PopoverTrigger asChild>
          {createVoidContent ? (
            <Button
              variant={"ghost"}
              className="w-full flex flex-row justify-center gap-2 items-center text-primary-foreground/60"
              size={"sm"}>
              <FontAwesomeIcon icon={faCirclePlus} /> Create content for this
              point
            </Button>
          ) : (
            <Button
              variant={"ghost"}
              size={"sm"}
              className="-mt-2"
              data-tooltip-id={`sparkleTooltip${type}${id}`}
              onMouseEnter={() => setIsTooltipOpen(true)}
              onMouseLeave={() => setIsTooltipOpen(false)}>
              <FontAwesomeIcon icon={faSparkles} />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-80 flex flex-col gap-2  bg-background shadow-2xl border-0 shadow-secondary/20 dark:shadow-primary">
          <p className="font-bold text-base text-accent-foreground/80">
            {createVoidContent ? "Generate " : "Regenerate "}
            {type === "plan" ? "this point of the plan" : "this content"}
          </p>
          <SelectLang
            id="language"
            onLanguageChange={handleLanguageChange}
            selectedLangInit={selectedLanguage}
          />
          <SelectTone
            id="tone"
            onToneChange={handleToneChange}
            selectedToneInit={selectedTone}
          />
          <SelectPersonality
            id="personality"
            onPersonalityChange={handlePersonalityChange}
            selectedPersonalityInit={selectedPersonality}
          />
          <SelectModelGPT
            id="gptModel"
            onGPTModelChange={handleGptModelChange}
            selectedModelGPTInit={gptModel}
          />
          {type === "content" && (
            <SelectLength
              id="length"
              onLengthChange={handleLengthChange}
              selectedLengthInit={selectedLength}
            />
          )}

          <Button
            onClick={() => {
              update();
              document.getElementById(`closePopover${type}${id}`)?.click();
            }}
            variant={"default"}>
            {createVoidContent ? "Generate content for this point" : "Rewrite"}
          </Button>
          {/* NOTE : REWRITE */}
        </PopoverContent>
        <PopoverClose>
          <span id={`closePopover${type}${id}`}></span>
        </PopoverClose>
      </Popover>
      <Tooltip
        id={`sparkleTooltip${type}${id}`}
        classNameArrow="hidden"
        variant="dark"
        opacity={1}
        isOpen={isTooltipOpen}
        className="tooltip flex flex-col">
        <span className="font-bold">Regenerate this content</span>
        You can regenerate this content with a different tone, personality or
        length.
      </Tooltip>
    </div>
  );
};
