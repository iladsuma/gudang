
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
  const [inputValue, setInputValue] = React.useState("")

  const currentOption = options.find((option) => option.value === value || option.label === value)
  const displayLabel = currentOption ? currentOption.label : value;

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
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
                 {inputValue && (
                    <CommandItem
                        value={inputValue}
                        onSelect={() => {
                            onChange(inputValue)
                            setOpen(false)
                            setInputValue("")
                        }}
                    >
                       <PlusCircle className="mr-2 h-4 w-4" />
                       <span>{notFoundMessage} <span className="font-medium">{`"${inputValue}"`}</span></span>
                    </CommandItem>
                )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={(currentValue) => {
                    // currentValue is the label of the selected item
                    const selectedOption = options.find(o => o.label.toLowerCase() === currentValue.toLowerCase());
                    if (selectedOption) {
                      onChange(selectedOption.value)
                    }
                    setOpen(false)
                    setInputValue("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      (value === option.value || value === option.label) ? "opacity-100" : "opacity-0"
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
