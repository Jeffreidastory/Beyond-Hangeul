import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export function subscribeToTables({
  tables = [],
  onChange,
  schema = "public",
  channelName,
  filters = {},
}) {
  if (!Array.isArray(tables) || !tables.length || typeof onChange !== "function") {
    return () => {};
  }

  const supabase = getSupabaseBrowserClient();
  const uniqueTables = Array.from(new Set(tables.filter(Boolean)));
  const normalizedChannelName =
    channelName || `realtime-${uniqueTables.join("-")}-${Date.now()}`;

  const channel = supabase.channel(normalizedChannelName);

  uniqueTables.forEach((table) => {
    const tableFilters = Array.isArray(filters[table]) ? filters[table] : [];
    const query = {
      event: "*",
      schema,
      table,
      ...(tableFilters.length ? { filter: tableFilters } : {}),
    };

    channel.on("postgres_changes", query, onChange);
  });

  channel.subscribe();

  return () => {
    channel.unsubscribe();
    supabase.removeChannel(channel);
  };
}
