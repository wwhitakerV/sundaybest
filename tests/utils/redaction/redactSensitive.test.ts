import { redactSensitive } from "@/utils/redaction/redactSensitive";

describe("redactSensitive", () => {
  describe("emails", () => {
    it("masks an email in a sentence", () => {
      expect(redactSensitive("contact walt.whitakerv@gmail.com today")).toBe(
        "contact [redacted:email] today",
      );
    });

    it("masks every email, not just the first", () => {
      expect(redactSensitive("a@b.co and c.d@e.org")).toBe("[redacted:email] and [redacted:email]");
    });

    it("masks emails with plus addressing and subdomains", () => {
      expect(redactSensitive("x+tag@mail.example.co.uk")).toBe("[redacted:email]");
    });
  });

  describe("phone numbers", () => {
    it("masks a US number with punctuation", () => {
      expect(redactSensitive("call +1 (555) 123-4567 now")).toBe("call [redacted:phone] now");
    });

    it("masks a plain dashed number", () => {
      expect(redactSensitive("555-123-4567")).toBe("[redacted:phone]");
    });

    it("masks an international number with spaces", () => {
      expect(redactSensitive("+44 20 7946 0958")).toBe("[redacted:phone]");
    });
  });

  describe("bearer tokens", () => {
    it("masks the credential but keeps the scheme readable", () => {
      expect(redactSensitive("Authorization: Bearer abc123DEF456ghi789")).toBe(
        "Authorization: Bearer [redacted:token]",
      );
    });

    it("is case-insensitive about the scheme", () => {
      expect(redactSensitive("bearer 0123456789abcdefFAKE")).toBe("bearer [redacted:token]");
    });
  });

  describe("JWTs", () => {
    it("masks a three-segment JWT anywhere in the string", () => {
      // Three base64url segments, which is all the rule matches — deliberately
      // not a decodable JWT, so nothing here can trip a secret scanner.
      const jwt = "FAKE-HEADER-SEGMENT.FAKE-PAYLOAD-SEGMENT.FAKE-SIGNATURE-SEGMENT";
      expect(redactSensitive(`token=${jwt}&x=1`)).toBe("token=[redacted:jwt]&x=1");
    });
  });

  describe("long hex and base64", () => {
    it("masks a sha256-length hex digest", () => {
      expect(
        redactSensitive("sha=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
      ).toBe("sha=[redacted:hex]");
    });

    it("masks a long base64 blob", () => {
      expect(
        redactSensitive("blob:TWFuIGlzIGRpc3Rpbmd1aXNoZWQsIG5vdCBvbmx5IGJ5IGhpcyByZWFzb24="),
      ).toBe("blob:[redacted:base64]");
    });

    it("leaves short hex-looking words alone", () => {
      expect(redactSensitive("the cafe served beef")).toBe("the cafe served beef");
    });
  });

  describe("safety properties", () => {
    it("leaves ordinary prose untouched", () => {
      const prose = "Day 3 of 6 took about 9 minutes to read.";
      expect(redactSensitive(prose)).toBe(prose);
    });

    it("returns an empty string unchanged", () => {
      expect(redactSensitive("")).toBe("");
    });

    it("is idempotent, so re-redacting a log line is safe", () => {
      const once = redactSensitive("mail a@b.co and call 555-123-4567");
      expect(redactSensitive(once)).toBe(once);
    });

    it("leaves a short run of spaced digits alone", () => {
      // Matches the loose phone pattern but has too few digits to be a number.
      expect(redactSensitive("1 2 3 4")).toBe("1 2 3 4");
    });

    it("leaves an over-long digit run alone", () => {
      // 20 digits: an order id or an account reference, not a phone number.
      expect(redactSensitive("ref 12345678901234567890")).toBe("ref 12345678901234567890");
    });

    it("redacts several kinds at once", () => {
      expect(redactSensitive("a@b.co / Bearer tok_abcdef123456 / 555-123-4567")).toBe(
        "[redacted:email] / Bearer [redacted:token] / [redacted:phone]",
      );
    });
  });
});
