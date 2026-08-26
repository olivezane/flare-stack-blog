import { SELF } from "cloudflare:test";
import { testRequest } from "tests/test-utils";
import { describe, expect, it } from "vitest";
import { app } from "@/lib/hono/routes";

describe("Auth Integration", () => {
  describe("GitHub social sign-in", () => {
    it("returns a GitHub redirect URL instead of 500", async () => {
      const res = await testRequest(app, "/api/auth/sign-in/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "github",
          callbackURL: "/admin",
          errorCallbackURL: "/login",
        }),
      });

      const body = (await res.json()) as { redirect?: boolean; url?: string };
      expect(res.status).toBe(200);
      expect(body.redirect).toBe(true);
      expect(body.url).toContain("github.com/login/oauth/authorize");
    });

    it("works through the full worker entry (OAuthProvider wrapper)", async () => {
      const res = await SELF.fetch("http://example.com/api/auth/sign-in/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "github",
          callbackURL: "/admin",
          errorCallbackURL: "/login",
        }),
      });

      const body = (await res.json()) as { redirect?: boolean; url?: string };
      expect(res.status).toBe(200);
      expect(body.redirect).toBe(true);
      expect(body.url).toContain("github.com/login/oauth/authorize");
    });
  });
});
