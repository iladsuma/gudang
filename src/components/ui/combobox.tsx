
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
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "");

  React.useEffect(() => {
    const selectedOption = options.find(option => option.value === value);
    setInputValue(selectedOption ? selectedOption.label : value || '');
  }, [value, options]);

  const handleSelect = (currentValue: string) => {
    const option = options.find(o => o.value.toLowerCase() === currentValue.toLowerCase() || o.label.toLowerCase() === currentValue.toLowerCase());
    const finalValue = option ? option.value : currentValue;
    onChange(finalValue);
    setInputValue(option ? option.label : finalValue);
    setOpen(false);
  };
  
  const handleInputChange = (search: string) => {
    setInputValue(search);
  }

  const handleBlur = () => {
    // Only update form if the input value does not match any existing option's label
    const matchingOption = options.find(option => option.label.toLowerCase() === inputValue.toLowerCase());
    if (!matchingOption) {
      onChange(inputValue);
    }
  }
  
  const displayLabel = React.useMemo(() => {
    const selectedOption = options.find(option => option.value === value);
    return selectedOption ? selectedOption.label : value;
  }, [value, options]);

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
            {displayLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0"
          onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={handleInputChange}
            onBlur={handleBlur}
          />
          <CommandList>
            <CommandEmpty>
                 {inputValue && (
                    <CommandItem
                        value={inputValue}
                        onSelect={() => handleSelect(inputValue)}
                    >
                       <PlusCircle className="mr-2 h-4 w-4" />
                       <span>{notFoundMessage} <span className="font-medium">{`"${inputValue}"`}</span></span>
                    </CommandItem>
                )}
            </CommandEmpty>
            <CommandGroup>
              {options.filter(option => option.label.toLowerCase().includes(inputValue.toLowerCase())).map((option) => (
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
