"use client";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gptModelList } from "@/src/list/ai/gptModelList";
interface SelectModelGPTProps {
  onGPTModelChange: any;
  selectedModelGPTInit: string;
  id?: string;
  disabled?: boolean;
}
export const SelectModelGPT = ({
  onGPTModelChange,
  selectedModelGPTInit,
  id,
  disabled,
}: SelectModelGPTProps) => {
  const [selectedModelGPT, setSelectedModelGPT] =
    useState<string>(selectedModelGPTInit);

  useEffect(() => {
    setSelectedModelGPT(selectedModelGPTInit);
  }, [selectedModelGPTInit]);

  const ModelGPTs = gptModelList;

  const handleSelectChange = (ModelGPTKey: string) => {
    onGPTModelChange(ModelGPTKey);
  };

  return (
    <Select onValueChange={handleSelectChange} value={selectedModelGPT} disabled={disabled}>
      <SelectTrigger  className="w-full" id={id}>
        <SelectValue placeholder="Select a ModelGPT" />
      </SelectTrigger>
      <SelectContent className="w-full">
        <SelectGroup className="w-full">
          <SelectLabel>GPT models</SelectLabel>
          {Object.keys(ModelGPTs).map((gpt) => (
            <SelectItem key={gpt} value={gpt} className="w-full">
              {ModelGPTs[gpt as keyof typeof ModelGPTs]}
              {ModelGPTs[gpt as keyof typeof ModelGPTs] === "GPT 4" && (
                <>&nbsp;&nbsp;<Badge className="mr-5 bg-secondary content-end self-end text-secondary hover:bg-secondary">Best and more fast !</Badge></>
              )}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
