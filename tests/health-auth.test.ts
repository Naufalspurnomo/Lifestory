import { describe, expect, it } from "vitest";
import { isDatabaseHealthCheckAuthorized } from "../lib/health-auth";

describe("database health check authorization", () => {
  it("allows local database probes without an operational token", () => {
    expect(
      isDatabaseHealthCheckAuthorized(new Headers(), {
        NODE_ENV: "development",
      })
    ).toBe(true);
  });

  it("requires a bearer token in production", () => {
    expect(
      isDatabaseHealthCheckAuthorized(new Headers(), {
        NODE_ENV: "production",
        HEALTH_DATABASE_CHECK_TOKEN: "secret",
      })
    ).toBe(false);
  });

  it("accepts the configured production bearer token", () => {
    expect(
      isDatabaseHealthCheckAuthorized(
        new Headers({ Authorization: "Bearer secret" }),
        {
          NODE_ENV: "production",
          HEALTH_DATABASE_CHECK_TOKEN: "secret",
        }
      )
    ).toBe(true);
  });

  it("rejects the wrong production bearer token", () => {
    expect(
      isDatabaseHealthCheckAuthorized(
        new Headers({ Authorization: "Bearer wrong" }),
        {
          NODE_ENV: "production",
          HEALTH_DATABASE_CHECK_TOKEN: "secret",
        }
      )
    ).toBe(false);
  });
});
