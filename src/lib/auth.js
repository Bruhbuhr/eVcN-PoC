import { createClient } from "@supabase/supabase-js";

const REQUIRED_ENV = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const FALLBACK_AUTH_ERROR = "Authentication failed. Check your Supabase credentials and test account setup.";

export function getSupabaseConfigStatus(env = import.meta.env) {
  const missing = REQUIRED_ENV.filter((key) => !env[key]);
  return {
    isConfigured: missing.length === 0,
    missing,
  };
}

export function createSupabaseBrowserClient(env = import.meta.env) {
  const status = getSupabaseConfigStatus(env);
  if (!status.isConfigured) return null;
  return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
}

function throwIfError(error) {
  if (error) {
    throw new Error(formatAuthError(error));
  }
}

function formatAuthError(error) {
  if (typeof error === "string" && error.trim()) return error;
  if (error?.message && error.message !== "{}") return error.message;
  if (error?.error_description) return error.error_description;
  if (error?.details) return error.details;
  return FALLBACK_AUTH_ERROR;
}

export async function registerWithEmail(client, { email, password, fullName, phone, role = "driver" }) {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role,
      },
    },
  });
  throwIfError(error);
  return data;
}

export async function loginWithEmail(client, { email, password }) {
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  throwIfError(error);
  return data;
}

export async function signOutUser(client) {
  const { error } = await client.auth.signOut();
  throwIfError(error);
}
