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
import { lengthList } from "@/src/list/ai/lengthList";
interface SelectLengthProps {
  onLengthChange: any;
  selectedLengthInit: string;
  id: string;
}
export const SelectLength = ({
  onLengthChange,
  selectedLengthInit,
  id,
}: SelectLengthProps) => {
  const [selectedLength, setSelectedLength] =
    useState<string>(selectedLengthInit);

  useEffect(() => {
    setSelectedLength(selectedLengthInit);
  }, [selectedLengthInit]);
  type LengthKey = keyof typeof lengths;

  const lengths = lengthList;

  const handleSelectChange = (LengthKey: string) => {
    const LengthValue = lengths[LengthKey as LengthKey];
    onLengthChange(LengthKey, LengthValue);
  };
  return (
    <Select onValueChange={handleSelectChange}  value={selectedLength}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Select a length" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Lengths</SelectLabel>
          {Object.keys(lengths).map((length) => (
            <SelectItem key={length} value={length}>
              {lengths[length as LengthKey]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
