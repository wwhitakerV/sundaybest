-- BSB is the default translation: public domain and bundled with the API.
-- NIV, ESV and NLT need a licensed Bible provider, so existing choices of them
-- move to BSB rather than failing in Daily Study.
ALTER TABLE user_settings ALTER COLUMN bible_translation SET DEFAULT 'BSB';
UPDATE user_settings SET bible_translation = 'BSB' WHERE bible_translation IN ('NIV', 'ESV', 'NLT');
