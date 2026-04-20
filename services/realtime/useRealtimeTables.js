"use client";

import { useEffect, useRef } from "react";
import { subscribeToTables } from "./subscribeTables";

export function useRealtimeTables({ tables = [], onChange, channelName, filters = {} }) {
  const callbackRef = useRef(onChange);

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  const tableKey = Array.isArray(tables) ? tables.join(",") : "";
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (!Array.isArray(tables) || tables.length === 0 || typeof callbackRef.current !== "function") {
      return () => {};
    }

    const unsubscribe = subscribeToTables({
      tables,
      channelName,
      filters,
      onChange: (payload) => callbackRef.current(payload),
    });

    return () => {
      unsubscribe();
    };
  }, [channelName, tableKey, filtersKey, tables, filters]);
}
