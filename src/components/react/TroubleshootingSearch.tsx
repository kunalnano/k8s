import { useState, useMemo } from "react";
import { troubleshootingScenarios } from "../../data/troubleshooting";
import type { TroubleshootingScenario } from "../../data/types";

type Category = "all" | TroubleshootingScenario["category"];

const CATEGORY_COLORS: Record<string, string> = {
  scheduling: "bg-blue-600/20 text-blue-400 border-blue-600/50",
  runtime: "bg-purple-600/20 text-purple-400 border-purple-600/50",
  storage: "bg-emerald-600/20 text-emerald-400 border-emerald-600/50",
  resources: "bg-amber-600/20 text-amber-400 border-amber-600/50",
  networking: "bg-orange-600/20 text-orange-400 border-orange-600/50",
};

const STAT_COLORS: Record<string, string> = {
  Total: "text-white",
  Scheduling: "text-blue-400",
  Runtime: "text-purple-400",
  Storage: "text-emerald-400",
  Resources: "text-amber-400",
  Networking: "text-orange-400",
};

const QUICK_COMMANDS = [
  { cmd: "kubectl get pods -A -o wide", desc: "All pods across namespaces" },
  { cmd: "kubectl describe pod <name>", desc: "Pod events & details" },
  { cmd: "kubectl logs <pod> --previous", desc: "Previous crash logs" },
  {
    cmd: "kubectl get events --sort-by=.metadata.creationTimestamp",
    desc: "Recent cluster events",
  },
  { cmd: "kubectl top pods", desc: "Pod resource usage" },
  { cmd: "kubectl get nodes -o wide", desc: "Node status & info" },
];

export default function TroubleshootingSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category>("all");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredScenarios = useMemo(() => {
    return troubleshootingScenarios.filter((scenario) => {
      const matchesCategory =
        categoryFilter === "all" || scenario.category === categoryFilter;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        scenario.title.toLowerCase().includes(q) ||
        scenario.symptom.toLowerCase().includes(q) ||
        scenario.causes.some(
          (c) =>
            c.cause.toLowerCase().includes(q) ||
            c.check.toLowerCase().includes(q) ||
            c.fix.toLowerCase().includes(q),
        )
      );
    });
  }, [searchQuery, categoryFilter]);

  const stats = useMemo(() => {
    const categories: Array<{ label: string; value: Category }> = [
      { label: "Total", value: "all" },
      { label: "Scheduling", value: "scheduling" },
      { label: "Runtime", value: "runtime" },
      { label: "Storage", value: "storage" },
      { label: "Resources", value: "resources" },
      { label: "Networking", value: "networking" },
    ];
    return categories.map((cat) => ({
      ...cat,
      count:
        cat.value === "all"
          ? troubleshootingScenarios.length
          : troubleshootingScenarios.filter((s) => s.category === cat.value)
              .length,
    }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => setCategoryFilter(stat.value)}
            className={`p-2.5 rounded-lg border transition-all text-center ${
              categoryFilter === stat.value
                ? "bg-blue-600/20 border-blue-500"
                : "bg-slate-900 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div
              className={`text-xl font-bold ${STAT_COLORS[stat.label] || "text-white"}`}
            >
              {stat.count}
            </div>
            <div className="text-xs text-slate-400">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label
              htmlFor="ts-search"
              className="text-xs text-slate-400 mb-1 block"
            >
              Search scenarios
            </label>
            <input
              id="ts-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search symptoms, causes, fixes..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="ts-filter"
              className="text-xs text-slate-400 mb-1 block"
            >
              Filter by category
            </label>
            <select
              id="ts-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as Category)}
              className="w-full md:w-auto px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="scheduling">Scheduling</option>
              <option value="runtime">Runtime</option>
              <option value="storage">Storage</option>
              <option value="resources">Resources</option>
              <option value="networking">Networking</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-slate-500">
        Showing {filteredScenarios.length} of {troubleshootingScenarios.length}{" "}
        scenarios
      </div>

      {/* Results Grid */}
      {filteredScenarios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScenarios.map((scenario) => {
            const isExpanded = expandedCards.has(scenario.id);
            return (
              <div
                key={scenario.id}
                className="bg-slate-900 rounded-lg border border-slate-800 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <button
                    onClick={() => toggleCard(scenario.id)}
                    className="text-left flex-1"
                  >
                    <h3 className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors">
                      {scenario.title}
                    </h3>
                  </button>
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded border whitespace-nowrap ${CATEGORY_COLORS[scenario.category] || ""}`}
                  >
                    {scenario.category}
                  </span>
                </div>

                <div className="bg-slate-800 rounded p-2 mb-3">
                  <div className="text-[10px] text-slate-500 uppercase mb-0.5">
                    Symptom
                  </div>
                  <p className="text-slate-300 text-xs">{scenario.symptom}</p>
                </div>

                {isExpanded && (
                  <div className="space-y-2">
                    {scenario.causes.map((cause, j) => (
                      <div key={j} className="border-l-2 border-slate-700 pl-3">
                        <div className="text-xs font-medium text-white mb-0.5">
                          {cause.cause}
                        </div>
                        <div className="text-[10px] text-slate-400 mb-0.5">
                          <span className="text-blue-400">Check: </span>
                          <code className="bg-slate-800 px-1 rounded font-mono break-all">
                            {cause.check}
                          </code>
                        </div>
                        <div className="text-[10px]">
                          <span className="text-slate-500">Fix: </span>
                          <span className="text-emerald-400">{cause.fix}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => toggleCard(scenario.id)}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {isExpanded ? "Collapse" : "Show causes & fixes"}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/50 rounded-xl border border-dashed border-slate-700 p-8 text-center">
          <div className="text-slate-500 text-sm mb-2">No scenarios found</div>
          <p className="text-slate-600 text-xs mb-3">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Quick Commands */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="font-bold text-sm mb-3 text-white">Quick Commands</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {QUICK_COMMANDS.map((item, i) => (
            <div key={i} className="bg-slate-900 rounded-lg px-3 py-2">
              <code className="text-emerald-400 text-xs font-mono break-all">
                {item.cmd}
              </code>
              <p className="text-slate-500 text-[10px] mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
