const sendMail = jest.fn();

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: jest.fn(() => ({ sendMail })) },
}));

import handler from "../../pages/api/privacy-requests";

const createResponse = () => {
  const response = {
    setHeader: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
};

const validBody = {
  email: "ana@example.com",
  requestType: "delete",
  message: "Please delete my account.",
  company: "",
};

describe("POST /api/privacy-requests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, EMAIL_USER: "mailer@example.com", EMAIL_PASS: "test-password" };
    delete process.env.PRIVACY_REQUEST_EMAIL;
    sendMail.mockReset().mockResolvedValue({ messageId: "message-id" });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("rejects methods other than POST", async () => {
    const response = createResponse();
    await handler({ method: "GET", headers: {}, socket: {} }, response);
    expect(response.setHeader).toHaveBeenCalledWith("Allow", "POST");
    expect(response.status).toHaveBeenCalledWith(405);
  });

  it("rejects malformed data and accepts honeypot traffic without email", async () => {
    const invalidResponse = createResponse();
    await handler({ method: "POST", body: { ...validBody, email: "bad" }, headers: {}, socket: {} }, invalidResponse);
    expect(invalidResponse.status).toHaveBeenCalledWith(400);

    const honeypotResponse = createResponse();
    await handler({ method: "POST", body: { ...validBody, company: "bot" }, headers: {}, socket: {} }, honeypotResponse);
    expect(honeypotResponse.status).toHaveBeenCalledWith(202);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("emails the privacy recipient and sends a confirmation", async () => {
    const response = createResponse();
    await handler({ method: "POST", body: validBody, headers: { "x-forwarded-for": "203.0.113.10" }, socket: {} }, response);
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail.mock.calls[0][0]).toMatchObject({ to: "webdynamicx@gmail.com", replyTo: "ana@example.com" });
    expect(sendMail.mock.calls[1][0]).toMatchObject({ to: "ana@example.com" });
    expect(response.status).toHaveBeenCalledWith(202);
  });
});
