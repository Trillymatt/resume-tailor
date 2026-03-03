"use client";

import { useState } from "react";

type Status = "idle" | "generating" | "done" | "error";

export default function CoverLetterForm() {
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setStatus("generating");
    setErrorMessage("");
    setCoverLetter("");
    setCopied(false);

    try {
      const response = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate cover letter");
      }

      const { coverLetter: text } = await response.json();
      setCoverLetter(text);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    if (!coverLetter.trim()) {
      setErrorMessage("Generate a cover letter before downloading.");
      setStatus("error");
      return;
    }

    try {
      const response = await fetch("/api/cover-letter/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: coverLetter }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(
          (err && typeof err.error === "string" && err.error) ||
            "Failed to download cover letter"
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cover-letter.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to download cover letter"
      );
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label
            htmlFor="coverLetterJobDesc"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Paste Job Description
          </label>
          <textarea
            id="coverLetterJobDesc"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
            placeholder="Paste the full job description here..."
          />
        </div>

        <button
          type="submit"
          disabled={status === "generating" || !jobDescription.trim()}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {status === "generating"
            ? "Generating with Claude..."
            : "Generate Cover Letter"}
        </button>
      </form>

      {status === "generating" && (
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
          Writing your cover letter...
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
      )}

      {coverLetter && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Generated Cover Letter
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Download .docx
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {coverLetter}
          </div>
        </div>
      )}
    </div>
  );
}
