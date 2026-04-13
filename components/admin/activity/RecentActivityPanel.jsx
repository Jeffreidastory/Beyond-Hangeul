export default function RecentActivityPanel({ activities = [] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f1d32] p-5">
      <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
      <p className="mt-1 text-sm text-slate-400">Latest admin and payment events.</p>

      <div className="mt-4 max-h-90 space-y-2 overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 bg-[#13243d] p-3 text-sm text-slate-400">
            No recent activity yet.
          </p>
        ) : (
          activities.map((activity) => (
            <article key={activity.id} className="rounded-xl border border-white/10 bg-[#13243d] p-3">
              <p className="text-sm text-slate-100">{activity.text}</p>
              <p className="mt-1 text-xs text-slate-400">{activity.timeLabel}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
