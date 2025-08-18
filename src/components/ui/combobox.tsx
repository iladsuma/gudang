
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    options: { label: string; value: string }[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    notFoundMessage?: string;
}

export function Combobox({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    notFoundMessage = "Tambah produk baru:"
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  // State to manage the input value for searching, separate from the form's value
  const [inputValue, setInputValue] = React.useState(value || '');

  // Effect to sync the internal input value with the external form value when it changes
  React.useEffect(() => {
    const selectedOption = options.find(option => option.value === value);
    setInputValue(selectedOption ? selectedOption.label : value || '');
  }, [value, options]);

  const handleSelect = (selectedValue: string) => {
    const option = options.find(o => o.value === selectedValue);
    onChange(option ? option.value : selectedValue);
    setInputValue(option ? option.label : selectedValue);
    setOpen(false);
  };
  
  // This function is for when the user manually types a value and leaves the input
  const handleBlur = () => {
    // Check if the current input text matches an existing option's label
    const matchingOption = options.find(option => option.label.toLowerCase() === inputValue.toLowerCase());
    if (matchingOption) {
      // If it matches, ensure the form value is the option's value (ID), not its label
      if (value !== matchingOption.value) {
        onChange(matchingOption.value);
      }
    } else {
      // If it doesn't match any option, treat it as a new manual entry
      onChange(inputValue);
    }
  };

  const displayLabel = React.useMemo(() => {
    const selectedOption = options.find(option => option.value === value);
    return selectedOption ? selectedOption.label : value || placeholder;
  }, [value, options, placeholder]);

  const filteredOptions = React.useMemo(() => 
    options.filter(option => option.label.toLowerCase().includes(inputValue.toLowerCase())),
    [options, inputValue]
  );
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {displayLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0"
          onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={handleBlur}
          />
          <CommandList>
            <CommandEmpty>
                 {inputValue && (
                    <CommandItem
                        value={inputValue}
                        onSelect={handleSelect}
                    >
                       <PlusCircle className="mr-2 h-4 w-4" />
                       <span>{notFoundMessage} <span className="font-medium">{`"${inputValue}"`}</span></span>
                    </CommandItem>
                )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
