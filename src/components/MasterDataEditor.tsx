"use client";

import { useState, useEffect } from "react";

type Status = "idle" | "loading" | "saving" | "saved" | "error";

export default function MasterDataEditor() {
  const [data, setData] = useState("");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/master-data");
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(
            (err && typeof err.error === "string" && err.error) ||
              "Failed to load master data"
          );
        }
        const json = await res.json();
        setData(JSON.stringify(json, null, 2));
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Failed to load master data"
        );
      }
    }

    load();
  }, []);

  async function handleSave() {
    setStatus("saving");
    setErrorMessage("");

    try {
      const parsed = JSON.parse(data);

      const response = await fetch("/api/master-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) throw new Error("Failed to save");

      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      if (err instanceof SyntaxError) {
        setErrorMessage("Invalid JSON. Please fix the syntax and try again.");
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to save"
        );
      }
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-gray-500">Loading master data...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Master Experience Data (JSON)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          This is the pool of all your skills, bullet points, and experiences.
          The AI picks from this when tailoring your resume.
        </p>
        <textarea
          value={data}
          onChange={(e) => setData(e.target.value)}
          rows={24}
          className="w-full rounded-lg border border-gray-300 p-3 text-xs font-mono text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={status === "saving"}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {status === "saving" ? "Saving..." : "Save Master Data"}
      </button>

      {status === "saved" && (
        <p className="text-sm text-green-600 font-medium">Saved!</p>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
