"use client";

import { useEffect, useState } from "react";
import UserPathTimeline from "@/components/path/UserPathTimeline";
import { getActiveLearningPath, listModules, listWorksheets } from "@/services/dashboardDataService";

export default function UserPathRoute() {
  const [pathData, setPathData] = useState({ path: null, modules: [], worksheets: [] });

  useEffect(() => {
    const loadData = () => {
      setPathData({
        path: getActiveLearningPath(),
        modules: listModules(),
        worksheets: listWorksheets(),
      });
    };

    loadData();
    const onStorage = () => loadData();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <section className="mx-auto w-full max-w-4xl fade-rise px-4 py-6 sm:px-6 lg:px-8">
      <UserPathTimeline path={pathData.path} modules={pathData.modules} worksheets={pathData.worksheets} />
    </section>
  );
}
