"use client";
import React, { useState } from "react";
import { languageList } from "@/src/list/ai/languagesList";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import cn from "classnames";

type LanguageCode = keyof typeof languageList;

interface SelectLangProps {
  onLanguageChange: (language: LanguageCode) => void;
  selectedLangInit: LanguageCode | "";
  id?: string;
}

export const SelectLang = ({ onLanguageChange, selectedLangInit, id }: SelectLangProps) => {
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | "">(selectedLangInit);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLanguageSelect = (code: LanguageCode) => {
    setSelectedLanguage(code);
    setOpen(false);
    onLanguageChange(code);
  };

  const filteredLanguages = Object.entries(languageList).filter(([code, { name }]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between items-center gap-x-5 flex flex-row"
        >
          <span className="w-full flex flex-row gap-2 items-center">
            <span>
              {selectedLanguage ? languageList[selectedLanguage].flag : ""}
            </span>
            <span>
              {selectedLanguage ? languageList[selectedLanguage].name : "Select language..."}
            </span>
          </span>
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 max-h-[50vh] overflow-y-auto">
        <Command>
          <CommandInput
            placeholder="Search language..."
            className="h-8 my-2"
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup>
            {filteredLanguages.map(([code, { name, flag }]) => (
              <CommandItem
                key={code}
                value={name}
                onSelect={() => handleLanguageSelect(code as LanguageCode)}
              >
                {flag} {name}
                <CheckIcon
                  className={cn("ml-auto h-4 w-4", selectedLanguage === code ? "opacity-100" : "opacity-0")}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
