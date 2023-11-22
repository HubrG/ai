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
import { tonesList } from "@/src/list/ai/tonesList";
interface SelectToneProps {
  onToneChange: any;
  selectedToneInit: string;
  id?:string
}
export const SelectTone = ({
  onToneChange,
  selectedToneInit,
  id
}: SelectToneProps) => {
  const [selectedTone, setSelectedTone] = useState<string>(selectedToneInit);

  useEffect(() => {
    setSelectedTone(selectedToneInit);
  }, [selectedToneInit]);

  type ToneKey = keyof typeof tones;

  const tones = tonesList;
  const handleSelectChange = (toneKey: string) => {
    const toneValue = tones[toneKey as ToneKey];
    onToneChange(toneKey, toneValue);
  };


  return (
    <Select onValueChange={handleSelectChange} value={selectedTone}>
      <SelectTrigger id={id}>
        <SelectValue  placeholder="Select a tone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Tones</SelectLabel>
          {Object.keys(tones).map((tone) => (
            <SelectItem key={tone} value={tone}>
              {tones[tone as ToneKey]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
