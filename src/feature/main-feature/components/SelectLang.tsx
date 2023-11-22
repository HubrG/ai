"use client";
import React, { useEffect, useState } from "react";
import { languageList } from "@/src/list/ai/languagesList";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import cn from "classnames"; // If you use 'classnames' library
import { Button } from "@/components/ui/button";

type LanguageCode = keyof typeof languageList;

interface SelectLangProps {
  onLanguageChange: any;
  selectedLangInit: LanguageCode | "";
  id?: string;
}
export const SelectLang = ({
  onLanguageChange,
  id,
  selectedLangInit,
}: SelectLangProps) => {
  const [openPopoverLang, setOpenPopoverLang] = React.useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | "">(
    selectedLangInit
  );

  const sortedLanguages = Object.entries(languageList).sort((a, b) => {
    return a[1].name.localeCompare(b[1].name);
  }) as [LanguageCode, { name: string; flag: string }][];

  useEffect(() => {
    setSelectedLanguage(selectedLangInit);
  }, [selectedLangInit]);

  return (
    <Popover open={openPopoverLang} onOpenChange={setOpenPopoverLang}>
      <PopoverTrigger id={id} asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openPopoverLang}
          className="w-full justify-between items-center gap-x-5 flex flex-row">
          <span className="w-full flex flex-row gap-2 items-center">
            <span>
              {selectedLanguage
                ? languageList[selectedLanguage]?.flag
                : ""}
            </span>
            <span>
              {selectedLanguage
                ? languageList[selectedLanguage]?.name
                : "Select language..."}
            </span>
          </span>
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 max-h-[50vh] overflow-y-auto">
        <Command>
          <CommandInput placeholder="Search language..." className="h-8 my-2" />
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup>
            {sortedLanguages.map(([code, { name, flag }]) => (
              <CommandItem
                key={code}
                value={code}
                onSelect={() => {
                  const newLanguage = code === selectedLanguage ? "" : code;
                  setSelectedLanguage(newLanguage);
                  setOpenPopoverLang(false);
                  onLanguageChange(newLanguage); // Notifie le composant parent
                }}>
                {flag} {name}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    selectedLanguage === code ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
