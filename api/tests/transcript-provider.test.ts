import assert from 'node:assert/strict';
import test from 'node:test';
import { createTranscriptProvider } from '../src/providers/transcript-provider.js';
import { generationInput, testEnv } from './fixtures/generation.js';

test('Supadata missing captions returns TRANSCRIPT_UNAVAILABLE', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: 'transcript-unavailable', message: 'No transcript' }, { status: 404 });
  try {
    await assert.rejects(() => createTranscriptProvider(testEnv({ SUPADATA_API_KEY: 'test' })).fetch(generationInput().sermon), (error: unknown) => {
      assert.equal((error as { code: string }).code, 'TRANSCRIPT_UNAVAILABLE'); return true;
    });
  } finally { globalThis.fetch = originalFetch; }
});

test('Supadata polls queued jobs and accepts flat completed timestamp chunks', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) return Response.json({ jobId: 'job' }, { status: 202 });
    if (calls === 2) return Response.json({ status: 'active' });
    return Response.json({ status: 'completed', lang: 'en', content: [{ text: 'Captions', offset: 1234.4, duration: 987.6 }] });
  };
  try {
    const transcript = await createTranscriptProvider(testEnv({ SUPADATA_API_KEY: 'test', SUPADATA_TRANSCRIPT_POLL_MS: '500' })).fetch(generationInput().sermon);
    assert.equal(calls, 3);
    assert.deepEqual(transcript.segments, [{ text: 'Captions', startMs: 1234, endMs: 2222 }]);
  } finally { globalThis.fetch = originalFetch; }
});

test('Supadata failed jobs and empty captions are rejected', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async () => ++calls === 1 ? Response.json({ jobId: 'job' }) : Response.json({ status: 'failed', error: { message: 'Failed' } });
    const provider = createTranscriptProvider(testEnv({ SUPADATA_API_KEY: 'test', SUPADATA_TRANSCRIPT_POLL_MS: '500' }));
    await assert.rejects(() => provider.fetch(generationInput().sermon));
    globalThis.fetch = async () => Response.json({ lang: 'en', content: [] });
    await assert.rejects(() => provider.fetch(generationInput().sermon));
  } finally { globalThis.fetch = originalFetch; }
});

test('Plain text transcript response retains content without fabricated timing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ lang: 'en', content: ' Transcript text ' });
  try {
    const transcript = await createTranscriptProvider(testEnv({ SUPADATA_API_KEY: 'test' })).fetch(generationInput().sermon);
    assert.deepEqual(transcript.segments, [{ startMs: 0, endMs: null, text: 'Transcript text' }]);
  } finally { globalThis.fetch = originalFetch; }
});
