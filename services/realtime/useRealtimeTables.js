"use client";

import { useEffect, useRef } from "react";
import { subscribeToTables } from "./subscribeTables";

export function useRealtimeTables({ tables = [], onChange, channelName }) {
  const callbackRef = useRef(onChange);

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!Array.isArray(tables) || tables.length === 0 || typeof callbackRef.current !== "function") {
      return () => {};
    }

    const unsubscribe = subscribeToTables({
      tables,
      channelName,
      onChange: (payload) => callbackRef.current(payload),
    });

    return () => {
      unsubscribe();
    };
  }, [channelName, tables.length, tables.join(",")]);
}
