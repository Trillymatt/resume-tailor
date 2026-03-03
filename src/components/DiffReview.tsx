"use client";

import { useState } from "react";
import { MasterData, TailoredResume } from "@/lib/types";

interface DiffReviewProps {
  original: MasterData;
  tailored: TailoredResume;
  onDownload: (finalResume: TailoredResume) => void;
  downloading: boolean;
}

export default function DiffReview({
  original,
  tailored,
  onDownload,
  downloading,
}: DiffReviewProps) {
  // Track which proposed skills are accepted (by skill name)
  const proposedSkills = tailored.technicalSkills.programmingLanguages
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const originalSkills = original.technicalSkills.programmingLanguages;

  const [acceptedSkills, setAcceptedSkills] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      proposedSkills.forEach((s) => (map[s] = true));
      originalSkills.forEach((s) => {
        if (!(s in map)) map[s] = false;
      });
      return map;
    }
  );

  // Track accepted state for each bullet
  const [acceptedBullets, setAcceptedBullets] = useState<
    Record<string, boolean>
  >(() => {
    const map: Record<string, boolean> = {};
    tailored.workExperience.forEach((entry, i) => {
      entry.bullets.forEach((_, j) => {
        map[`work${i}_${j}`] = true;
      });
    });
    tailored.projects.forEach((entry, i) => {
      entry.bullets.forEach((_, j) => {
        map[`proj${i}_${j}`] = true;
      });
    });
    tailored.leadership.forEach((entry, i) => {
      entry.bullets.forEach((_, j) => {
        map[`lead${i}_${j}`] = true;
      });
    });
    return map;
  });

  // Track which project/leadership entries are included (by id)
  const [includedProjects, setIncludedProjects] = useState<Set<string>>(
    () => new Set(tailored.projects.map((p) => p.id))
  );
  const [includedLeadership, setIncludedLeadership] = useState<Set<string>>(
    () => new Set(tailored.leadership.map((l) => l.id))
  );

  function toggleSkill(skill: string) {
    setAcceptedSkills((prev) => ({ ...prev, [skill]: !prev[skill] }));
  }

  function toggleBullet(key: string) {
    setAcceptedBullets((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleProject(id: string) {
    setIncludedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleLeadership(id: string) {
    setIncludedLeadership((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function buildFinalResume(): TailoredResume {
    const finalSkills = [
      ...proposedSkills.filter((s) => acceptedSkills[s]),
      ...originalSkills.filter(
        (s) => !proposedSkills.includes(s) && acceptedSkills[s]
      ),
    ].join(", ");

    const finalWork = tailored.workExperience.map((entry, i) => {
      const origEntry = original.workExperience.find(
        (w) => w.id === entry.id
      );
      return {
        id: entry.id,
        company: origEntry?.company ?? "",
        location: origEntry?.location ?? "",
        title: origEntry?.title ?? "",
        dates: origEntry?.dates ?? "",
        bullets: entry.bullets.map((bullet, j) => {
          if (acceptedBullets[`work${i}_${j}`]) return bullet;
          return origEntry?.bullets[j] ?? bullet;
        }),
      };
    });

    // Projects selected by AI (with bullet-level review)
    const finalProjectsFromTailored = tailored.projects
      .filter((entry) => includedProjects.has(entry.id))
      .map((entry) => {
        const i = tailored.projects.indexOf(entry);
        return {
          id: entry.id,
          name: entry.name,
          bullets: entry.bullets.map((bullet, j) => {
            if (acceptedBullets[`proj${i}_${j}`]) return bullet;
            const origEntry = original.projects.find((p) => p.id === entry.id);
            return origEntry?.bullets[j] ?? bullet;
          }),
        };
      });

    // Additional projects manually added from the pool (use original details)
    const extraProjectsFromPool = original.projects
      .filter(
        (p) =>
          !tailored.projects.some((t) => t.id === p.id) &&
          includedProjects.has(p.id)
      )
      .map((p) => ({
        id: p.id,
        name: p.name,
        bullets: p.bullets,
      }));

    const finalProjects = [
      ...finalProjectsFromTailored,
      ...extraProjectsFromPool,
    ];

    // Leadership selected by AI (with bullet-level review)
    const finalLeadershipFromTailored = tailored.leadership
      .filter((entry) => includedLeadership.has(entry.id))
      .map((entry) => {
        const i = tailored.leadership.indexOf(entry);
        return {
          id: entry.id,
          organization: entry.organization,
          location: entry.location,
          role: entry.role,
          dates: entry.dates,
          bullets: entry.bullets.map((bullet, j) => {
            if (acceptedBullets[`lead${i}_${j}`]) return bullet;
            const origEntry = original.leadership.find((l) => l.id === entry.id);
            return origEntry?.bullets[j] ?? bullet;
          }),
        };
      });

    // Additional leadership entries manually added from the pool (use original details)
    const extraLeadershipFromPool = original.leadership
      .filter(
        (l) =>
          !tailored.leadership.some((t) => t.id === l.id) &&
          includedLeadership.has(l.id)
      )
      .map((l) => ({
        id: l.id,
        organization: l.organization,
        location: l.location,
        role: l.role,
        dates: l.dates,
        bullets: l.bullets,
      }));

    const finalLeadership = [
      ...finalLeadershipFromTailored,
      ...extraLeadershipFromPool,
    ];

    return {
      technicalSkills: {
        ...tailored.technicalSkills,
        programmingLanguages: finalSkills,
      },
      workExperience: finalWork,
      projects: finalProjects,
      leadership: finalLeadership,
      certifications: tailored.certifications,
    };
  }

  function getOriginalBullet(
    section: "workExperience" | "projects" | "leadership",
    entryId: string,
    bulletIndex: number
  ): string | null {
    const origList = original[section] as Array<{ id: string; bullets: string[] }>;
    const origEntry = origList.find((e) => e.id === entryId);
    return origEntry?.bullets[bulletIndex] ?? null;
  }

  function isBulletChanged(original: string | null, proposed: string): boolean {
    if (!original) return true;
    return original.trim() !== proposed.trim();
  }

  const allSkills = [
    ...proposedSkills,
    ...originalSkills.filter((s) => !proposedSkills.includes(s)),
  ];

  // Pool entries not selected by AI
  const unselectedProjects = original.projects.filter(
    (p) => !tailored.projects.some((t) => t.id === p.id)
  );
  const unselectedLeadership = original.leadership.filter(
    (l) => !tailored.leadership.some((t) => t.id === l.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Review Changes
        </h2>
        <button
          onClick={() => onDownload(buildFinalResume())}
          disabled={downloading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {downloading ? "Downloading..." : "Download Resume"}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Green = AI&apos;s proposed change. Red = removed by AI. Toggle
        checkboxes to accept or reject each change.
      </p>

      {/* Technical Skills */}
      <section className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">
            Technical Skills — Programming Languages
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {allSkills.map((skill) => {
            const isInProposed = proposedSkills.includes(skill);
            const isInOriginal = originalSkills.includes(skill);
            const isNew = isInProposed && !isInOriginal;
            const isRemoved = !isInProposed && isInOriginal;
            const accepted = acceptedSkills[skill];

            let bgColor = "";
            if (isNew) bgColor = "bg-green-50";
            else if (isRemoved) bgColor = "bg-red-50";

            return (
              <label
                key={skill}
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 ${bgColor}`}
              >
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={() => toggleSkill(skill)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  className={`text-sm ${
                    isRemoved && !accepted
                      ? "line-through text-gray-400"
                      : "text-gray-900"
                  }`}
                >
                  {skill}
                </span>
                {isNew && (
                  <span className="text-xs text-green-600 font-medium">
                    added
                  </span>
                )}
                {isRemoved && (
                  <span className="text-xs text-red-600 font-medium">
                    removed by AI
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </section>

      {/* Work Experience */}
      {tailored.workExperience.map((entry, i) => {
        const origEntry = original.workExperience.find(
          (w) => w.id === entry.id
        );
        return (
          <section
            key={entry.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">
                Work Experience — {origEntry?.company} ({origEntry?.title})
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {entry.bullets.map((bullet, j) => {
                const origBullet = getOriginalBullet(
                  "workExperience",
                  entry.id,
                  j
                );
                const changed = isBulletChanged(origBullet, bullet);
                const key = `work${i}_${j}`;
                const accepted = acceptedBullets[key];

                return (
                  <BulletDiff
                    key={key}
                    original={origBullet}
                    proposed={bullet}
                    changed={changed}
                    accepted={accepted}
                    onToggle={() => toggleBullet(key)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Projects — Selected by AI */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Projects — AI selected {tailored.projects.length} from pool
        </h3>

        {tailored.projects.map((entry, i) => {
          const included = includedProjects.has(entry.id);
          return (
            <section
              key={entry.id}
              className={`border rounded-lg overflow-hidden ${
                included ? "border-green-300 bg-green-50/30" : "border-gray-200 opacity-50"
              }`}
            >
              <div className={`px-4 py-2 border-b flex items-center justify-between ${
                included ? "bg-green-100 border-green-200" : "bg-gray-100 border-gray-200"
              }`}>
                <h3 className="text-sm font-semibold text-gray-700">
                  {entry.name}
                </h3>
                <button
                  onClick={() => toggleProject(entry.id)}
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    included
                      ? "bg-green-200 text-green-800 hover:bg-green-300"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {included ? "Included" : "Excluded"}
                </button>
              </div>
              {included && (
                <div className="divide-y divide-gray-100">
                  {entry.bullets.map((bullet, j) => {
                    const origBullet = getOriginalBullet(
                      "projects",
                      entry.id,
                      j
                    );
                    const changed = isBulletChanged(origBullet, bullet);
                    const key = `proj${i}_${j}`;
                    const accepted = acceptedBullets[key];

                    return (
                      <BulletDiff
                        key={key}
                        original={origBullet}
                        proposed={bullet}
                        changed={changed}
                        accepted={accepted}
                        onToggle={() => toggleBullet(key)}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {/* Unselected projects from pool */}
        {unselectedProjects.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Not selected by AI (click to add)
            </p>
            {unselectedProjects.map((entry) => (
              <div
                key={entry.id}
                className={`border rounded-lg overflow-hidden ${
                  includedProjects.has(entry.id)
                    ? "border-green-300 bg-green-50/30"
                    : "border-dashed border-gray-300"
                }`}
              >
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">{entry.name}</span>
                  <button
                    onClick={() => toggleProject(entry.id)}
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      includedProjects.has(entry.id)
                        ? "bg-green-200 text-green-800 hover:bg-green-300"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {includedProjects.has(entry.id) ? "Included" : "Add"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leadership — Selected by AI */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Leadership — AI selected {tailored.leadership.length} from pool
        </h3>

        {tailored.leadership.map((entry, i) => {
          const included = includedLeadership.has(entry.id);
          return (
            <section
              key={entry.id}
              className={`border rounded-lg overflow-hidden ${
                included ? "border-green-300 bg-green-50/30" : "border-gray-200 opacity-50"
              }`}
            >
              <div className={`px-4 py-2 border-b flex items-center justify-between ${
                included ? "bg-green-100 border-green-200" : "bg-gray-100 border-gray-200"
              }`}>
                <h3 className="text-sm font-semibold text-gray-700">
                  {entry.organization} — {entry.role}
                </h3>
                <button
                  onClick={() => toggleLeadership(entry.id)}
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    included
                      ? "bg-green-200 text-green-800 hover:bg-green-300"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {included ? "Included" : "Excluded"}
                </button>
              </div>
              {included && (
                <div className="divide-y divide-gray-100">
                  {entry.bullets.map((bullet, j) => {
                    const origBullet = getOriginalBullet(
                      "leadership",
                      entry.id,
                      j
                    );
                    const changed = isBulletChanged(origBullet, bullet);
                    const key = `lead${i}_${j}`;
                    const accepted = acceptedBullets[key];

                    return (
                      <BulletDiff
                        key={key}
                        original={origBullet}
                        proposed={bullet}
                        changed={changed}
                        accepted={accepted}
                        onToggle={() => toggleBullet(key)}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {/* Unselected leadership from pool */}
        {unselectedLeadership.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Not selected by AI (click to add)
            </p>
            {unselectedLeadership.map((entry) => (
              <div
                key={entry.id}
                className={`border rounded-lg overflow-hidden ${
                  includedLeadership.has(entry.id)
                    ? "border-green-300 bg-green-50/30"
                    : "border-dashed border-gray-300"
                }`}
              >
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {entry.organization} — {entry.role}
                  </span>
                  <button
                    onClick={() => toggleLeadership(entry.id)}
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      includedLeadership.has(entry.id)
                        ? "bg-green-200 text-green-800 hover:bg-green-300"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {includedLeadership.has(entry.id) ? "Included" : "Add"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certifications */}
      <section className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">
            Certifications — Skills
          </h3>
        </div>
        <div className="px-4 py-3">
          {tailored.certifications.map((cert) => {
            const origCert = original.certifications.find(
              (c) => c.id === cert.id
            );
            return (
              <div key={cert.id} className="mb-2 last:mb-0">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {origCert?.name}
                </p>
                <p className="text-sm text-gray-900">{cert.skills}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom download button */}
      <div className="flex justify-end">
        <button
          onClick={() => onDownload(buildFinalResume())}
          disabled={downloading}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {downloading ? "Downloading..." : "Download Resume"}
        </button>
      </div>
    </div>
  );
}

function BulletDiff({
  original,
  proposed,
  changed,
  accepted,
  onToggle,
}: {
  original: string | null;
  proposed: string;
  changed: boolean;
  accepted: boolean;
  onToggle: () => void;
}) {
  if (!changed) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={accepted}
            onChange={onToggle}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <p className="text-sm text-gray-700">{proposed}</p>
            <span className="text-xs text-gray-400">unchanged</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={accepted}
          onChange={onToggle}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex-1 space-y-1">
          {original && (
            <div className="rounded bg-red-50 px-2 py-1">
              <p className="text-sm text-red-800 line-through">{original}</p>
            </div>
          )}
          <div className="rounded bg-green-50 px-2 py-1">
            <p className="text-sm text-green-800">{proposed}</p>
          </div>
          <span className="text-xs text-gray-400">
            {accepted ? "accepting proposed" : "keeping original"}
          </span>
        </div>
      </div>
    </div>
  );
}
