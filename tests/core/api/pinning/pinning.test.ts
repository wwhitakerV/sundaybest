import {
  PLACEHOLDER_BACKUP_PIN,
  PLACEHOLDER_PRIMARY_PIN,
  PIN_CONFIG,
  findPlaceholderPins,
  pinConfigSchema,
  type PinConfig,
} from "@/core/api/pinning/pins";
import {
  PinningError,
  assertPinsUsable,
  initializePinning,
  toPinningOptions,
} from "@/core/api/pinning/pinning";

const mockIsAvailable = jest.fn<boolean, []>();

jest.mock("react-native-ssl-public-key-pinning", () => ({
  isSslPinningAvailable: (): boolean => mockIsAvailable(),
  initializeSslPinning: jest.fn(),
}));

const { initializeSslPinning } = jest.requireMock<{
  initializeSslPinning: jest.Mock;
}>("react-native-ssl-public-key-pinning");

beforeEach(() => {
  mockIsAvailable.mockReturnValue(true);
});

/** A config that looks like a real one: two distinct, correctly-shaped pins. */
const REAL_CONFIG: PinConfig = {
  "api.sundaybest.com": {
    primary: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    backup: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=",
    includeSubdomains: false,
  },
};

describe("pinConfigSchema", () => {
  it("accepts a well-formed config", () => {
    expect(pinConfigSchema.safeParse(REAL_CONFIG).success).toBe(true);
  });

  /**
   * Both pins are mandatory. With one pin, rotating the key bricks every
   * installed copy of the app until users update — so a config missing the
   * backup is rejected rather than accepted as "pinning, but less".
   */
  it("rejects a domain with no backup pin", () => {
    expect(
      pinConfigSchema.safeParse({
        "api.sundaybest.com": { primary: REAL_CONFIG["api.sundaybest.com"]?.primary },
      }).success,
    ).toBe(false);
  });

  it.each([
    ["too short", "AAAA="],
    ["unpadded", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
    ["not base64", "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!="],
    ["a hex digest instead of base64", "a".repeat(64)],
  ])("rejects a %s hash", (_label, primary) => {
    expect(
      pinConfigSchema.safeParse({
        "api.sundaybest.com": { primary, backup: primary, includeSubdomains: false },
      }).success,
    ).toBe(false);
  });
});

describe("the shipped config", () => {
  it("is well-formed, so only the values are placeholders", () => {
    expect(pinConfigSchema.safeParse(PIN_CONFIG).success).toBe(true);
  });

  it("pins the api host the env config points at", () => {
    expect(Object.keys(PIN_CONFIG)).toContain("api.sundaybest.com");
  });

  it("still carries placeholders, which is what the checklist item is for", () => {
    expect(findPlaceholderPins(PIN_CONFIG)).toEqual([
      "api.sundaybest.com.primary",
      "api.sundaybest.com.backup",
    ]);
  });

  it("uses two different placeholders, so a copy-paste of one is visible", () => {
    expect(PLACEHOLDER_PRIMARY_PIN).not.toBe(PLACEHOLDER_BACKUP_PIN);
  });
});

describe("assertPinsUsable", () => {
  /**
   * The whole point of the module. A preview or production build that ships
   * placeholder pins would report pinning as enabled while validating nothing,
   * and nobody would look again. Failing the build is the only honest outcome.
   */
  it.each(["preview", "production"] as const)("throws in %s while pins are placeholders", (v) => {
    expect(() => assertPinsUsable(v, PIN_CONFIG)).toThrow(PinningError);
  });

  it("names the offending pins so the fix is obvious", () => {
    let message = "";
    try {
      assertPinsUsable("production", PIN_CONFIG);
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain("api.sundaybest.com.primary");
    expect(message).toContain("SETUP_CHECKLIST");
  });

  it("accepts real pins in production", () => {
    expect(() => assertPinsUsable("production", REAL_CONFIG)).not.toThrow();
  });

  /**
   * Development is exempt so that local work against a proxy, a self-signed
   * certificate, or a laptop server still functions. It is also the one variant
   * where an attacker on the network path is not the threat being modelled.
   */
  it("allows placeholders in development", () => {
    expect(() => assertPinsUsable("development", PIN_CONFIG)).not.toThrow();
  });

  it("rejects a malformed config even in development", () => {
    // Deliberately the wrong shape, hence the cast: this is what reaches the
    // function when a config is hand-edited and the types were not consulted.
    const malformed = { "api.sundaybest.com": { primary: "nope" } } as unknown as PinConfig;

    expect(() => assertPinsUsable("development", malformed)).toThrow(PinningError);
  });

  it("rejects two identical pins, which is one pin wearing two hats", () => {
    const same = REAL_CONFIG["api.sundaybest.com"]?.primary ?? "";

    expect(() =>
      assertPinsUsable("production", {
        "api.sundaybest.com": { primary: same, backup: same, includeSubdomains: false },
      }),
    ).toThrow(/identical/i);
  });

  it("rejects an empty config in production, which would pin nothing", () => {
    expect(() => assertPinsUsable("production", {})).toThrow(PinningError);
  });
});

describe("toPinningOptions", () => {
  it("flattens each domain to the shape the native module wants", () => {
    expect(toPinningOptions(REAL_CONFIG)).toEqual({
      "api.sundaybest.com": {
        includeSubdomains: false,
        publicKeyHashes: [
          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
          "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=",
        ],
      },
    });
  });

  /**
   * No `expirationDate` is set. The library supports one, and it disables
   * pinning after that date to avoid bricking apps that stopped getting
   * updates — which is a reasonable trade for some apps and not for this one:
   * silently stopping pinning is the failure mode the placeholder check exists
   * to prevent.
   */
  it("does not set an expiry, which would silently switch pinning off", () => {
    expect(toPinningOptions(REAL_CONFIG)["api.sundaybest.com"]).not.toHaveProperty(
      "expirationDate",
    );
  });
});

/**
 * `initializePinning` is the only part of this module that touches the native
 * layer, so these tests cover the decision to call it — not whether TrustKit
 * then rejects a bad certificate. That is on the checklist as a manual test on a
 * preview build, and nothing here should be read as evidence for it.
 */
describe("initializePinning", () => {
  it("does not enable pinning in development, so a local proxy still works", async () => {
    await expect(initializePinning("development", REAL_CONFIG)).resolves.toBe(false);
    expect(initializeSslPinning).not.toHaveBeenCalled();
  });

  it("enables pinning in production and reports that it did", async () => {
    mockIsAvailable.mockReturnValue(true);

    await expect(initializePinning("production", REAL_CONFIG)).resolves.toBe(true);
    expect(initializeSslPinning).toHaveBeenCalledWith(toPinningOptions(REAL_CONFIG));
  });

  /**
   * Expo Go has no native module. Returning false rather than throwing matters:
   * "pinning is off in this environment" is a normal state, and it has to be
   * distinguishable from "pinning is on" by the caller.
   */
  it("reports false when the native module is missing, rather than throwing", async () => {
    mockIsAvailable.mockReturnValue(false);

    await expect(initializePinning("preview", REAL_CONFIG)).resolves.toBe(false);
    expect(initializeSslPinning).not.toHaveBeenCalled();
  });

  it("refuses to start with placeholder pins, before touching the native module", async () => {
    mockIsAvailable.mockReturnValue(true);

    await expect(initializePinning("production", PIN_CONFIG)).rejects.toThrow(PinningError);
    expect(initializeSslPinning).not.toHaveBeenCalled();
  });
});
