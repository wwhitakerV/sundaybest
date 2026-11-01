import { AppError } from "../../http/errors.js";
import { titleOutputSchema } from "./prompt.js";
import { titleCase } from "./title-case.js";

/** A sermon's title, and the series and part it's from, in the video title's own words. */
export interface SermonTitle {
  title: string;
  series: string | null;
  part: string | null;
}

/** The most each field may be once rebuilt, as the sermon contract holds them. */
const LONGEST = { title: 300, series: 200, part: 60 } as const;

/** Bars, slashes and bullets separate a video title's parts as spaces do. */
const SEPARATORS = /[\s|·•]+/;

/** A word's letters and digits, lower case: how two writings of a word are matched. */
function keyOf(word: string): string {
  return word.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * The title step's answer, made certain: each field is one unbroken stretch
 * of the video's title — its words in its order, none left out from inside
 * and none new — rebuilt from the title's own words and the signs between
 * them (&, commas), without the quotation marks, brackets and bars around it,
 * and in Title Case. A field that isn't such a stretch is rejected.
 */
export function mapTitle(raw: unknown, videoTitle: string): SermonTitle {
  const parsed = titleOutputSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("INTERNAL", "The title came back in the wrong shape");
  const tokens = videoTitle.split(SEPARATORS).filter((token) => token.length > 0);

  const own = (text: string, label: keyof typeof LONGEST): string => {
    const wanted = text.split(SEPARATORS).map(keyOf).filter((key) => key.length > 0);
    if (wanted.length === 0) throw new AppError("INTERNAL", `The ${label} is empty`);
    const stretch = stretchOf(tokens, wanted);
    if (!stretch) throw new AppError("INTERNAL", `The ${label} “${text}” isn't in the video's title, as one stretch of its words`);
    const rebuilt = titleCase(stretch.join(" ").replace(/^[^\p{L}\p{N}]+/u, "").replace(/[^\p{L}\p{N}?!]+$/u, ""));
    // Signs kept between its words can make it longer than the answer was.
    if (rebuilt.length > LONGEST[label]) throw new AppError("INTERNAL", `The ${label} is too long once rebuilt from the video's title`);
    return rebuilt;
  };

  const { title, series, part } = parsed.data;
  return {
    title: own(title, "title"),
    series: series === null ? null : own(series, "series"),
    part: part === null ? null : own(part, "part"),
  };
}

/** The video title's tokens that say `wanted`, word for word and side by side — signs between them kept — or null. */
function stretchOf(tokens: readonly string[], wanted: readonly string[]): string[] | null {
  for (let start = 0; start < tokens.length; start++) {
    if (keyOf(tokens[start]!) !== wanted[0]) continue;
    let matched = 1;
    let at = start + 1;
    while (matched < wanted.length && at < tokens.length) {
      const key = keyOf(tokens[at]!);
      if (key.length > 0) {
        if (key !== wanted[matched]) break;
        matched++;
      }
      at++;
    }
    if (matched === wanted.length) return tokens.slice(start, at);
  }
  return null;
}
