"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hangul from "hangul-js";

const KEYBOARD_ROWS = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];

const SHIFT_MAP = {
  "ㅂ": "ㅃ",
  "ㅈ": "ㅉ",
  "ㄷ": "ㄸ",
  "ㄱ": "ㄲ",
  "ㅅ": "ㅆ",
  "ㅐ": "ㅒ",
  "ㅔ": "ㅖ",
};

function composeFromSequence(sequence = "") {
  const chunks = String(sequence || "").split(" ");
  return chunks
    .map((chunk) => {
      if (!chunk) return "";
      return Hangul.assemble(chunk.split(""));
    })
    .join(" ");
}

function toSequence(value = "") {
  return Hangul.disassemble(String(value || "")).join("");
}

function parseAcceptedAnswers(value = "") {
  return String(value || "")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAnswerValue(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function formatPreferenceAnswer(value = "") {
  const answers = parseAcceptedAnswers(value);
  return answers.join(" / ");
}

function isAnswerMatch(typedValue = "", expectedValue = "") {
  const typed = normalizeAnswerValue(typedValue);
  if (!typed) return false;

  const accepted = parseAcceptedAnswers(expectedValue).map((item) => normalizeAnswerValue(item));
  if (!accepted.length) return false;

  return accepted.includes(typed);
}

export default function WorksheetPracticePanel({ worksheet, isLight, onScoreChange }) {
  const [mode, setMode] = useState("writing");
  const [activeWritingIndex, setActiveWritingIndex] = useState(0);
  const [writingSequences, setWritingSequences] = useState({});
  const [writingResults, setWritingResults] = useState({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSequence, setQuizSequence] = useState("");
  const [quizResults, setQuizResults] = useState({});
  const [shiftEnabled, setShiftEnabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showRomanization, setShowRomanization] = useState(true);
  const romanizationToggleKey = useMemo(() => "bh-romanization-toggle", []);

  const entries = useMemo(() => worksheet?.entries || [], [worksheet]);
  const activeQuizItem = entries[quizIndex] || null;
  const activeWritingItem = entries[activeWritingIndex] || null;

  const writingCompletedCount = useMemo(() => {
    return Object.values(writingResults).filter(Boolean).length;
  }, [writingResults]);

  const writingPercent = useMemo(() => {
    if (!entries.length) return 0;
    return Math.round((writingCompletedCount / entries.length) * 100);
  }, [entries.length, writingCompletedCount]);

  const storageKey = useMemo(() => {
    return worksheet?.id ? `bh-worksheet-practice-${worksheet.id}` : null;
  }, [worksheet?.id]);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(romanizationToggleKey);
      if (storedValue !== null) {
        setShowRomanization(storedValue === "true");
      }
    } catch {
      // ignore local storage failures
    }
  }, [romanizationToggleKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(romanizationToggleKey, String(showRomanization));
    } catch {
      // ignore write errors
    }
  }, [romanizationToggleKey, showRomanization]);

  const findFirstIncompleteIndex = useCallback((results) => {
    for (let index = 0; index < entries.length; index += 1) {
      if (results[index] !== true) return index;
    }
    return 0;
  }, [entries.length]);

  const onlyCorrectResults = useCallback((results) => {
    return Object.entries(results).reduce((acc, [key, value]) => {
      if (value === true) acc[key] = true;
      return acc;
    }, {});
  }, []);

  const submitWritingAnswer = () => {
    const expected = String(activeWritingItem?.korean || "");
    const typed = composeFromSequence(writingSequences[activeWritingIndex] || "").trim();
    const isCorrect = isAnswerMatch(typed, expected);

    setWritingResults((prev) => ({ ...prev, [activeWritingIndex]: isCorrect }));
  };

  const keyboardInput = (rawKey) => {
    if (!rawKey) return;

    if (mode === "writing") {
      const targetIndex = Math.max(0, activeWritingIndex);

      setWritingSequences((prev) => {
        const current = String(prev[targetIndex] || "");

        if (rawKey === "BACKSPACE") {
          const nextMap = { ...prev, [targetIndex]: current.slice(0, -1) };
          setWritingResults((resultPrev) => ({ ...resultPrev, [targetIndex]: undefined }));
          return nextMap;
        }

        if (rawKey === "SPACE") {
          const nextMap = { ...prev, [targetIndex]: `${current} ` };
          setWritingResults((resultPrev) => ({ ...resultPrev, [targetIndex]: undefined }));
          return nextMap;
        }

        const nextKey = shiftEnabled && SHIFT_MAP[rawKey] ? SHIFT_MAP[rawKey] : rawKey;
        const nextSequence = `${current}${nextKey}`;
        const nextMap = { ...prev, [targetIndex]: nextSequence };
        setWritingResults((resultPrev) => ({ ...resultPrev, [targetIndex]: undefined }));
        return nextMap;
      });
      return;
    }

    setQuizSequence((prev) => {
      if (rawKey === "BACKSPACE") {
        setQuizResults((resultPrev) => ({ ...resultPrev, [quizIndex]: undefined }));
        return prev.slice(0, -1);
      }

      if (rawKey === "SPACE") {
        setQuizResults((resultPrev) => ({ ...resultPrev, [quizIndex]: undefined }));
        return `${prev} `;
      }

      const nextKey = shiftEnabled && SHIFT_MAP[rawKey] ? SHIFT_MAP[rawKey] : rawKey;
      setQuizResults((resultPrev) => ({ ...resultPrev, [quizIndex]: undefined }));
      return `${prev}${nextKey}`;
    });
  };

  const onPressKey = (key) => {
    keyboardInput(key);
    if (shiftEnabled && SHIFT_MAP[key]) {
      setShiftEnabled(false);
    }
  };

  const checkQuizAnswer = () => {
    if (!activeQuizItem) return;
    const typed = composeFromSequence(quizSequence).trim();
    const expected = String(activeQuizItem.korean || "");
    const isCorrect = isAnswerMatch(typed, expected);

    setQuizResults((prev) => ({ ...prev, [quizIndex]: isCorrect }));
  };

  const goQuiz = (nextIndex) => {
    if (!entries.length) return;
    const bounded = Math.max(0, Math.min(entries.length - 1, nextIndex));
    setQuizIndex(bounded);
    setQuizSequence("");
  };

  const quizScore = useMemo(() => {
    const values = Object.values(quizResults);
    const correct = values.filter(Boolean).length;
    const answered = values.filter((value) => value !== undefined).length;
    const percent = entries.length ? Math.round((correct / entries.length) * 100) : 0;
    const complete = entries.length > 0 && answered === entries.length;
    return { correct, answered, total: entries.length, percent, complete };
  }, [quizResults, entries.length]);

  const [persistedLoaded, setPersistedLoaded] = useState(false);

  useEffect(() => {
    if (!storageKey) {
      setPersistedLoaded(true);
      return;
    }

    setPersistedLoaded(false);

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setPersistedLoaded(true);
        return;
      }
      const parsed = JSON.parse(raw);
      const persistedWriting = parsed?.writingResults || {};
      const persistedQuiz = parsed?.quizResults || {};
      const persistedActiveWritingIndex = Number.isInteger(parsed?.activeWritingIndex)
        ? Number(parsed.activeWritingIndex)
        : null;
      const persistedQuizIndex = Number.isInteger(parsed?.quizIndex) ? Number(parsed.quizIndex) : null;

      setWritingResults(persistedWriting);
      setQuizResults(persistedQuiz);
      setWritingSequences(parsed?.writingSequences || {});
      setQuizSequence(parsed?.quizSequence || "");
      setMode(parsed?.mode === "quiz" ? "quiz" : "writing");
      setActiveWritingIndex(
        persistedActiveWritingIndex !== null && persistedActiveWritingIndex >= 0 && persistedActiveWritingIndex < entries.length
          ? persistedActiveWritingIndex
          : findFirstIncompleteIndex(persistedWriting)
      );
      setQuizIndex(
        persistedQuizIndex !== null && persistedQuizIndex >= 0 && persistedQuizIndex < entries.length
          ? persistedQuizIndex
          : findFirstIncompleteIndex(persistedQuiz)
      );
    } catch {
      // ignore invalid saved state
    } finally {
      setPersistedLoaded(true);
    }
  }, [entries.length, findFirstIncompleteIndex, storageKey]);

  useEffect(() => {
    if (!worksheet?.id || !storageKey || !persistedLoaded) return;

    const persisted = {
      writingResults: onlyCorrectResults(writingResults),
      quizResults: onlyCorrectResults(quizResults),
      activeWritingIndex,
      quizIndex,
      mode,
      writingSequences,
      quizSequence,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(persisted));

    if (typeof onScoreChange === "function") {
      const correctWriting = Object.values(writingResults).filter(Boolean).length;
      const nextWritingPercent = entries.length ? Math.round((correctWriting / entries.length) * 100) : 0;
      const correctQuiz = Object.values(quizResults).filter(Boolean).length;
      const answeredQuizCount = Object.values(quizResults).filter((value) => value !== undefined).length;
      const nextQuizPercent = entries.length ? Math.round((correctQuiz / entries.length) * 100) : 0;
      const nextQuizComplete = entries.length > 0 && answeredQuizCount === entries.length;

      onScoreChange(worksheet.id, {
        writingPercent: nextWritingPercent,
        quizPercent: nextQuizPercent,
        quizComplete: nextQuizComplete,
      });
    }

    setSaveStatus("Progress saved");
    const timeout = window.setTimeout(() => setSaveStatus(""), 1400);
    return () => window.clearTimeout(timeout);
  }, [
    activeWritingIndex,
    entries.length,
    mode,
    onlyCorrectResults,
    onScoreChange,
    quizIndex,
    quizResults,
    quizSequence,
    storageKey,
    worksheet?.id,
    writingResults,
    writingSequences,
  ]);

  const keyboardButtonClass = `rounded-lg border px-2 py-2 text-sm font-semibold transition ${
    isLight
      ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 active:bg-yellow-400"
      : "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-yellow-500 active:text-[#0b1728]"
  }`;
  const highlightedKeyClass = (key) =>
    key === activeKey
      ? "ring-2 ring-amber-400 bg-amber-500/15"
      : "";

  const currentLetter = activeWritingItem?.korean || "";
  const currentRomanization = activeWritingItem?.romanization || "";
  const currentAnswerSequence = writingSequences[activeWritingIndex] || "";
  const currentAnswerText = composeFromSequence(currentAnswerSequence).trim();
  const expectedAnswer = String(activeWritingItem?.korean || "").trim();
  const currentAnswerIsCorrect = isAnswerMatch(currentAnswerText, expectedAnswer);
  const currentAnswerIsFilled = currentAnswerText.length > 0;
  const currentAnswerIsIncorrect = currentAnswerIsFilled && !currentAnswerIsCorrect;
  const isLastWritingStep = activeWritingIndex === entries.length - 1;
  const canContinue = currentAnswerIsCorrect;
  const displayPlaceholder = currentLetter
    ? showRomanization && currentRomanization
      ? `Type: ${currentLetter} (${currentRomanization})`
      : `Type: ${currentLetter}`
    : "Type your answer";
  const inputBorderClass = currentAnswerIsCorrect
    ? "border-emerald-400 focus:border-emerald-400"
    : currentAnswerIsIncorrect
      ? "border-rose-500 focus:border-rose-400"
      : "border-white/15 focus:border-amber-400";
  const currentSound = activeWritingItem?.number || "";
  const activeKey = currentLetter;

  useEffect(() => {
    if (!activeWritingItem) return;
    setWritingResults((prev) => {
      if (currentAnswerIsCorrect) {
        if (prev[activeWritingIndex] === true) return prev;
        return { ...prev, [activeWritingIndex]: true };
      }

      if (prev[activeWritingIndex] === true) {
        const next = { ...prev };
        delete next[activeWritingIndex];
        return next;
      }

      return prev;
    });
  }, [activeWritingIndex, currentAnswerIsCorrect, activeWritingItem]);

  const handleContinue = () => {
    if (!currentAnswerIsCorrect) return;
    if (isLastWritingStep) {
      setSaveStatus("Writing practice complete!");
      return;
    }

    const nextIndex = Math.min(entries.length - 1, activeWritingIndex + 1);
    setActiveWritingIndex(nextIndex);
    setWritingSequences((prev) => ({ ...prev, [nextIndex]: prev[nextIndex] || "" }));
  };

  if (!worksheet || !entries.length) {
    return (
      <div className={`rounded-xl border p-4 text-sm ${isLight ? "border-slate-200 bg-white text-slate-600" : "border-white/10 bg-[#0f1d32] text-slate-300"}`}>
        This worksheet has no rows yet.
      </div>
    );
  }

  return (
    <section className={`mx-auto max-w-5xl rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0f1d32] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
          >
            ← Back to Worksheets
          </button>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-semibold tracking-tight">{worksheet.title}</h3>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Writing Practice</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-[#0f1d32] p-1">
            <button
              type="button"
              onClick={() => setMode("writing")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "writing" ? "bg-amber-400 text-[#0b1728]" : "text-slate-200 hover:bg-white/5"}`}
            >
              Writing
            </button>
            <button
              type="button"
              onClick={() => setMode("quiz")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "quiz" ? "bg-amber-400 text-[#0b1728]" : "text-slate-200 hover:bg-white/5"}`}
            >
              Quiz
            </button>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-[#0f1d32] px-4 py-2 text-sm text-slate-200">
            <span className="font-medium">Show Romanization</span>
            <button
              type="button"
              onClick={() => setShowRomanization((prev) => !prev)}
              className={`rounded-full px-3 py-1 font-semibold transition ${showRomanization ? "bg-amber-400 text-[#0b1728]" : "bg-white/10 text-slate-200"}`}
            >
              {showRomanization ? "ON" : "OFF"}
            </button>
          </div>

          {worksheet?.resourceFileData ? (
            <a
              href={worksheet.resourceFileData}
              target="_blank"
              rel="noreferrer"
              title="Download Worksheet"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#0f1d32] text-slate-200 transition hover:bg-white/5"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </a>
          ) : null}
        </div>
      </div>

      {mode === "writing" ? (
        <div className="space-y-5 max-w-6xl mx-auto">
          <div className={`rounded-3xl border p-4 shadow-sm ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Step {activeWritingIndex + 1} of {entries.length}</p>
                <p className="mt-2 text-xl font-semibold text-white">{writingCompletedCount}/{entries.length} correct</p>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-[#0f172c] px-3 py-2 text-xs text-slate-300 sm:flex">
                {entries.map((_, index) => (
                  <span
                    key={index}
                    className={`h-2.5 w-2.5 rounded-full ${index <= activeWritingIndex ? "bg-amber-400" : "bg-white/15"}`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${((activeWritingIndex + 1) / entries.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-4xl border border-white/10 bg-[#0f172c] p-6 text-center">
              <div className="text-[5rem] font-black leading-none text-amber-300 sm:text-[6rem]">{currentLetter || "ㄱ"}</div>
              {showRomanization && currentRomanization ? (
                <p className="mt-3 text-lg text-slate-300">{currentRomanization}</p>
              ) : null}
              <p className="mt-3 text-sm text-slate-300">Sound: {currentSound || "—"}</p>
            </div>

            <div className="rounded-4xl border border-white/10 bg-[#0f172c] p-5">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Answer</p>
                  <p className="mt-2 text-xl font-semibold text-white">Write the letter</p>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                  <input
                    autoFocus
                    value={composeFromSequence(writingSequences[activeWritingIndex] || "")}
                    onChange={(event) => {
                      const nextSeq = toSequence(event.target.value);
                      setWritingSequences((prev) => ({ ...prev, [activeWritingIndex]: nextSeq }));
                      setWritingResults((prev) => ({ ...prev, [activeWritingIndex]: undefined }));
                    }}
                    placeholder={displayPlaceholder}
                    className={`flex-1 rounded-3xl border px-4 py-3 text-2xl font-semibold text-white outline-none transition ${inputBorderClass}`}
                  />
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!canContinue}
                    className={`inline-flex h-14 items-center justify-center rounded-3xl px-6 text-sm font-semibold uppercase tracking-[0.15em] transition ${
                      canContinue
                        ? "bg-amber-400 text-[#0b1728] shadow-lg shadow-amber-400/25 hover:bg-amber-300"
                        : "cursor-not-allowed bg-white/10 text-slate-500"
                    }`}
                  >
                    {isLastWritingStep && currentAnswerIsCorrect ? "Finish" : "Continue"}
                  </button>
                </div>

                {currentAnswerIsIncorrect ? (
                  <p className="text-sm text-rose-300">Incorrect answer, please try again.</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-4xl border border-white/10 bg-[#0f172c] p-5">
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-400">Korean Keyboard</div>
            <div className="space-y-2">
              {KEYBOARD_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className={`grid gap-2 ${rowIndex === 0 ? "grid-cols-10" : rowIndex === 1 ? "grid-cols-9" : "grid-cols-7"}`}>
                  {row.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onPressKey(key)}
                      className={`${keyboardButtonClass} ${highlightedKeyClass(key)}`}
                    >
                      {shiftEnabled && SHIFT_MAP[key] ? SHIFT_MAP[key] : key}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              <button type="button" onClick={() => setShiftEnabled((prev) => !prev)} className={`${keyboardButtonClass} ${shiftEnabled ? "ring-2 ring-amber-400" : ""}`}>
                Shift
              </button>
              <button type="button" onClick={() => keyboardInput("SPACE")} className={`${keyboardButtonClass} col-span-2`}>
                Space
              </button>
              <button type="button" onClick={() => keyboardInput("BACKSPACE")} className={keyboardButtonClass}>
                Backspace
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`mt-4 rounded-xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
          <p className="text-sm font-semibold">
            Q{quizIndex + 1}: What is {activeQuizItem?.number} in Korean?
          </p>
          <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            Progress {quizIndex + 1}/{entries.length}
          </p>

          <div className="relative mt-3">
            <input
              value={composeFromSequence(quizSequence)}
              onFocus={() => {}}
              onChange={(event) => {
                setQuizSequence(toSequence(event.target.value));
                setQuizResults((prev) => ({ ...prev, [quizIndex]: undefined }));
              }}
              placeholder="Type your answer"
              className={`w-full rounded-lg border px-3 py-2 pr-16 text-sm outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-white/15 bg-[#13243d] text-slate-100"}`}
            />
            <button
              type="button"
              onClick={checkQuizAnswer}
              aria-label={
                quizResults[quizIndex] === true
                  ? "Correct"
                  : quizResults[quizIndex] === false
                    ? "Incorrect"
                    : "Enter answer"
              }
              className={`absolute right-1.5 top-1/2 inline-flex h-8 min-w-10 -translate-y-1/2 items-center justify-center rounded-md border px-2 text-xs font-semibold transition ${
                quizResults[quizIndex] === true
                  ? "border-transparent bg-transparent text-emerald-500"
                  : quizResults[quizIndex] === false
                    ? "border-transparent bg-transparent text-rose-500"
                    : isLight
                      ? "border-slate-300 bg-slate-500 text-white hover:bg-slate-600"
                      : "border-slate-500 bg-slate-700 text-white hover:bg-slate-600"
              }`}
            >
              {quizResults[quizIndex] === true ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : quizResults[quizIndex] === false ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              ) : (
                "Enter"
              )}
            </button>
          </div>

          <div className="mt-2 h-4 flex justify-end">
            {saveStatus ? (
              <p className={`text-xs font-semibold ${isLight ? "text-emerald-700" : "text-emerald-300"}`}>{saveStatus}</p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => goQuiz(quizIndex - 1)}
              disabled={quizIndex === 0}
              className={`rounded-lg border px-3 py-2 text-xs ${isLight ? "border-slate-300" : "border-white/15"} disabled:opacity-50`}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => goQuiz(quizIndex + 1)}
              disabled={quizIndex === entries.length - 1}
              className={`rounded-lg border px-3 py-2 text-xs ${isLight ? "border-slate-300" : "border-white/15"} disabled:opacity-50`}
            >
              Next
            </button>
          </div>


          {quizScore.complete ? (
            <p className={`mt-3 text-xs font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}>
              Quiz score: {quizScore.correct}/{quizScore.total} ({quizScore.percent}%)
            </p>
          ) : (
            <p className={`mt-3 text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              Answered: {quizScore.answered}/{quizScore.total}
            </p>
          )}
        </div>
      )}

    </section>
  );
}
