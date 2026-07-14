"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type MultiComboboxOption = {
  value: string
  label: string
  description?: string
}

type MultiComboboxProps = {
  options: MultiComboboxOption[]
  values: string[]
  onValuesChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

function MultiCombobox({
  options,
  values,
  onValuesChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  disabled = false,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOptions = options.filter((option) =>
    values.includes(option.value)
  )

  function toggleValue(value: string) {
    if (values.includes(value)) {
      onValuesChange(values.filter((item) => item !== value))
      return
    }
    onValuesChange([...values, value])
  }

  function removeValue(value: string) {
    onValuesChange(values.filter((item) => item !== value))
  }

  return (
    <div className="space-y-2">
      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="secondary" className="gap-1 pe-1">
              <span>{option.label}</span>
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted"
                disabled={disabled}
                aria-label={`Remove ${option.label}`}
                onClick={() => removeValue(option.value)}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn("w-full justify-between font-normal", className)}
          >
            <span
              className={cn(
                selectedOptions.length === 0 && "text-muted-foreground"
              )}
            >
              {selectedOptions.length > 0
                ? `${selectedOptions.length} selected`
                : placeholder}
            </span>
            <ChevronsUpDownIcon className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const selected = values.includes(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${option.description ?? ""}`}
                      onSelect={() => toggleValue(option.value)}
                    >
                      <CheckIcon
                        className={cn(
                          "size-4",
                          selected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="min-w-0">
                        <p className="truncate">{option.label}</p>
                        {option.description ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        ) : null}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { MultiCombobox }
