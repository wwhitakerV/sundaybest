import {
  INTEGRITY_SIGNALS,
  createIntegrityState,
  resolveThreatResponse,
  type IntegritySignal,
} from "@/core/security/integrity/policy";

describe("resolveThreatResponse", () => {
  /**
   * The binary or its runtime has been modified, so anything the app is holding
   * may already be observed. It stops holding it.
   */
  describe("clears the session when the app itself is not trustworthy", () => {
    it.each(["appIntegrity", "hooks", "unofficialStore", "debug"] as const)(
      "%s clears the session",
      (signal) => {
        expect(resolveThreatResponse(signal)).toBe("clear-session");
      },
    );
  });

  /**
   * The device is not trustworthy but the app is intact, so degrade rather than
   * refuse. Locking a jailbroken device out entirely punishes someone who
   * modified their own hardware and is trivially patched out by anyone who
   * actually means harm.
   */
  describe("disables sensitive features when the device is not trustworthy", () => {
    it.each(["privilegedAccess", "simulator"] as const)("%s disables sensitive features", (s) => {
      expect(resolveThreatResponse(s)).toBe("disable-sensitive");
    });
  });

  /**
   * Informational. Acting on these breaks legitimate users — a corporate VPN is
   * not an attack, and neither is a passcode-free phone.
   */
  describe("reports everything else without acting", () => {
    it.each(["passcode", "systemVPN", "deviceBinding", "screenshot", "devMode"] as const)(
      "%s is report-only",
      (signal) => {
        expect(resolveThreatResponse(signal)).toBe("report-only");
      },
    );
  });

  /**
   * The property that keeps this from becoming the outage. freeRASP adds signals
   * between versions; an unrecognised one must not throw inside a callback the
   * SDK invokes, and must not escalate to clearing a session on a guess.
   */
  describe("never throws and never guesses", () => {
    it("degrades an unknown signal to report-only", () => {
      expect(resolveThreatResponse("somethingNewInTheNextRelease" as IntegritySignal)).toBe(
        "report-only",
      );
    });

    it.each([undefined, null, "", 42, {}])("survives %p", (value) => {
      // The signal arrives from a native SDK, so the declared type is a hope.
      const signal = value as IntegritySignal;

      expect(() => resolveThreatResponse(signal)).not.toThrow();
      expect(resolveThreatResponse(signal)).toBe("report-only");
    });
  });

  it("has a response for every signal it claims to know", () => {
    for (const signal of INTEGRITY_SIGNALS) {
      expect(["clear-session", "disable-sensitive", "report-only"]).toContain(
        resolveThreatResponse(signal),
      );
    }
  });
});

describe("createIntegrityState", () => {
  it("starts out trusting the device, because no signal has fired", () => {
    const state = createIntegrityState();

    expect(state.snapshot()).toEqual({
      sensitiveAllowed: true,
      sessionCompromised: false,
      signals: [],
    });
  });

  it("records a signal and the response it produced", () => {
    const state = createIntegrityState();

    expect(state.report("privilegedAccess")).toBe("disable-sensitive");
    expect(state.snapshot()).toEqual({
      sensitiveAllowed: false,
      sessionCompromised: false,
      signals: ["privilegedAccess"],
    });
  });

  it("marks the session compromised on a tampering signal", () => {
    const state = createIntegrityState();

    expect(state.report("hooks")).toBe("clear-session");
    expect(state.snapshot()).toMatchObject({
      sensitiveAllowed: false,
      sessionCompromised: true,
    });
  });

  it("leaves everything allowed after a report-only signal", () => {
    const state = createIntegrityState();

    state.report("systemVPN");

    expect(state.snapshot()).toMatchObject({ sensitiveAllowed: true, sessionCompromised: false });
  });

  /**
   * One-way. A device that reported a jailbreak does not become trustworthy
   * because a later check happened to pass — the attacker controls when checks
   * run, so "it looks fine now" is not evidence.
   */
  it("never becomes trusting again once a signal has fired", () => {
    const state = createIntegrityState();

    state.report("privilegedAccess");
    state.report("systemVPN");

    expect(state.snapshot().sensitiveAllowed).toBe(false);
  });

  it("does not record the same signal twice", () => {
    const state = createIntegrityState();

    state.report("passcode");
    state.report("passcode");

    expect(state.snapshot().signals).toEqual(["passcode"]);
  });

  it("exposes a stable read for the api client to gate on", () => {
    const state = createIntegrityState();

    expect(state.isSensitiveAllowed()).toBe(true);
    state.report("simulator");
    expect(state.isSensitiveAllowed()).toBe(false);
  });

  it("hands back a frozen snapshot, so a caller cannot edit the verdict", () => {
    const state = createIntegrityState();

    expect(Object.isFrozen(state.snapshot())).toBe(true);
  });
});
