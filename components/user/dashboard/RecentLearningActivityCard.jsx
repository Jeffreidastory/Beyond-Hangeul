export default function RecentLearningActivityCard({ activities = [], isLight }) {
  return (
    <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#13243d]"}`}>
      <h2 className="text-lg font-semibold">Recent Learning Activity</h2>
      <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
        Your latest study actions and progress updates.
      </p>

      <ul className="mt-3 space-y-2">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <li key={activity.id} className={`rounded-lg border px-3 py-2 text-sm ${isLight ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-[#0f1d32] text-slate-300"}`}>
              {activity.label}
            </li>
          ))
        ) : (
          <li className={`rounded-lg border px-3 py-2 text-sm ${isLight ? "border-slate-200 bg-white text-slate-500" : "border-white/10 bg-[#0f1d32] text-slate-400"}`}>
            No recent activity yet.
          </li>
        )}
      </ul>
    </section>
  );
}
