import React from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const statusOptions = [
  { value: "all", label: "Toate" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Publicate" },
];

export default function CourseFilters({ search, status, onSearchChange, onStatusChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Caută după titlu..."
        className="w-full max-w-sm"
      />
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/50 p-1">
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={status === option.value ? "default" : "ghost"}
            size="sm"
            onClick={() => onStatusChange(option.value)}
            className="h-8 px-3"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
