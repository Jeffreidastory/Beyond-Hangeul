"use client";

import { useEffect, useState } from "react";
import UserPathTimeline from "@/components/path/UserPathTimeline";
import {
  getActiveLearningPathShared,
  listPrintableWorksheetsShared,
  listModulesShared,
  listWorksheetsShared,
} from "@/services/dashboardDataService";
import { useRealtimeTables } from "@/services/realtime/useRealtimeTables";

export default function UserPathRoute() {
  const [pathData, setPathData] = useState({ path: null, modules: [], worksheets: [] });

  const loadPathData = async () => {
    try {
      const [path, modules, worksheets, printableWorksheets] = await Promise.all([
        getActiveLearningPathShared(),
        listModulesShared(),
        listWorksheetsShared(),
        listPrintableWorksheetsShared(),
      ]);
      setPathData({
        path,
        modules,
        worksheets: [...worksheets, ...printableWorksheets],
      });
    } catch {
      setPathData({ path: null, modules: [], worksheets: [] });
    }
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadPathData();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, []);

  useRealtimeTables({
    tables: ["learning_paths", "learning_path_steps"],
    channelName: "user-path-page",
    onChange: () => {
      void loadPathData();
    },
  });

  return (
    <section className="mx-auto w-full max-w-4xl fade-rise px-4 py-6 sm:px-6 lg:px-8">
      <UserPathTimeline path={pathData.path} modules={pathData.modules} worksheets={pathData.worksheets} />
    </section>
  );
}
