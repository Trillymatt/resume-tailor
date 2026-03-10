"use client";

import { useState } from "react";
import { MasterData, TailoredResume, KeywordAnalysis } from "@/lib/types";
import DiffReview from "./DiffReview";

type Status = "idle" | "tailoring" | "reviewing" | "downloading" | "done" | "error";

interface TailorResult {
  original: MasterData;
  tailored: TailoredResume;
}

export default function JobDescriptionForm() {
  const [jobDescription, setJobDescription] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<TailorResult | null>(null);
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis | null>(null);
  const [savedToTracker, setSavedToTracker] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setStatus("tailoring");
    setErrorMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      if (!response.ok) {
        const err = await response.json();
        const msg = err.detail
          ? `${err.error}: ${err.detail}`
          : err.error || "Failed to generate resume";
        throw new Error(msg);
      }

      const data: TailorResult = await response.json();
      setResult(data);
      setStatus("reviewing");

      // Run keyword analysis
      try {
        const analysisRes = await fetch("/api/keyword-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobDescription,
            resume: data.tailored,
          }),
        });
        if (analysisRes.ok) {
          const analysis: KeywordAnalysis = await analysisRes.json();
          setKeywordAnalysis(analysis);
        }
      } catch {
        // keyword analysis is optional — don't fail the whole flow
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  }

  async function handleDownload(finalResume: TailoredResume, format: "docx" | "pdf") {
    setStatus("downloading");

    const endpoint = format === "pdf"
      ? "/api/tailor/download-pdf"
      : "/api/tailor/download";
    const filename = format === "pdf"
      ? "tailored-resume.pdf"
      : "tailored-resume.docx";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalResume),
      });

      if (!response.ok) throw new Error("Failed to download");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMessage(`Failed to download ${format.toUpperCase()} resume`);
    }
  }

  function handleStartOver() {
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
    setKeywordAnalysis(null);
    setSavedToTracker(false);
  }

  async function handleSaveApplication(analysis: KeywordAnalysis) {
    if (savedToTracker) return;

    // Extract a rough job title and company from the JD (first line usually has it)
    const lines = jobDescription.trim().split("\n").filter(Boolean);
    const firstLine = lines[0] || "Unknown Position";
    const secondLine = lines[1] || "Unknown Company";

    const app = {
      id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      jobTitle: firstLine.slice(0, 100),
      company: secondLine.slice(0, 100),
      dateApplied: new Date().toISOString().split("T")[0],
      status: "applied" as const,
      jobDescription: jobDescription.slice(0, 2000),
      keywordScore: analysis.score,
      matchedKeywords: analysis.matched,
      missedKeywords: analysis.missed,
      notes: "",
    };

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(app),
      });
      if (res.ok) {
        setSavedToTracker(true);
      }
    } catch {
      // silently fail
    }
  }

  // Show diff review when we have results
  if (result && (status === "reviewing" || status === "downloading" || status === "done")) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleStartOver}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            &larr; Start over
          </button>
          {status === "done" && (
            <p className="text-sm text-green-600 font-medium">
              Resume downloaded!
            </p>
          )}
        </div>
        <DiffReview
          original={result.original}
          tailored={result.tailored}
          onDownload={handleDownload}
          downloading={status === "downloading"}
          keywordAnalysis={keywordAnalysis}
          onSaveApplication={savedToTracker ? undefined : handleSaveApplication}
        />
        {savedToTracker && (
          <p className="text-xs text-green-600 font-medium text-center">
            Saved to Application Tracker
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="jobDescription"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Paste Job Description
        </label>
        <textarea
          id="jobDescription"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={12}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
          placeholder="Paste the full job description here..."
        />
      </div>

      <button
        type="submit"
        disabled={status === "tailoring" || !jobDescription.trim()}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {status === "tailoring" ? "Tailoring with Claude..." : "Tailor Resume"}
      </button>

      {status === "tailoring" && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Analyzing job description and tailoring your resume...
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
      )}
    </form>
  );
}
