"use client";

import { useState } from "react";
import JobDescriptionForm from "@/components/JobDescriptionForm";
import CoverLetterForm from "@/components/CoverLetterForm";
import MasterDataEditor from "@/components/MasterDataEditor";
import ApplicationTracker from "@/components/ApplicationTracker";

type Tab = "tailor" | "cover-letter" | "tracker" | "master";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("tailor");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Resume Tailor
        </h1>

        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("tailor")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "tailor"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Tailor Resume
          </button>
          <button
            onClick={() => setActiveTab("cover-letter")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "cover-letter"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Cover Letter
          </button>
          <button
            onClick={() => setActiveTab("tracker")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "tracker"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Application Tracker
          </button>
          <button
            onClick={() => setActiveTab("master")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "master"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Edit Master Data
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === "tailor" && <JobDescriptionForm />}
          {activeTab === "cover-letter" && <CoverLetterForm />}
          {activeTab === "tracker" && <ApplicationTracker />}
          {activeTab === "master" && <MasterDataEditor />}
        </div>
      </div>
    </div>
  );
}
