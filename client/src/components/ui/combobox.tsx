"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface ComboboxItem {
  value: string
  label: string
}

interface MultiComboboxProps {
  placeholder: string
  emptyText: string
  items: ComboboxItem[]
  selected: string[]
  onChange: (values: string[]) => void
  searchPlaceholder?: string
  className?: string
}

export function MultiCombobox({
  placeholder,
  emptyText,
  items,
  selected,
  onChange,
  searchPlaceholder = "Search...",
  className
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const toggleItem = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    )
  }

  const removeItem = (value: string) => {
    onChange(selected.filter((item) => item !== value))
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between", className)}
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  onSelect={() => toggleItem(item.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(item.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((value) => {
            const item = items.find((i) => i.value === value)
            if (!item) return null
            return (
              <Badge
                key={value}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {item.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeItem(value)}
                />
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
