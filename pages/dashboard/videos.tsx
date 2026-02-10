import React from "react";
import { useRouter } from "next/router";
import LocalPasswordGate from "../../components/Dashboard/LocalPasswordGate";
import VideoLibraryAdminScreen from "../../src/features/video-library-admin/components/VideoLibraryAdminScreen";

export default function VideosDashboardPage() {
  const router = useRouter();

  return (
    <LocalPasswordGate redirectTo="/dashboard/login" onGranted={() => {}}>
      <div className="min-h-screen bg-gray-50">
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="group flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:shadow"
            >
              <svg
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </button>
            <div className="flex items-center gap-4">
              <div className="h-8 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                Videoclipuri Dashboard
              </h1>
            </div>
          </div>

          <VideoLibraryAdminScreen />
        </main>
      </div>
    </LocalPasswordGate>
  );
}
