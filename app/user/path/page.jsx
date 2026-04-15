"use client";

import { useEffect, useState } from "react";
import UserPathTimeline from "@/components/path/UserPathTimeline";
import {
  getActiveLearningPathShared,
  listModulesShared,
  listWorksheetsShared,
} from "@/services/dashboardDataService";
import { useRealtimeTables } from "@/services/realtime/useRealtimeTables";

export default function UserPathRoute() {
  const [pathData, setPathData] = useState({ path: null, modules: [], worksheets: [] });

  const loadPathData = async () => {
    try {
      const [path, modules, worksheets] = await Promise.all([
        getActiveLearningPathShared(),
        listModulesShared(),
        listWorksheetsShared(),
      ]);
      setPathData({ path, modules, worksheets });
    } catch {
      setPathData({ path: null, modules: [], worksheets: [] });
    }
  };

  useEffect(() => {
    void loadPathData();
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
