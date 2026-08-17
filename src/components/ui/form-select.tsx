"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type FormSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export function FormSelect({
  value,
  onValueChange,
  options,
  placeholder = "请选择",
  disabled,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  options: FormSelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const emptyValue = "__shadcn_empty__"
  const selected = value || emptyValue
  const selectOptions = options.map((option) => ({ ...option, value: option.value || emptyValue }))
  const selectedLabel = selectOptions.find((option) => option.value === selected)?.label

  return (
    <Select
      items={selectOptions}
      value={selected}
      onValueChange={(next) =>
        onValueChange(next === emptyValue ? "" : String(next))
      }
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder}>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {selectOptions.map((option) => (
            <SelectItem
              key={`${option.value}-${option.label}`}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
