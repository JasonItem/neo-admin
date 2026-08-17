import { describe, expect, it } from "vitest";

import { getUserFacingError, isDuplicateDatabaseError } from "./user-facing-error";

describe("user-facing action errors", () => {
  it("keeps concise business errors", () => {
    expect(getUserFacingError(new Error("组织编码已存在"))).toBe("组织编码已存在");
  });

  it("does not expose SQL, parameters, redirects, or arbitrary runtime messages", () => {
    expect(getUserFacingError(new Error("Failed query: insert into `tenants` values (?) params: secret"))).toBe("操作失败，请稍后重试");
    expect(getUserFacingError(new Error("NEXT_REDIRECT"))).toBe("操作失败，请稍后重试");
    expect(getUserFacingError(new Error("Connection refused"))).toBe("操作失败，请稍后重试");
  });

  it("detects a MySQL duplicate error through the Drizzle cause chain", () => {
    const error = new Error("Failed query", { cause: Object.assign(new Error("Duplicate entry"), { code: "ER_DUP_ENTRY", errno: 1062 }) });
    expect(isDuplicateDatabaseError(error)).toBe(true);
  });
});
