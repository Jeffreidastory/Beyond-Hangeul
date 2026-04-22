"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
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

export default function WorksheetPracticePanel({
  worksheet,
  isLight,
  onScoreChange,
  mode = "writing",
  onModeChange = () => {},
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [writingSequences, setWritingSequences] = useState({});
  const [writingResults, setWritingResults] = useState({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSequence, setQuizSequence] = useState("");
  const [quizResults, setQuizResults] = useState({});
  const [shiftEnabled, setShiftEnabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [writingFinished, setWritingFinished] = useState(false);

  const entries = useMemo(() => worksheet?.entries || [], [worksheet]);
  const activeQuizItem = entries[quizIndex] || null;
  const activeWritingItem = entries[currentStepIndex] || null;

  const writingCompletedCount = useMemo(() => {
    return Object.values(writingResults).filter(Boolean).length;
  }, [writingResults]);

  const writingPercent = useMemo(() => {
    if (!entries.length) return 0;
    return Math.round((writingCompletedCount / entries.length) * 100);
  }, [entries.length, writingCompletedCount]);

  const totalSteps = entries.length;
  const currentStepDisplay = totalSteps > 0 ? Math.min(Math.max(currentStepIndex + 1, 1), totalSteps) : 0;
  const progressPercent = totalSteps ? Math.round((writingCompletedCount / totalSteps) * 100) : 0;

  useEffect(() => {
    console.log({ currentStepIndex, totalSteps });
  }, [currentStepIndex, totalSteps]);

  useEffect(() => {
    if (!entries.length) {
      if (currentStepIndex !== 0) {
        setCurrentStepIndex(0);
      }
      return;
    }

    const boundedIndex = Math.min(Math.max(currentStepIndex, 0), entries.length - 1);
    if (boundedIndex !== currentStepIndex) {
      setCurrentStepIndex(boundedIndex);
    }
  }, [currentStepIndex, entries.length]);

  useEffect(() => {
    setCurrentStepIndex(0);
    setWritingFinished(false);
    setCompletionMessage("");
    setShowConfetti(false);
  }, [worksheet?.id]);

  const storageKey = useMemo(() => {
    return worksheet?.id ? `bh-worksheet-practice-${worksheet.id}` : null;
  }, [worksheet?.id]);

  useEffect(() => {
    if (!showConfetti) return undefined;

    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ["#f59e0b", "#ec4899", "#22c55e", "#38bdf8", "#a855f7"],
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });

    const timeout = window.setTimeout(() => setShowConfetti(false), 1800);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [showConfetti]);

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
    const typed = composeFromSequence(writingSequences[currentStepIndex] || "").trim();
    const isCorrect = isAnswerMatch(typed, expected);

    setWritingResults((prev) => ({ ...prev, [currentStepIndex]: isCorrect }));
  };

  const keyboardInput = (rawKey) => {
    if (!rawKey || writingFinished) return;

    if (mode === "writing") {
      const targetIndex = Math.max(0, currentStepIndex);

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
      const persistedMode = parsed?.mode === "quiz" ? "quiz" : "writing";
      if (persistedMode !== mode) {
        onModeChange(persistedMode);
      }
      setCurrentStepIndex(
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
      activeWritingIndex: currentStepIndex,
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
    currentStepIndex,
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

  const keyboardButtonClass = `rounded-lg border px-1.5 py-2 text-xs font-semibold transition sm:px-2 sm:text-sm ${
    isLight
      ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 active:bg-yellow-400"
      : "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-yellow-500 active:text-[#0b1728]"
  }`;
  const highlightedKeyClass = () => "";

  const currentLetter = activeWritingItem?.korean || "";
  const currentAnswerSequence = writingSequences[currentStepIndex] || "";
  const currentAnswerText = composeFromSequence(currentAnswerSequence).trim();
  const expectedAnswer = String(activeWritingItem?.korean || "").trim();
  const currentAnswerIsCorrect = isAnswerMatch(currentAnswerText, expectedAnswer);
  const currentAnswerIsFilled = currentAnswerText.length > 0;
  const currentAnswerIsIncorrect = currentAnswerIsFilled && !currentAnswerIsCorrect;
  const isLastWritingStep = totalSteps > 0 && currentStepIndex === totalSteps - 1;
  const canContinue = !writingFinished && currentAnswerIsCorrect;
  const nextCorrectCount =
    Object.values(writingResults).filter(Boolean).length +
    (currentAnswerIsCorrect && writingResults[currentStepIndex] !== true ? 1 : 0);
  const hasPerfectScore = entries.length > 0 && nextCorrectCount === entries.length;
  const inputBorderClass = currentAnswerIsCorrect
    ? "border-emerald-400 focus:border-emerald-400"
    : currentAnswerIsIncorrect
      ? "border-rose-500 focus:border-rose-400"
      : "border-white/15 focus:border-amber-400";
  const currentSound = activeWritingItem?.number || "";

  useEffect(() => {
    setWritingFinished(false);
    setCompletionMessage("");
    setShowConfetti(false);
  }, [worksheet?.id]);

  const restartWorksheet = () => {
    console.log({
      action: "restart",
      step: currentStepIndex,
      total: totalSteps,
      score: writingCompletedCount,
      isCompleted: writingFinished,
    });
    setCurrentStepIndex(0);
    setWritingResults({});
    setWritingSequences({});
    setCompletionMessage("");
    setShowConfetti(false);
    setWritingFinished(false);
    setSaveStatus("");
    setQuizResults({});
    setQuizSequence("");

    try {
      if (storageKey) {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // ignore local storage failures
    }
  };

  const startQuiz = () => {
    const firstIncompleteQuizIndex = findFirstIncompleteIndex(quizResults);
    goQuiz(firstIncompleteQuizIndex);
    onModeChange("quiz");
  };

  const canAction = canContinue || writingFinished;

  const handleContinue = () => {
    if (!currentAnswerIsCorrect || writingFinished) return;

    setWritingResults((prev) => {
      if (prev[currentStepIndex] === true) return prev;
      return { ...prev, [currentStepIndex]: true };
    });

    if (isLastWritingStep) {
      setShowConfetti(hasPerfectScore);
      setCompletionMessage(hasPerfectScore ? "" : "Good job! Review incorrect answers to improve.");
      setSaveStatus("");
      setWritingFinished(true);
      return;
    }

    setCompletionMessage("");
    setShowConfetti(false);

    const nextIndex = Math.min(entries.length - 1, Math.max(currentStepIndex + 1, 0));
    setCurrentStepIndex(nextIndex);
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
    <section className={`mx-auto w-full max-w-5xl rounded-2xl border p-3 pb-24 sm:p-4 sm:pb-6 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>

      {mode === "writing" ? (
        <div className="mx-auto w-full max-w-6xl space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className={`rounded-4xl border p-4 text-center sm:p-6 ${isLight ? "border-slate-200 bg-white/90" : "border-white/10 bg-[#0f172c]"}`}>
              <div className="text-[5rem] font-black leading-none text-amber-300 sm:text-[6rem]">{currentLetter || "ㄱ"}</div>
              <p className={`mt-3 text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Sound: {currentSound || "—"}</p>
            </div>

            <div className={`rounded-4xl border p-4 sm:p-5 ${isLight ? "border-slate-200 bg-white/90" : "border-white/10 bg-[#0f172c]"}`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Answer</p>
                    <p className={`mt-2 text-xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Write the letter</p>
                  </div>
                  <button
                    type="button"
                    onClick={restartWorksheet}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-400 transition ${isLight ? "bg-slate-100 text-slate-900 hover:border-slate-300 hover:text-slate-900" : "bg-[#0f172c] text-amber-300 hover:border-amber-300 hover:text-amber-100"}`}
                    aria-label="Restart worksheet"
                  >
                    ↻
                  </button>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                  <div className="relative min-w-0 flex-1">
                    <input
                      autoFocus
                      disabled={writingFinished}
                      value={composeFromSequence(writingSequences[currentStepIndex] || "")}
                      onChange={(event) => {
                        if (writingFinished) return;
                        const nextSeq = toSequence(event.target.value);
                        setWritingSequences((prev) => ({ ...prev, [currentStepIndex]: nextSeq }));
                        setWritingResults((prev) => ({ ...prev, [currentStepIndex]: undefined }));
                      }}
                      className={`w-full rounded-3xl border px-4 py-3 pr-12 text-2xl font-semibold outline-none transition ${inputBorderClass} ${isLight ? "text-slate-900 bg-transparent" : "text-white bg-[#0f172c]"}`}
                    />
                    {currentAnswerIsCorrect ? (
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-emerald-400">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={writingFinished ? startQuiz : handleContinue}
                    disabled={!canAction}
                    className={`inline-flex h-14 w-full items-center justify-center rounded-3xl px-6 text-sm font-semibold uppercase tracking-[0.15em] transition sm:w-auto ${
                      canAction
                        ? "bg-amber-400 text-[#0b1728] shadow-lg shadow-amber-400/25 hover:bg-amber-300"
                        : "cursor-not-allowed bg-white/10 text-slate-500"
                    }`}
                  >
                    {writingFinished ? "Take Quiz" : isLastWritingStep ? "Finish" : "Continue"}
                  </button>
                </div>

                {currentAnswerIsIncorrect ? (
                  <p className="text-sm text-rose-300">Incorrect answer, please try again.</p>
                ) : null}

                {completionMessage ? (
                  <div className="mt-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200">
                    {completionMessage}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border px-4 py-3 text-xs sm:text-sm lg:hidden ${isLight ? "border-amber-200 bg-amber-50 text-amber-900" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>
            Mobile note: To answer in Korean, install and use a Hangul/Korean keyboard on your phone.
          </div>

          <div className={`hidden rounded-4xl border p-4 sm:p-5 lg:block ${isLight ? "border-slate-200 bg-white/90" : "border-white/10 bg-[#0f172c]"}`}>
            <div className={`mb-3 text-xs uppercase tracking-[0.3em] ${isLight ? "text-slate-500" : "text-slate-400"}`}>Korean Keyboard</div>
            <div className="space-y-2 overflow-x-auto pb-1">
              {KEYBOARD_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className={`grid min-w-[17.5rem] gap-1.5 sm:min-w-0 sm:gap-2 ${rowIndex === 0 ? "grid-cols-10" : rowIndex === 1 ? "grid-cols-9" : "grid-cols-7"}`}>
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

          <div className={`mt-3 rounded-3xl border px-4 py-2 text-sm shadow-sm ${isLight ? "border-slate-200 bg-white/90 text-slate-700" : "border-white/10 bg-[#0f172c] text-slate-300"}`}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className={`${isLight ? "font-semibold text-slate-900" : "font-semibold text-white"}`}>{writingCompletedCount}/{entries.length} correct</span>
              <span>Step {currentStepDisplay} of {totalSteps}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
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
