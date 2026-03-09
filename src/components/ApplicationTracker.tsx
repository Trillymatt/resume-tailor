"use client";

import { useState, useEffect } from "react";
import { TrackedApplication, ApplicationStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: "applied", label: "Applied", color: "bg-blue-100 text-blue-800" },
  { value: "screening", label: "Screening", color: "bg-yellow-100 text-yellow-800" },
  { value: "interview", label: "Interview", color: "bg-green-100 text-green-800" },
  { value: "offer", label: "Offer", color: "bg-emerald-100 text-emerald-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-gray-100 text-gray-800" },
];

function getStatusColor(status: ApplicationStatus): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.color ?? "bg-gray-100 text-gray-800";
}

function generateId(): string {
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ApplicationTracker() {
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");

  // Form fields
  const [formJobTitle, setFormJobTitle] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formStatus, setFormStatus] = useState<ApplicationStatus>("applied");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch {
      // silently fail — empty list is fine
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormJobTitle("");
    setFormCompany("");
    setFormStatus("applied");
    setFormNotes("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(app: TrackedApplication) {
    setFormJobTitle(app.jobTitle);
    setFormCompany(app.company);
    setFormStatus(app.status);
    setFormNotes(app.notes);
    setEditingId(app.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formJobTitle.trim() || !formCompany.trim()) return;

    if (editingId) {
      // Update existing
      const existing = applications.find((a) => a.id === editingId);
      if (!existing) return;

      const updated: TrackedApplication = {
        ...existing,
        jobTitle: formJobTitle,
        company: formCompany,
        status: formStatus,
        notes: formNotes,
      };

      const res = await fetch("/api/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === editingId ? updated : a))
        );
        resetForm();
      }
    } else {
      // Create new
      const newApp: TrackedApplication = {
        id: generateId(),
        jobTitle: formJobTitle,
        company: formCompany,
        dateApplied: new Date().toISOString().split("T")[0],
        status: formStatus,
        jobDescription: "",
        keywordScore: 0,
        matchedKeywords: [],
        missedKeywords: [],
        notes: formNotes,
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApp),
      });

      if (res.ok) {
        setApplications((prev) => [...prev, newApp]);
        resetForm();
      }
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/applications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function handleStatusChange(id: string, newStatus: ApplicationStatus) {
    const app = applications.find((a) => a.id === id);
    if (!app) return;

    const updated = { ...app, status: newStatus };
    const res = await fetch("/api/applications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    if (res.ok) {
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      );
    }
  }

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

  // Stats
  const totalApps = applications.length;
  const interviewCount = applications.filter(
    (a) => a.status === "interview" || a.status === "offer"
  ).length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;
  const avgKeywordScore =
    totalApps > 0
      ? Math.round(
          applications.reduce((sum, a) => sum + a.keywordScore, 0) / totalApps
        )
      : 0;

  if (loading) {
    return <p className="text-sm text-gray-500">Loading applications...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{totalApps}</p>
          <p className="text-xs text-blue-600">Total Applied</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{interviewCount}</p>
          <p className="text-xs text-green-600">Interviews</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
          <p className="text-xs text-red-600">Rejected</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">{avgKeywordScore}%</p>
          <p className="text-xs text-purple-600">Avg Keyword Match</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              filter === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({applications.length})
          </button>
          {STATUS_OPTIONS.map((opt) => {
            const count = applications.filter((a) => a.status === opt.value).length;
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  filter === opt.value
                    ? "bg-gray-900 text-white"
                    : `${opt.color} hover:opacity-80`
                }`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Add Application
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">
            {editingId ? "Edit Application" : "Add Application"}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={formJobTitle}
                onChange={(e) => setFormJobTitle(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Software Engineer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Company
              </label>
              <input
                type="text"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Google"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ApplicationStatus)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formJobTitle.trim() || !formCompany.trim()}
              className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {editingId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Applications list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">
            {applications.length === 0
              ? "No applications tracked yet. Add one or tailor a resume to get started."
              : "No applications match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered
            .sort(
              (a, b) =>
                new Date(b.dateApplied).getTime() -
                new Date(a.dateApplied).getTime()
            )
            .map((app) => (
              <div
                key={app.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {app.jobTitle}
                      </h4>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(
                          app.status
                        )}`}
                      >
                        {STATUS_OPTIONS.find((s) => s.value === app.status)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{app.company}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        Applied {app.dateApplied}
                      </span>
                      {app.keywordScore > 0 && (
                        <span
                          className={`text-xs font-medium ${
                            app.keywordScore >= 70
                              ? "text-green-600"
                              : app.keywordScore >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {app.keywordScore}% keyword match
                        </span>
                      )}
                    </div>
                    {app.notes && (
                      <p className="text-xs text-gray-500 mt-1">{app.notes}</p>
                    )}
                    {app.missedKeywords.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-red-500 font-medium">
                          Missing keywords:
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {app.missedKeywords.slice(0, 10).map((kw) => (
                            <span
                              key={kw}
                              className="px-1.5 py-0.5 text-xs bg-red-50 text-red-700 rounded"
                            >
                              {kw}
                            </span>
                          ))}
                          {app.missedKeywords.length > 10 && (
                            <span className="text-xs text-red-400">
                              +{app.missedKeywords.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={app.status}
                      onChange={(e) =>
                        handleStatusChange(
                          app.id,
                          e.target.value as ApplicationStatus
                        )
                      }
                      className="text-xs border border-gray-200 rounded px-1 py-1 text-gray-600 focus:outline-none focus:border-blue-400"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => startEdit(app)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
