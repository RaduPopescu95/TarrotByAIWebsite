import {
  createPrivacyRequestRateLimiter,
  validatePrivacyRequest,
} from "../privacyRequest";

describe("validatePrivacyRequest", () => {
  it("accepts a complete account deletion request", () => {
    expect(validatePrivacyRequest({ email: "ana@example.com", requestType: "delete", message: "Please delete my account.", company: "" })).toEqual({ ok: true, value: { email: "ana@example.com", requestType: "delete", message: "Please delete my account." } });
  });

  it("rejects invalid fields and consumes honeypot submissions", () => {
    expect(validatePrivacyRequest({ email: "invalid", requestType: "delete" })).toMatchObject({ ok: false, code: "email" });
    expect(validatePrivacyRequest({ email: "ana@example.com", requestType: "other" })).toMatchObject({ ok: false, code: "requestType" });
    expect(validatePrivacyRequest({ email: "ana@example.com", requestType: "access", company: "bot" })).toMatchObject({ ok: false, code: "honeypot" });
  });
});

describe("createPrivacyRequestRateLimiter", () => {
  it("limits a client and accepts requests again after the window", () => {
    let currentTime = 0;
    const allow = createPrivacyRequestRateLimiter({ maxRequests: 2, windowMs: 1000, now: () => currentTime });
    expect(allow("127.0.0.1")).toBe(true);
    expect(allow("127.0.0.1")).toBe(true);
    expect(allow("127.0.0.1")).toBe(false);
    currentTime = 1001;
    expect(allow("127.0.0.1")).toBe(true);
  });
});
