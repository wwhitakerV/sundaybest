import "dotenv/config";

import { and, eq } from "drizzle-orm";

import { env } from "../config/env.js";
import { createDatabase } from "./client.js";
import {
  planDays,
  plans,
  prayers,
  quizChoices,
  quizQuestions,
  quizzes,
  reflectionPrompts,
  scriptureReferences,
  scriptureTexts,
  sermonSources,
} from "./schema.js";

const connection = createDatabase(env);
const { db } = connection;

try {
  const externalId = "sampleDev01";
  let sermon = (
    await db
      .select()
      .from(sermonSources)
      .where(and(eq(sermonSources.platform, "youtube"), eq(sermonSources.externalId, externalId)))
      .limit(1)
  )[0];
  if (!sermon) {
    [sermon] = await db
      .insert(sermonSources)
      .values({
        platform: "youtube",
        externalId,
        canonicalUrl: `https://www.youtube.com/watch?v=${externalId}`,
        title: "SundayBest Development Sample",
        churchOrChannel: "SundayBest",
        transcriptStatus: "available",
      })
      .returning();
  }
  if (!sermon) throw new Error("Could not seed sermon");

  let scripture = (
    await db.select().from(scriptureReferences).where(eq(scriptureReferences.canonicalReference, "Psalm 119:105")).limit(1)
  )[0];
  if (!scripture) {
    [scripture] = await db
      .insert(scriptureReferences)
      .values({ book: "Psalms", chapter: 119, verseStart: 105, verseEnd: 105, canonicalReference: "Psalm 119:105" })
      .returning();
  }
  if (!scripture) throw new Error("Could not seed Scripture reference");
  await db
    .insert(scriptureTexts)
    .values({
      referenceId: scripture.id,
      translation: "KJV",
      verses: [{ number: 105, text: "Thy word is a lamp unto my feet, and a light unto my path." }],
      provider: "development-public-domain",
    })
    .onConflictDoNothing();

  let plan = (
    await db.select().from(plans).where(and(eq(plans.visibility, "sample"), eq(plans.title, "SundayBest Development Sample"))).limit(1)
  )[0];
  if (!plan) {
    [plan] = await db
      .insert(plans)
      .values({
        sermonId: sermon.id,
        title: "SundayBest Development Sample",
        visibility: "sample",
        lengthDays: 3,
        quickCheckEnabled: true,
        readyAt: new Date(),
      })
      .returning();
  }
  if (!plan) throw new Error("Could not seed sample plan");

  const existingDays = await db.select({ id: planDays.id }).from(planDays).where(eq(planDays.planId, plan.id));
  if (existingDays.length === 0) {
    for (let dayNumber = 1; dayNumber <= 3; dayNumber += 1) {
      const [day] = await db
        .insert(planDays)
        .values({
          planId: plan.id,
          dayNumber,
          readingTitle: `Development Day ${dayNumber}`,
          readingParagraphs: [
            {
              heading: "A Sample Day",
              content:
                "This sample exists to exercise the real API data flow. It is not production sermon-generated study content.",
            },
          ],
          scriptureReferenceId: scripture.id,
        })
        .returning();
      if (!day) throw new Error("Could not seed plan day");
      await db.insert(reflectionPrompts).values({
        planDayId: day.id,
        position: 1,
        question: "What is one concrete response you can make to God's Word today?",
      });
      await db.insert(prayers).values({
        planDayId: day.id,
        title: "Prayer",
        text: "Lord, help me respond faithfully to Your Word today. Amen.",
      });
      const [quiz] = await db.insert(quizzes).values({ planId: plan.id, planDayId: day.id, title: `Day ${dayNumber} Quick Check` }).returning();
      if (!quiz) throw new Error("Could not seed quiz");
      const [question] = await db
        .insert(quizQuestions)
        .values({
          quizId: quiz.id,
          position: 1,
          kind: "multipleChoice",
          source: "scripture",
          prompt: "Which Scripture is attached to this development sample?",
          scriptureReference: "Psalm 119:105",
          explanation: "The development seed uses Psalm 119:105 to exercise the Scripture and quiz flows.",
        })
        .returning();
      if (!question) throw new Error("Could not seed quiz question");
      await db.insert(quizChoices).values([
        { questionId: question.id, position: 1, label: "A", text: "Psalm 119:105", isCorrect: true },
        { questionId: question.id, position: 2, label: "B", text: "Genesis 1:1", isCorrect: false },
      ]);
    }
  }

  process.stdout.write("SundayBest development sample seeded. For the seed plan, set the development user's Bible translation to KJV.\n");
} finally {
  await connection.close();
}
