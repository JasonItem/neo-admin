"use client";

import * as React from "react";
import { PlusCircleIcon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

type FacetedFilterOption = {
  label: string;
  value: string;
  count?: number;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type DataTableFacetedFilterProps = {
  title: string;
  options: FacetedFilterOption[];
  values: string[];
  onValuesChange: (values: string[]) => void;
};

export function DataTableFacetedFilter({
  title,
  options,
  values,
  onValuesChange,
}: DataTableFacetedFilterProps) {
  const [query, setQuery] = React.useState("");
  const selected = React.useMemo(() => new Set(values), [values]);
  const visibleOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const toggle = (value: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(value);
    else next.delete(value);
    onValuesChange([...next]);
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-dashed"
          />
        }
      >
        <PlusCircleIcon data-icon="inline-start" />
        {title}
        {selected.size > 0 && (
          <>
            <Separator orientation="vertical" className="mx-1" />
            {selected.size > 2 ? (
              <Badge variant="secondary">已选 {selected.size} 项</Badge>
            ) : (
              <span className="flex gap-1">
                {options
                  .filter((option) => selected.has(option.value))
                  .map((option) => (
                    <Badge key={option.value} variant="secondary">
                      {option.label}
                    </Badge>
                  ))}
              </span>
            )}
          </>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        <InputGroup>
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`搜索${title}`}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
        <FieldSet className="gap-1">
          <FieldLegend className="sr-only">选择{title}</FieldLegend>
          <FieldGroup className="gap-0.5">
            {visibleOptions.map((option) => {
              const id = `filter-${title}-${option.value}`;
              const Icon = option.icon;
              return (
                <Field
                  key={option.value}
                  orientation="horizontal"
                  className="rounded-md px-2 py-1.5 hover:bg-muted"
                >
                  <Checkbox
                    id={id}
                    name={id}
                    checked={selected.has(option.value)}
                    onCheckedChange={(checked) =>
                      toggle(option.value, Boolean(checked))
                    }
                  />
                  <FieldLabel htmlFor={id} className="min-w-0 font-normal">
                    {Icon && <Icon />}
                    <span className="truncate">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="ml-auto font-mono text-xs text-muted-foreground">
                        {option.count}
                      </span>
                    )}
                  </FieldLabel>
                </Field>
              );
            })}
            {visibleOptions.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                没有匹配选项
              </p>
            )}
          </FieldGroup>
        </FieldSet>
        {selected.size > 0 && (
          <>
            <Separator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onValuesChange([])}
            >
              清除筛选
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export type { FacetedFilterOption };
