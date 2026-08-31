"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useId, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import styles from "./review-primitives.module.css";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
};

export function editorSectionId(title: string) {
  return `editor-section-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/(^-|-$)/gu, "")}`;
}

export function ReviewField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: TextFieldProps) {
  const id = useId();

  return (
    <div className={styles.field}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        className={styles.input}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </div>
  );
}

export function ReviewTextarea({
  label,
  value,
  onChange,
  placeholder,
}: Omit<TextFieldProps, "type">) {
  const id = useId();

  return (
    <div className={styles.field}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        className={styles.textarea}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

export function ReviewSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const id = useId();

  return (
    <div className={styles.field}>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className={styles.select}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function EditorSection({
  title,
  description,
  actionLabel,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAdd?: () => void;
  children: ReactNode;
}) {
  return (
    <Card className={styles.section} id={editorSectionId(title)}>
      <CardHeader className={`${styles.sectionHeader} border-b sm:grid sm:grid-cols-[1fr_auto]`}>
        <div className="space-y-1">
          <CardTitle>
            <h2 className={styles.sectionTitle}>{title}</h2>
          </CardTitle>
          <CardDescription className={styles.sectionDescription}>{description}</CardDescription>
        </div>
        {onAdd && actionLabel ? (
          <Button className={styles.sectionAction} onClick={onAdd} type="button" variant="outline">
            <Plus aria-hidden="true" />
            {actionLabel}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className={styles.sectionContent}>{children}</CardContent>
    </Card>
  );
}

export function EntryCard({
  label,
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  label: string;
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.entry}>
      <div className={styles.entryHeader}>
        <p className={styles.entryLabel}>
          {label} {String(index + 1).padStart(2, "0")}
        </p>
        <div className={styles.entryControls}>
          <Button
            aria-label={`Move ${label.toLowerCase()} ${index + 1} up`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <ArrowUp aria-hidden="true" />
          </Button>
          <Button
            aria-label={`Move ${label.toLowerCase()} ${index + 1} down`}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <ArrowDown aria-hidden="true" />
          </Button>
          <Button
            aria-label={`Delete ${label.toLowerCase()} ${index + 1}`}
            onClick={onRemove}
            size="icon-sm"
            type="button"
            variant="destructive"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}

export function EmptySection({ children }: { children: ReactNode }) {
  return (
    <p className={styles.empty}>
      {children}
    </p>
  );
}

export function StringListEditor({
  label,
  values,
  onChange,
  addLabel = "Add item",
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  addLabel?: string;
  placeholder?: string;
}) {
  return (
    <div className={styles.field}>
      <Label>{label}</Label>
      <div className={styles.list}>
        {values.map((value, index) => (
          <div className={styles.listRow} key={`${label}-${index}`}>
            <Input
              className={styles.input}
              aria-label={`${label} ${index + 1}`}
              onChange={(event) => {
                const next = [...values];
                next[index] = event.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              value={value}
            />
            <Button
              aria-label={`Move ${label.toLowerCase()} ${index + 1} up`}
              disabled={index === 0}
              onClick={() => onChange(moveItem(values, index, -1))}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <ArrowUp aria-hidden="true" />
            </Button>
            <Button
              aria-label={`Move ${label.toLowerCase()} ${index + 1} down`}
              disabled={index === values.length - 1}
              onClick={() => onChange(moveItem(values, index, 1))}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <ArrowDown aria-hidden="true" />
            </Button>
            <Button
              aria-label={`Delete ${label.toLowerCase()} ${index + 1}`}
              onClick={() =>
                onChange(values.filter((_, itemIndex) => itemIndex !== index))
              }
              size="icon-sm"
              type="button"
              variant="destructive"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        className={cn(styles.addButton, values.length > 0 && "mt-1")}
        onClick={() => onChange([...values, ""])}
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  );
}

export function replaceItem<T>(items: T[], index: number, value: T) {
  const next = [...items];
  next[index] = value;
  return next;
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const destination = index + direction;

  if (destination < 0 || destination >= items.length) {
    return items;
  }

  const next = [...items];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}

export function removeItem<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}
