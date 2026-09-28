import { Image } from "react-native";

import type { SermonSource } from "@/types/domain";
import BLESSING_THUMBNAIL from "../../../assets/images/mock/today-i-choose-to-be-a-blessing.jpg";
import NEGATIVE_THINKING_THUMBNAIL from "../../../assets/images/mock/break-the-cycle-of-negative-thinking.jpg";
import STILL_PRAYING_THUMBNAIL from "../../../assets/images/mock/still-praying.jpg";
import TEMPTATION_THUMBNAIL from "../../../assets/images/mock/overcome-temptation.jpg";
import CHURCH_AND_WORLD_THUMBNAIL from "../../../assets/images/mock/the-church-must-not-partner-with-the-world.jpg";

// One sermon per image in `assets/images/mock/`, each named, titled, and
// pictured after its file — bundled until the backend sends the video's own
// thumbnail. The churches, links, and transcripts are placeholders. Each
// sermon's colours are worked out from its thumbnail and deepened for white
// type: its main colour, an accent, and a deep anchor.

export const SERMON_BLESSING: SermonSource = {
  id: "sermon-today-i-choose-to-be-a-blessing",
  createdAt: "2026-09-21T19:40:00.000Z",
  updatedAt: "2026-09-21T19:41:30.000Z",
  url: "https://youtube.com/watch?v=Qm81xRz4",
  platform: "youtube",
  title: "Today I Choose to Be a Blessing",
  church: "VOUS Church",
  thumbnailUrl: Image.resolveAssetSource(BLESSING_THUMBNAIL).uri,
  // The grey paper panel's graphite, the cyan band's teal, and the blazer's
  // warm near-black.
  thumbnailColors: ["#3D403F", "#1F5A6E", "#1C1D20"],
  durationSeconds: 2_874,
  publishedOn: "2026-09-20",
  transcriptStatus: "available",
  transcript: [
    { startSeconds: 0, text: "Turn with me to Joshua, chapter twenty-four." },
    {
      startSeconds: 412,
      text: "Joshua doesn't say 'choose someday.' He says choose this day. Today.",
    },
    {
      startSeconds: 1_122,
      text: "Most of us believe grace is free. We just don't live like it.",
    },
    {
      startSeconds: 1_140,
      text: "We keep a quiet ledger, like God is checking the balance every morning.",
    },
    {
      startSeconds: 1_686,
      text: "You can't serve two masters. Something is going to get your yes.",
    },
    {
      startSeconds: 2_310,
      text: "Make every day count. Not by earning it, but by choosing Him in it.",
    },
  ],
};

export const SERMON_NEGATIVE_THINKING: SermonSource = {
  id: "sermon-break-the-cycle-of-negative-thinking",
  createdAt: "2026-08-29T20:15:00.000Z",
  updatedAt: "2026-08-29T20:16:10.000Z",
  url: "https://youtube.com/watch?v=Br3akCyc1e",
  platform: "youtube",
  title: "Break the Cycle of Negative Thinking",
  church: "Grace Street Fellowship",
  thumbnailUrl: Image.resolveAssetSource(NEGATIVE_THINKING_THUMBNAIL).uri,
  // The lettering's warm grey, the teal haze behind it, and the near-black.
  thumbnailColors: ["#47443E", "#444F4F", "#0E0C0A"],
  durationSeconds: 2_406,
  publishedOn: "2026-08-23",
  transcriptStatus: "autoCaptions",
  transcript: [
    { startSeconds: 0, text: "good morning church let's open to first thessalonians five" },
    { startSeconds: 288, text: "paul says give thanks in all circumstances not for all of them" },
    {
      startSeconds: 905,
      text: "gratitude is not a feeling you wait for it's a practice you choose",
    },
    { startSeconds: 1_530, text: "ten were healed and one came back that's the one I want to be" },
  ],
};

export const SERMON_STILL_PRAYING: SermonSource = {
  id: "sermon-still-praying",
  createdAt: "2026-09-20T15:00:00.000Z",
  updatedAt: "2026-09-20T15:01:20.000Z",
  url: "https://youtube.com/watch?v=St1llPr4y",
  platform: "youtube",
  title: "Still Praying",
  church: "Harbor Light Church",
  thumbnailUrl: Image.resolveAssetSource(STILL_PRAYING_THUMBNAIL).uri,
  // The plaster wall's grey, the lamp's warm brown, and the jacket's ink.
  thumbnailColors: ["#48443F", "#654F46", "#111117"],
  durationSeconds: 2_152,
  publishedOn: "2026-09-13",
  transcriptStatus: "available",
  transcript: [
    { startSeconds: 0, text: "Mark chapter four. It's evening, and they're crossing the lake." },
    {
      startSeconds: 640,
      text: "Jesus is asleep in the same boat they think is sinking.",
    },
    {
      startSeconds: 1_310,
      text: "He doesn't promise there won't be water. He promises you won't go through it alone.",
    },
  ],
};

export const SERMON_TEMPTATION: SermonSource = {
  id: "sermon-overcome-temptation",
  createdAt: "2026-09-19T21:10:00.000Z",
  updatedAt: "2026-09-19T21:11:00.000Z",
  url: "https://vimeo.com/881240517",
  platform: "vimeo",
  title: "Overcome Temptation",
  church: "Northside Community Church",
  thumbnailUrl: Image.resolveAssetSource(TEMPTATION_THUMBNAIL).uri,
  // The crowd's navy, the lettering's plum red, and the deep night blue.
  thumbnailColors: ["#232E4C", "#704357", "#0A0A15"],
  durationSeconds: 1_845,
  publishedOn: "2026-09-06",
  transcriptStatus: "available",
  transcript: [
    { startSeconds: 0, text: "Matthew eleven, starting at verse twenty-eight." },
    {
      startSeconds: 734,
      text: "A yoke isn't the absence of work. It's work shared with someone stronger.",
    },
  ],
};

/** The sermon behind the sample plan anyone can try from Welcome or an empty Home. */
export const SERMON_CHURCH_AND_WORLD: SermonSource = {
  id: "sermon-the-church-must-not-partner-with-the-world",
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
  url: "https://youtube.com/watch?v=Ch4rchW0rld",
  platform: "youtube",
  title: "The Church Must Not Partner with the World",
  church: "Riverside Chapel",
  thumbnailUrl: Image.resolveAssetSource(CHURCH_AND_WORLD_THUMBNAIL).uri,
  // The parchment's sepia, a warmer umber, and the skyline's charcoal.
  thumbnailColors: ["#4F4237", "#605143", "#212121"],
  durationSeconds: 2_310,
  publishedOn: "2026-07-26",
  transcriptStatus: "available",
  transcript: [
    { startSeconds: 0, text: "Deuteronomy thirty-one. Moses is handing over, and he knows it." },
    {
      startSeconds: 1_020,
      text: "You might feel alone. You are not left. Those are two different things.",
    },
  ],
};

export const MOCK_SERMONS: readonly SermonSource[] = [
  SERMON_BLESSING,
  SERMON_NEGATIVE_THINKING,
  SERMON_STILL_PRAYING,
  SERMON_TEMPTATION,
  SERMON_CHURCH_AND_WORLD,
];
