"use client";
import React, { useEffect, useState } from "react";
import { faWandMagicSparkles } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@/components/ui/button";
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
  onRefresh
}: EditPartOfPdfButtonProps) => {
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
    aggregatedPlan += "\n"
  });



  const update = async () => {
    console.log(lengthValueInit, selectedLengthValue)
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
          idRef: idRef ? idRef : ""
        }),
      });
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
        onRefresh();
      // router.refresh();
      return await response.json();
    } catch (error) {
      console.error("Error calling other API:", error);
      return null;
    }
  };

  return (
    <div className="absolute right-full top-0 rounded-lg cursor-pointer dark:text-app-400 text-app-400 hover:text-app-500  dark:hover:text-app-300 px-3 pt-0.5">
      <Popover>
        <PopoverTrigger asChild>
          <FontAwesomeIcon icon={faWandMagicSparkles} />
        </PopoverTrigger>
        <PopoverContent className="w-80 flex flex-col gap-2">
          <p className="font-bold text-base">
          Rewrite  {type === "plan" ? "this point of the plan" : "this content"}
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
          <Button onClick={update}>Rewrite</Button>
        </PopoverContent>
      </Popover>
    </div>
  );
};
