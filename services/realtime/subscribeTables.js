import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export function subscribeToTables({
  tables = [],
  onChange,
  schema = "public",
  channelName,
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
    channel.on(
      "postgres_changes",
      { event: "*", schema, table },
      onChange
    );
  });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
