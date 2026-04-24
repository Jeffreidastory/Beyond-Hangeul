import { createBrowserClient } from "@supabase/ssr";

let browserClient;

function isInvalidRefreshTokenMessage(value) {
  const message =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "message" in value
        ? String(value.message || "")
        : "";

  const normalized = message.toLowerCase();

  return (
    normalized.includes("invalid refresh token") ||
    normalized.includes("refresh token not found") ||
    normalized.includes("refresh_token_not_found")
  );
}

function suppressInvalidRefreshTokenConsoleDuringInit(createClient) {
  if (typeof window === "undefined" || typeof console?.error !== "function") {
    return createClient();
  }

  const originalConsoleError = console.error;
  let restored = false;

  const restoreConsoleError = () => {
    if (restored) {
      return;
    }

    console.error = originalConsoleError;
    restored = true;
  };

  console.error = (...args) => {
    if (args.some((arg) => isInvalidRefreshTokenMessage(arg))) {
      return;
    }

    originalConsoleError(...args);
  };

  try {
    const client = createClient();
    const initializePromise = client?.auth?.initializePromise;

    if (initializePromise && typeof initializePromise.finally === "function") {
      void initializePromise.finally(restoreConsoleError);
    } else {
      setTimeout(restoreConsoleError, 0);
    }

    return client;
  } catch (error) {
    restoreConsoleError();
    throw error;
  }
}

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart the dev server."
    );
  }

  browserClient = suppressInvalidRefreshTokenConsoleDuringInit(() =>
    createBrowserClient(url, anonKey)
  );
  return browserClient;
}

function isInvalidRefreshTokenError(error) {
  return isInvalidRefreshTokenMessage(error);
}

async function recoverInvalidBrowserSession(supabase, error) {
  if (!isInvalidRefreshTokenError(error)) {
    throw error;
  }

  await supabase.auth.signOut({ scope: "local" });
}

export async function getSupabaseBrowserSession() {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  } catch (error) {
    await recoverInvalidBrowserSession(supabase, error);
    return null;
  }
}

export async function getSupabaseBrowserUser() {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user;
  } catch (error) {
    await recoverInvalidBrowserSession(supabase, error);
    return null;
  }
}
