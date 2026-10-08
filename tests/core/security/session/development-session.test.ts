import type { SessionCredentials } from "@/core/api/contracts/attestation";
import { createInMemorySecureStorage } from "@tests/mocks/secure-storage";

import {
  createDevelopmentSessionManager,
  type DevelopmentSessionApi,
} from "@/core/security/session/development-session";

const INSTALLATION_KEY = "development.installationId";

const ISSUED: SessionCredentials = {
  accessToken: "dev-access-1",
  refreshToken: "dev-refresh-1",
  expiresIn: 900,
};

const ADOPTED: SessionCredentials = {
  accessToken: "dev-access-2",
  refreshToken: "dev-refresh-2",
  expiresIn: 900,
};

function setup(options: { now?: () => number; fail?: boolean } = {}) {
  const secureStorage = createInMemorySecureStorage();
  const createDevelopmentSession = jest.fn<
    ReturnType<DevelopmentSessionApi["createDevelopmentSession"]>,
    Parameters<DevelopmentSessionApi["createDevelopmentSession"]>
  >();
  if (options.fail) createDevelopmentSession.mockRejectedValue(new Error("offline"));
  else createDevelopmentSession.mockResolvedValue(ISSUED);

  const session = createDevelopmentSessionManager({
    api: { createDevelopmentSession },
    secureStorage,
    now: options.now ?? (() => 1_000_000),
  });
  return { session, secureStorage, createDevelopmentSession };
}

describe("createDevelopmentSessionManager", () => {
  it("asks for a credential for this install, and serves it", async () => {
    const { session, secureStorage, createDevelopmentSession } = setup();

    await expect(session.getAccessToken()).resolves.toEqual({
      status: "ok",
      accessToken: ISSUED.accessToken,
    });
    const installationId = await secureStorage.get(INSTALLATION_KEY);
    expect(installationId).toEqual(expect.any(String));
    expect(createDevelopmentSession).toHaveBeenCalledWith(
      expect.objectContaining({ installationId }),
    );
  });

  it("serves the credential it has without asking again", async () => {
    const { session, createDevelopmentSession } = setup();
    await session.getAccessToken();

    await session.getAccessToken();

    expect(createDevelopmentSession).toHaveBeenCalledTimes(1);
  });

  it("asks again, as the same install, once the credential is near its end", async () => {
    let now = 1_000_000;
    const { session, createDevelopmentSession } = setup({ now: () => now });
    await session.getAccessToken();

    now += ISSUED.expiresIn * 1000;
    await session.getAccessToken();

    expect(createDevelopmentSession).toHaveBeenCalledTimes(2);
    const [first, second] = createDevelopmentSession.mock.calls;
    expect(second?.[0].installationId).toBe(first?.[0].installationId);
  });

  it("serves credentials it's handed, without asking", async () => {
    const { session, createDevelopmentSession } = setup();

    await session.adopt(ADOPTED);

    await expect(session.getAccessToken()).resolves.toEqual({
      status: "ok",
      accessToken: ADOPTED.accessToken,
    });
    expect(createDevelopmentSession).not.toHaveBeenCalled();
  });

  it("forgets its credential on clear, and asks again", async () => {
    const { session, createDevelopmentSession } = setup();
    await session.getAccessToken();

    await session.clear();
    await session.getAccessToken();

    expect(createDevelopmentSession).toHaveBeenCalledTimes(2);
  });

  it("reports a failed ask as transient, and asks again next time", async () => {
    const { session, createDevelopmentSession } = setup({ fail: true });

    await expect(session.getAccessToken()).resolves.toEqual({
      status: "transient",
      code: "INTERNAL",
    });
    await session.getAccessToken();

    expect(createDevelopmentSession).toHaveBeenCalledTimes(2);
  });
});
