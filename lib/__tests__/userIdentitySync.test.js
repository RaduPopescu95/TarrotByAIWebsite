import { buildUserIdentityPatch, extractBillingIdentity } from "../userIdentitySync";

describe("userIdentitySync", () => {
  it("fills missing email and names from billing + auth sources", () => {
    const existing = {
      premiumBillingProfile: {
        billing: {
          email: "test@example.com",
          firstName: "Andreea",
          lastName: "Leru",
        },
      },
    };
    const { patch, updatedFields } = buildUserIdentityPatch(existing, {
      uid: "uid123",
      authEmail: "auth@example.com",
    });
    expect(patch).toEqual({
      owner_uid: "uid123",
      email: "auth@example.com",
      first_name: "Andreea",
      last_name: "Leru",
    });
    expect(updatedFields).toEqual(["owner_uid", "email", "first_name", "last_name"]);
  });

  it("does not overwrite existing identity fields", () => {
    const existing = {
      owner_uid: "uid123",
      email: "keep@example.com",
      first_name: "Existing",
      last_name: "User",
    };
    const { patch } = buildUserIdentityPatch(existing, {
      uid: "uid123",
      email: "new@example.com",
      firstName: "New",
      lastName: "Name",
    });
    expect(patch).toEqual({});
  });

  it("reads flat billing identity fields", () => {
    expect(
      extractBillingIdentity({
        premiumBillingProfile: {
          billing: {
            email: "a@b.com",
            firstName: "A",
            lastName: "B",
          },
        },
      }),
    ).toMatchObject({
      email: "a@b.com",
      firstName: "A",
      lastName: "B",
    });
  });
});
