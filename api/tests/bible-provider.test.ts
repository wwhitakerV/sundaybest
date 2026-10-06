import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../src/http/errors.js";
import { availableTranslations, createBibleProvider } from "../src/providers/bible-provider.js";
import { testEnv } from "./fixtures/generation.js";

const bible = createBibleProvider(testEnv({}));

test("BSB is served from the bundled text without any network call", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("network must not be used for bundled text"); };
  try {
    const passage = await bible.getPassage({ reference: "John 3:16", translation: "BSB" });
    assert.equal(passage.translation, "BSB");
    assert.equal(passage.cacheAllowed, true);
    assert.deepEqual(passage.verses, [{
      number: 16,
      text: "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life.",
    }]);
  } finally { globalThis.fetch = originalFetch; }
});

test("KJV is served without the brackets that mark translator-supplied words", async () => {
  const passage = await bible.getPassage({ reference: "Psalm 23:1", translation: "KJV" });
  assert.equal(passage.verses[0]!.text, "A Psalm of David. The LORD is my shepherd; I shall not want.");
});

test("a verse the BSB omits is skipped rather than returned blank", async () => {
  const passage = await bible.getPassage({ reference: "Matthew 17:20-22", translation: "BSB" });
  assert.deepEqual(passage.verses.map((verse) => verse.number), [20, 22]);
});

test("a reference that does not exist fails permanently", async () => {
  await assert.rejects(() => bible.getPassage({ reference: "John 3:99", translation: "BSB" }), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.permanent, true);
    return true;
  });
});

test("only BSB and KJV are available without a licensed gateway", async () => {
  assert.deepEqual(availableTranslations(testEnv({})), ["BSB", "KJV"]);
  await assert.rejects(() => bible.getPassage({ reference: "John 3:16", translation: "NIV" }), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.permanent, true);
    return true;
  });
});

test("licensed translations come from the configured gateway", async () => {
  const env = testEnv({ BIBLE_PROVIDER_URL: "https://bible.example.test/passages" });
  assert.deepEqual(availableTranslations(env), ["BSB", "KJV", "NIV", "ESV", "NLT"]);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    reference: "John 3:16", translation: "ESV", provider: "licensed", cacheAllowed: false,
    verses: [{ number: 16, text: "Gateway text" }],
  });
  try {
    const passage = await createBibleProvider(env).getPassage({ reference: "John 3:16", translation: "ESV" });
    assert.equal(passage.provider, "licensed");
  } finally { globalThis.fetch = originalFetch; }
});
