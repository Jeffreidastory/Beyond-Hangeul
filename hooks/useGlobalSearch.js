import { useState, useEffect, useMemo } from "react";

const SEARCH_DEBOUNCE = 300;

function normalize(str) {
  return (str || "").toLowerCase();
}

function match(text, query) {
  return normalize(text).includes(normalize(query));
}

function startsWith(text, query) {
  return normalize(text).startsWith(normalize(query));
}

function wordStartsWith(text, query) {
  const queryText = normalize(query);
  return (text || "").split(/\s+/).some((word) => normalize(word).startsWith(queryText));
}

function scoreResult(result, query) {
  const queryText = normalize(query);
  let score = 0;
  if (startsWith(result.title, queryText)) score += 120;
  else if (wordStartsWith(result.title, queryText)) score += 100;
  else if (match(result.title, queryText)) score += 70;
  if (result.subtitle && startsWith(result.subtitle, queryText)) score += 50;
  else if (result.subtitle && wordStartsWith(result.subtitle, queryText)) score += 30;
  else if (result.subtitle && match(result.subtitle, queryText)) score += 20;
  return score;
}

export default function useGlobalSearch({
  modules = [],
  worksheets = [],
  path = {},
  resources = [],
  goals = [],
  announcements = [],
  payments = [],
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  // Debounce input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE);
    return () => clearTimeout(t);
  }, [query]);

  // Grouped, filtered results
  const results = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.trim().toLowerCase();
    const moduleResults = modules
      .map((m) => ({
        type: "Module",
        icon: "\uD83D\uDCDA",
        title: m.moduleName,
        subtitle: m.topicTitle,
        data: m,
      }))
      .filter(
        (result) =>
          match(result.title, q) ||
          match(result.subtitle, q) ||
          (result.data.tags && result.data.tags.some((tag) => match(tag, q)))
      )
      .map((result) => ({ ...result, score: scoreResult(result, q) + (result.data.tags?.some((tag) => startsWith(tag, q)) ? 10 : 0) }));
    const worksheetResults = worksheets
      .map((w) => ({
        type: "Worksheet",
        icon: "\uD83D\uDCDD",
        title: w.title,
        subtitle: "",
        data: w,
      }))
      .filter(
        (result) =>
          match(result.title, q) ||
          (Array.isArray(result.data.entries) &&
            result.data.entries.some((e) => typeof e === "string" && match(e, q)))
      )
      .map((result) => ({ ...result, score: scoreResult(result, q) }));
    const pathResults =
      (path?.steps || [])
        .map((s) => ({
          type: "Path",
          icon: "\uD83D\uDE9C",
          title: s.title,
          subtitle: s.description,
          data: s,
        }))
        .filter(
          (result) => match(result.title, q) || match(result.subtitle, q)
        )
        .map((result) => ({ ...result, score: scoreResult(result, q) }));
    const resourceResults = resources
      .map((r) => ({
        type: "Resource",
        icon: "\uD83D\uDCC1",
        title: r.fileName,
        subtitle: r.fileType || "Resource",
        data: r,
      }))
      .filter(
        (result) =>
          match(result.title, q) ||
          match(result.subtitle, q) ||
          match(result.data.fileUrl, q)
      )
      .map((result) => ({ ...result, score: scoreResult(result, q) }));
    const goalResults = goals
      .map((g) => ({
        type: "Goal",
        icon: "\uD83C\uDFC6",
        title: g.title || "My Goal",
        subtitle: g.description,
        data: g,
      }))
      .filter(
        (result) =>
          match(result.title, q) ||
          match(result.subtitle, q)
      )
      .map((result) => ({ ...result, score: scoreResult(result, q) }));
    const paymentResults = payments
      .map((p) => ({
        type: "Payment",
        icon: "\uD83D\uDCB3",
        title: p.moduleId ? `Payment – ${p.moduleId}` : "Payment Record",
        subtitle: `${p.status} • ${p.method || "Payment"} • ₱${p.amount || 0}`,
        data: p,
      }))
      .filter(
        (result) =>
          match(result.title, q) ||
          match(result.subtitle, q) ||
          match(result.data.user_name, q) ||
          match(result.data.user_email, q)
      )
      .map((result) => ({ ...result, score: scoreResult(result, q) + 10 }));
    const announcementResults = announcements
      .map((a) => ({
        type: "Announcement",
        icon: "\uD83D\uDCE2",
        title: a.title,
        subtitle: a.content || a.message,
        data: a,
      }))
      .filter((result) => match(result.title, q) || match(result.subtitle, q))
      .map((result) => ({ ...result, score: scoreResult(result, q) }));

    return [
      ...moduleResults,
      ...worksheetResults,
      ...pathResults,
      ...resourceResults,
      ...goalResults,
      ...announcementResults,
    ]
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  }, [debouncedQuery, modules, worksheets, path, resources, goals, announcements]);

  // Keyboard navigation
  const handleKeyDown = (e, onSelect) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlighted((h) => Math.max(h - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter" && results[highlighted]) {
      onSelect(results[highlighted]);
      setIsOpen(false);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    isOpen,
    setIsOpen,
    highlighted,
    setHighlighted,
    handleKeyDown,
  };
}
