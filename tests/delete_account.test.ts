import { test } from "node:test";
import assert from "node:assert/strict";
import type { RequestEvent } from "@sveltejs/kit";
import { delete_account } from "../src/lib/server/delete_account.ts";

function setup({
  authenticated = true,
  configured = true,
  revoke_error = false,
  delete_error = false,
} = {}) {
  const calls: unknown[][] = [];
  const admin = {
    async signOut(...args: unknown[]) {
      calls.push(["revoke", ...args]);
      return { error: revoke_error ? new Error("private server detail") : null };
    },
    async deleteUser(...args: unknown[]) {
      calls.push(["delete", ...args]);
      return {
        data: { user: null },
        error: delete_error ? new Error("private server detail") : null,
      };
    },
  } as unknown as NonNullable<ReturnType<Parameters<typeof delete_account>[0]>>;
  const action = delete_account(() => {
    calls.push(["admin"]);
    return configured ? admin : null;
  });
  const event = {
    request: new Request("http://localhost/settings?/delete_account", {
      method: "POST",
      body: new URLSearchParams({ user_id: "someone-else" }),
    }),
    locals: {
      safeGetSession: async () => ({
        session: authenticated ? { access_token: "verified-token" } : null,
        user: authenticated ? { id: "verified-user" } : null,
      }),
      supabase: {
        auth: {
          signOut: async (...args: unknown[]) => {
            calls.push(["clear", ...args]);
            return { error: null };
          },
        },
      },
    },
  } as unknown as RequestEvent;
  return { run: () => action(event), calls };
}

test("unauthenticated requests cannot reach account administration", async () => {
  const { run, calls } = setup({ authenticated: false });
  await assert.rejects(run, { status: 303, location: "/signin" });
  assert.deepEqual(calls, []);
});

test("missing server key leaves the account intact", async () => {
  const { run, calls } = setup({ configured: false });
  const result = await run();
  assert.equal(result?.status, 503);
  assert.deepEqual(calls, [["admin"]]);
});

test("deletes only the verified user, revokes sessions, clears local auth, and redirects", async () => {
  const { run, calls } = setup();
  await assert.rejects(run, { status: 303, location: "/" });
  assert.deepEqual(calls, [
    ["admin"],
    ["revoke", "verified-token", "global"],
    ["delete", "verified-user"],
    ["clear", { scope: "local" }],
  ]);
});

test("failed session revocation prevents deletion", async () => {
  const { run, calls } = setup({ revoke_error: true });
  const result = await run();
  assert.equal(result?.status, 500);
  assert.deepEqual(calls, [["admin"], ["revoke", "verified-token", "global"]]);
});

test("deletion failures return a safe error without reporting success", async () => {
  const { run, calls } = setup({ delete_error: true });
  const result = await run();
  assert.equal(result?.status, 500);
  assert.ok(!JSON.stringify(result).includes("private server detail"));
  assert.equal(
    calls.some(([operation]) => operation === "clear"),
    false
  );
});
