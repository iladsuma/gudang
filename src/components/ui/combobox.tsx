
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
  
  // Find the full option object based on the current value.
  const selectedOption = options.find((option) => option.value === value || option.label === value);

  // The value shown in the input. If an option is selected, show its label. Otherwise show the raw value (for manual input).
  const displayValue = selectedOption ? selectedOption.label : value || "";

  // The value used for filtering inside the command list
  const [filterValue, setFilterValue] = React.useState('');

  React.useEffect(() => {
    // When the popover opens, sync the filter with the display value
    if (open) {
      setFilterValue(displayValue);
    }
  }, [open, displayValue]);

  const handleSelect = (selectedValue: string) => {
    const option = options.find(o => o.value === selectedValue || o.label === selectedValue);
    onChange(option ? option.value : selectedValue);
    setOpen(false);
  };
  
  const handleManualInput = () => {
    if (filterValue && !options.some(o => o.label === filterValue)) {
       onChange(filterValue);
    }
  };


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
            {displayValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0"
          onCloseAutoFocus={(e) => e.preventDefault()} // Prevents re-focusing trigger
          >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={filterValue}
            onValueChange={setFilterValue}
            onBlur={handleManualInput}
          />
          <CommandList>
            <CommandEmpty>
                 {filterValue && (
                    <CommandItem
                        value={filterValue}
                        onSelect={() => {
                            handleSelect(filterValue)
                        }}
                    >
                       <PlusCircle className="mr-2 h-4 w-4" />
                       <span>{notFoundMessage} <span className="font-medium">{`"${filterValue}"`}</span></span>
                    </CommandItem>
                )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Use label for filtering/searching in CMD-K
                  onSelect={() => {
                    handleSelect(option.value);
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
