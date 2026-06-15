import React from "react";
import { Button } from "../ui/button";
import { Building2, Search } from "lucide-react";

export default function PartnerPromotionsEmptyState({ type, onAction }) {
  const states = {
    noPromotions: {
      icon: Building2,
      title: "Nu există promovări încă",
      description: "Adaugă prima firmă parteneră pentru site și aplicație.",
      action: { label: "Firmă nouă", onClick: onAction, variant: "default" },
    },
    noResults: {
      icon: Search,
      title: "Niciun rezultat găsit",
      description: "Nicio promovare nu corespunde filtrelor curente. Încearcă să modifici criteriile de căutare.",
      action: { label: "Resetează filtrele", onClick: onAction, variant: "outline" },
    },
  };

  const state = states[type] || states.noPromotions;
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{state.title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-600">{state.description}</p>
      {state.action ? (
        <Button
          variant={state.action.variant || "default"}
          onClick={state.action.onClick}
          className="mt-6"
        >
          {state.action.label}
        </Button>
      ) : null}
    </div>
  );
}
