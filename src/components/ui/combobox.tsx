
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
    notFoundMessage = "Produk baru:"
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("");

  // When the popover opens, reset the search input value
  React.useEffect(() => {
    if (open) {
      setInputValue("");
    }
  }, [open]);

  // Find the label for the current value to display on the button
  const currentLabel = options.find((option) => option.value === value)?.label;
  
  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
  }

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
            {currentLabel || value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
                 {inputValue.length > 0 && (
                    <CommandItem
                        key="new-product-item" // Use a static key for the new item
                        value={inputValue}
                        onSelect={() => handleSelect(inputValue)}
                        className="flex items-center gap-2"
                    >
                       <PlusCircle className="h-4 w-4" />
                       <span>{notFoundMessage} <span className="font-medium">{inputValue}</span></span>
                    </CommandItem>
                )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value} // Use the stable and unique product ID as the key
                  value={option.label} // Match against the label for searching
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
