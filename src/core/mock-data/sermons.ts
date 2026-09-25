import { Image } from "react-native";

import type { SermonSource } from "@/types/domain";
import BLESSING_THUMBNAIL from "../../../assets/images/mock/sermon-today-i-choose-to-be-a-blessing.jpg";

// Most churches are invented for the mocks; the VOUS Church sermon is the
// active plan's, with its real thumbnail bundled until the backend sends it.

export const SERMON_CHOOSE: SermonSource = {
  id: "sermon-choose-whom-you-will-serve",
  createdAt: "2026-09-21T19:40:00.000Z",
  updatedAt: "2026-09-21T19:41:30.000Z",
  url: "https://youtube.com/watch?v=Qm81xRz4",
  platform: "youtube",
  title: "Today I Choose to Be a Blessing",
  church: "VOUS Church",
  // Bundled for now; the backend will send the video's own thumbnail URL.
  thumbnailUrl: Image.resolveAssetSource(BLESSING_THUMBNAIL).uri,
  // From the thumbnail, deepened for white type: the grey paper panel's
  // graphite, the cyan band's teal, and the blazer's warm near-black.
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

export const SERMON_GRATITUDE: SermonSource = {
  id: "sermon-give-thanks",
  createdAt: "2026-08-29T20:15:00.000Z",
  updatedAt: "2026-08-29T20:16:10.000Z",
  url: "https://youtube.com/watch?v=Gt7hanks22",
  platform: "youtube",
  title: "Give Thanks in All Things",
  church: "Grace Street Fellowship",
  thumbnailUrl: "https://i.ytimg.com/vi/Gt7hanks22/hqdefault.jpg",
  thumbnailColors: [],
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

export const SERMON_STORM: SermonSource = {
  id: "sermon-faith-through-the-storm",
  createdAt: "2026-09-20T15:00:00.000Z",
  updatedAt: "2026-09-20T15:01:20.000Z",
  url: "https://youtube.com/watch?v=St0rmF4ith",
  platform: "youtube",
  title: "Faith Through the Storm",
  church: "Harbor Light Church",
  thumbnailUrl: "https://i.ytimg.com/vi/St0rmF4ith/hqdefault.jpg",
  thumbnailColors: [],
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

export const SERMON_REST: SermonSource = {
  id: "sermon-come-to-me-and-rest",
  createdAt: "2026-09-19T21:10:00.000Z",
  updatedAt: "2026-09-19T21:11:00.000Z",
  url: "https://vimeo.com/881240517",
  platform: "vimeo",
  title: "Come to Me and Rest",
  church: "Northside Community Church",
  thumbnailUrl: null,
  thumbnailColors: [],
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

/** Pasted into New Plan just now; the plan is still being set up. */
export const SERMON_SALT: SermonSource = {
  id: "sermon-salt-and-light",
  createdAt: "2026-09-23T12:05:00.000Z",
  updatedAt: "2026-09-23T12:05:40.000Z",
  url: "https://youtube.com/watch?v=S4ltL1ght9",
  platform: "youtube",
  title: "Salt and Light",
  church: "Riverside Chapel",
  thumbnailUrl: "https://i.ytimg.com/vi/S4ltL1ght9/hqdefault.jpg",
  thumbnailColors: [],
  durationSeconds: 2_590,
  publishedOn: "2026-09-20",
  transcriptStatus: "available",
  transcript: [
    { startSeconds: 0, text: "Matthew five, verse thirteen. You are the salt of the earth." },
  ],
};

/** Its plan is being built right now: the transcript is in, the days are being written. */
export const SERMON_NEIGHBOR: SermonSource = {
  id: "sermon-who-is-my-neighbor",
  createdAt: "2026-09-23T12:20:00.000Z",
  updatedAt: "2026-09-23T12:21:00.000Z",
  url: "https://youtube.com/watch?v=N3ighb0rLk",
  platform: "youtube",
  title: "Who Is My Neighbor?",
  church: "Harbor Light Church",
  thumbnailUrl: "https://i.ytimg.com/vi/N3ighb0rLk/hqdefault.jpg",
  thumbnailColors: [],
  durationSeconds: 2_233,
  publishedOn: "2026-09-20",
  transcriptStatus: "available",
  transcript: [
    { startSeconds: 0, text: "Luke ten. A lawyer stands up to test Jesus." },
    {
      startSeconds: 1_204,
      text: "The question isn't who qualifies as my neighbor. It's who I'll be a neighbor to.",
    },
  ],
};

/** The sermon behind the sample plan anyone can try from Welcome or an empty Home. */
export const SERMON_SAMPLE: SermonSource = {
  id: "sermon-god-wont-leave-you",
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
  url: "https://youtube.com/watch?v=S4mpl3Pl4n",
  platform: "youtube",
  title: "God Won't Leave You",
  church: "Harbor Light Church",
  thumbnailUrl: null,
  thumbnailColors: [],
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
  SERMON_CHOOSE,
  SERMON_GRATITUDE,
  SERMON_STORM,
  SERMON_REST,
  SERMON_SALT,
  SERMON_NEIGHBOR,
  SERMON_SAMPLE,
];
