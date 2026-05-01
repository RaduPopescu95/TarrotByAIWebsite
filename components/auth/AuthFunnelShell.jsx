import React from "react";
import Header from "../Header";

export default function AuthFunnelShell({
  topSlot = null,
  children,
  /** "center" keeps the videoteca-style vertical centering on large screens; "start" pins content to the top (e.g. multi-step forms). */
  mainVerticalAlign = "center",
  /** Appended to <main> (e.g. extra top padding). */
  mainClassName = "",
}) {
  const mainLgBlock =
    mainVerticalAlign === "start"
      ? "lg:justify-start lg:pt-28 lg:pb-8 xl:pt-32"
      : "lg:justify-center lg:pt-24 lg:pb-6";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white lg:max-h-[100dvh] lg:overflow-hidden">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        className={`relative flex flex-1 flex-col px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:min-h-0 lg:overflow-y-auto lg:px-8 xl:px-12 ${mainLgBlock} ${mainClassName}`.trim()}
      >
        {topSlot}

        <div className="mx-auto w-full max-w-6xl shrink-0 xl:max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
