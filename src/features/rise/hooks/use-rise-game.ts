import { useEffect, useMemo, useRef, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS, useFrameCallback, useSharedValue } from "react-native-reanimated";

import { hasDevMenu } from "@/core/dev-menu/dev-menu";
import { logger } from "@/core/monitoring/logger";
import { tapFeedback } from "@/core/haptics/haptics";
import { useGameResults } from "@/core/storage/game-result-queries";
import {
  RISE_PRACTICE,
  formatRiseDay,
  advanceRise,
  beginStroke,
  endStroke,
  moveStroke,
  newRiseGame,
  replayRise,
  riseDayNumber,
  riseQuestions,
  riseStage,
  startRise,
  type RiseGame,
} from "@/entities/rise";
import { describeRise } from "../logic/describe-rise";
import { makeRiseRun, readRiseRun, scoreOf, spareMs, type RiseRun } from "../logic/rise-run";
import { useRiseReactions, type BoardMarks } from "./use-rise-reactions";
import { useRiseShare } from "./use-rise-share";

type Size = { width: number; height: number };

/**
 * The board failed on the UI thread: said, not thrown. An error thrown there
 * can't be caught by React, and aborts the app — so each way in catches its
 * own, stops the board, and reports where and what.
 */
function reportBoardError(where: string, message: string) {
  logger.error("RISE: the board failed", { where, message });
}

/**
 * Today's RISE, played: the same six for everyone, today being the UTC day.
 * Laid out, the board's built — with the practice pair first, the first time
 * ever — and waits for Start. Each balloon is crossed out by painting across
 * it, on the UI thread (`beginStroke`…). Over, the run is kept on the phone,
 * once a day, and the screen tells how it went and what it taught. A day
 * already played is played again from its marks, to the board it left.
 */
export function useRiseGame() {
  const [day] = useState(() => riseDayNumber(Date.now()));
  const questions = useMemo(() => riseQuestions(day), [day]);
  const { results, record, forget } = useGameResults("rise");
  const played = results?.find((result) => result.daily === day) ?? null;
  const [size, setSize] = useState<Size | null>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState<RiseRun | null>(null);
  const [pairIndex, setPairIndex] = useState(-1);
  const [round, setRound] = useState(0);
  const game = useSharedValue<RiseGame>(newRiseGame(riseStage(1, 1), []));
  const broken = useSharedValue(false);
  const built = useRef<string | null>(null);
  const practice = !played && !finished && results?.length === 0;
  const run = finished ?? (played ? readRiseRun(played.detail) : null);
  const phase =
    size === null || results === undefined
      ? "loading"
      : played || finished
        ? "over"
        : started
          ? "play"
          : "ready";

  // The board is built for its size, once a day's results are known: today's six, or today's run replayed.
  useEffect(() => {
    if (size === null || results === undefined) return;
    const key = `${size.width}x${size.height}:${day}:${round}`;
    if (built.current === key) return;
    built.current = key;
    const stage = riseStage(size.width, size.height);
    const specs = questions.map(({ question, answers, right }) => ({ question, answers, right }));
    const kept = played ? readRiseRun(played.detail) : null;
    game.set(
      played
        ? replayRise(newRiseGame(stage, specs), kept?.questions ?? [])
        : newRiseGame(stage, specs, results.length === 0 ? RISE_PRACTICE : null),
    );
  }, [size, results, day, round, questions, played, game]);

  const loop = useFrameCallback((frame) => {
    if (broken.get()) return;
    try {
      game.modify((value) => {
        "worklet";
        advanceRise(value, frame.timeSincePreviousFrame ?? 0);
        return value;
      });
    } catch (error) {
      broken.set(true);
      runOnJS(reportBoardError)("step", String(error));
    }
  }, false);
  useEffect(() => {
    loop.setActive(phase === "play" || phase === "over");
  }, [phase, loop]);

  function onOver(marks: BoardMarks) {
    const done = makeRiseRun(questions, marks);
    setFinished(done);
    record({
      daily: day,
      saved: scoreOf(done),
      survivedMs: spareMs(done),
      detail: JSON.stringify(done),
    });
  }
  useRiseReactions(game, setPairIndex, onOver, reportBoardError);

  const paint = Gesture.Pan()
    .enabled(phase === "play")
    .minDistance(0)
    .onBegin((event) => {
      try {
        game.modify((value) => {
          "worklet";
          beginStroke(value, event.x, event.y);
          return value;
        });
      } catch (error) {
        runOnJS(reportBoardError)("begin", String(error));
      }
    })
    .onUpdate((event) => {
      try {
        game.modify((value) => {
          "worklet";
          moveStroke(value, event.x, event.y);
          return value;
        });
      } catch (error) {
        runOnJS(reportBoardError)("move", String(error));
      }
    })
    .onFinalize(() => {
      try {
        game.modify((value) => {
          "worklet";
          endStroke(value);
          return value;
        });
      } catch (error) {
        runOnJS(reportBoardError)("end", String(error));
      }
    });

  const inPractice = practice && pairIndex === 0;
  const askedIndex = pairIndex - (practice ? 1 : 0);
  // Between pairs (-1), nothing's being asked: never `at(-1)`, which is the last question.
  const asked = inPractice || askedIndex < 0 ? null : questions.at(askedIndex);
  const result = run ? describeRise(run, questions, day) : null;
  const sharing = useRiseShare(game, result);

  return {
    day: formatRiseDay(day),
    game,
    reportBoardError,
    paint,
    phase,
    stage: size ? riseStage(size.width, size.height) : null,
    onLayout: (next: Size) => setSize(next),
    /** The question rising now, and where it is in the day. */
    question:
      phase === "play" ? (inPractice ? RISE_PRACTICE.question : (asked?.question ?? null)) : null,
    progress: inPractice
      ? "PRACTICE"
      : asked
        ? `${questions.indexOf(asked) + 1} OF ${questions.length}`
        : null,
    practice,
    result,
    start: () => {
      tapFeedback();
      game.modify((value) => {
        "worklet";
        startRise(value);
        return value;
      });
      setStarted(true);
    },
    /** Share: the sheet of posters, and sending one on. */
    sharing,
    /** Development builds only: forgets today's run, and sets today's six up again. */
    restart: hasDevMenu()
      ? async () => {
          await forget(day);
          setStarted(false);
          setFinished(null);
          setPairIndex(-1);
          setRound((current) => current + 1);
        }
      : null,
  };
}
