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
}
export const SelectModelGPT = ({
  onGPTModelChange,
  selectedModelGPTInit,
  id,
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
    <Select onValueChange={handleSelectChange} value={selectedModelGPT}>
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
                <>&nbsp;&nbsp;<Badge className="mr-5 bg-secondary-500 content-end self-end text-secondary-100 hover:bg-secondary-500">Best and more fast !</Badge></>
              )}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};