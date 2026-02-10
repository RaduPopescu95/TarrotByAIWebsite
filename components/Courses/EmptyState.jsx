import React from "react";
import { Button } from "../ui/button";
import { Lock, Video, Search } from "lucide-react";

export default function EmptyState({ type, onAction }) {
  const states = {
    auth: {
      icon: Lock,
      title: "Conectare necesară",
      description: "Autentifică-te pentru a administra cursurile video.",
      action: { label: "Conectare", onClick: onAction },
    },
    noCourses: {
      icon: Video,
      title: "Nu există cursuri încă",
      description: "Adaugă primul curs.",
      actions: [
        { label: "Adaugă curs", onClick: onAction, variant: "default" },
   
      ],
    },
    noResults: {
      icon: Search,
      title: "Niciun rezultat găsit",
      description: "Niciun curs nu corespunde filtrelor curente. Încearcă să modifici criteriile de căutare.",
      action: { label: "Resetează filtrele", onClick: onAction, variant: "outline" },
    },
  };

  const state = states[type] || states.noCourses;
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{state.title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-600">{state.description}</p>
      <div className="mt-6 flex items-center gap-3">
        {state.actions ? (
          state.actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "default"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))
        ) : state.action ? (
          <Button variant={state.action.variant || "default"} onClick={state.action.onClick}>
            {state.action.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
