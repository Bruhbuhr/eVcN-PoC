import { describe, expect, test, vi } from "vitest";
import { getSupabaseConfigStatus, loginWithEmail, registerWithEmail, signOutUser } from "./auth";

function fakeSupabase(result) {
  return {
    auth: {
      signUp: vi.fn().mockResolvedValue(result),
      signInWithPassword: vi.fn().mockResolvedValue(result),
      signOut: vi.fn().mockResolvedValue(result),
    },
  };
}

describe("Supabase auth helpers", () => {
  test("reports missing config when Supabase env values are absent", () => {
    expect(getSupabaseConfigStatus({})).toEqual({
      isConfigured: false,
      missing: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"],
    });
  });

  test("registers a driver with email, password, name, phone, and role metadata", async () => {
    const client = fakeSupabase({ data: { user: { id: "user-1", email: "rider@evcn.test" } }, error: null });

    const result = await registerWithEmail(client, {
      email: "rider@evcn.test",
      password: "password123",
      fullName: "Minh Rider",
      phone: "0901000000",
      role: "driver",
    });

    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: "rider@evcn.test",
      password: "password123",
      options: {
        data: {
          full_name: "Minh Rider",
          phone: "0901000000",
          role: "driver",
        },
      },
    });
    expect(result.user.email).toBe("rider@evcn.test");
  });

  test("registers a station owner with owner role metadata", async () => {
    const client = fakeSupabase({ data: { user: { id: "owner-1", email: "owner@evcn.test" } }, error: null });

    const result = await registerWithEmail(client, {
      email: "owner@evcn.test",
      password: "password123",
      fullName: "Tuan Owner",
      phone: "0902000000",
      role: "owner",
    });

    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: "owner@evcn.test",
      password: "password123",
      options: {
        data: {
          full_name: "Tuan Owner",
          phone: "0902000000",
          role: "owner",
        },
      },
    });
    expect(result.user.email).toBe("owner@evcn.test");
  });

  test("logs a user in with email and password", async () => {
    const client = fakeSupabase({ data: { user: { id: "user-2", email: "owner@evcn.test" } }, error: null });

    const result = await loginWithEmail(client, {
      email: "owner@evcn.test",
      password: "password123",
    });

    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "owner@evcn.test",
      password: "password123",
    });
    expect(result.user.email).toBe("owner@evcn.test");
  });

  test("throws a readable error when Supabase auth returns an error", async () => {
    const client = fakeSupabase({ data: null, error: { message: "Invalid login credentials" } });

    await expect(loginWithEmail(client, { email: "bad@test.com", password: "wrong" })).rejects.toThrow(
      "Invalid login credentials"
    );
  });

  test("uses a helpful fallback when Supabase auth returns an empty error object", async () => {
    const client = fakeSupabase({ data: null, error: {} });

    await expect(loginWithEmail(client, { email: "driver@evcn.test", password: "Driver123!" })).rejects.toThrow(
      "Authentication failed. Check your Supabase credentials and test account setup."
    );
  });

  test("signs out through Supabase auth", async () => {
    const client = fakeSupabase({ data: {}, error: null });

    await signOutUser(client);

    expect(client.auth.signOut).toHaveBeenCalled();
  });
});
