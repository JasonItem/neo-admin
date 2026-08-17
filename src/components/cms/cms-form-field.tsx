"use client";

import * as React from "react";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function CmsFormField({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children: React.ReactElement<{ id?: string }>;
  className?: string;
}) {
  const id = React.useId();
  return (
    <Field className={cn("gap-1.5", className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {React.cloneElement(children, { id })}
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

export function CmsPickerField({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Field className={cn("gap-1.5", className)}>
      <FieldTitle>{label}</FieldTitle>
      {children}
      <FieldDescription>{description}</FieldDescription>
    </Field>
  );
}
