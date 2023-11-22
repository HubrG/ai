"use client";
import React, { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { personalitiesList } from "@/src/list/ai/personalitiesList";
interface SelectPersonalityProps {
  onPersonalityChange: any;
  selectedPersonalityInit: string;
  id: string;
}
export const SelectPersonality = ({
  onPersonalityChange,
  selectedPersonalityInit,
  id
}: SelectPersonalityProps) => {
  const [selectedPersonality, setSelectedPersonality] = useState<string>(selectedPersonalityInit);

  useEffect(() => {
    setSelectedPersonality(selectedPersonalityInit);
  }, [selectedPersonalityInit]);
  type PersonalityKey = keyof typeof personalities;

    const personalities = personalitiesList;
    
  const handleSelectChange = (PersonalityKey: string) => {
    const PersonalityValue = personalities[PersonalityKey as PersonalityKey];
    onPersonalityChange(PersonalityKey, PersonalityValue);
  };
  return (
    <Select onValueChange={handleSelectChange}  value={selectedPersonality}>
    <SelectTrigger id={id}>
        <SelectValue placeholder="Select a personality" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Personalities</SelectLabel>
          {Object.keys(personalities).map((personality) => (
            <SelectItem key={personality} value={personality}>
              {personalities[personality as PersonalityKey]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
