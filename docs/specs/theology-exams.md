# Spec: Theology Exams (THEO-01-01)

- **Status:** Draft
- **Owner:** @wwhitakerv
- **Date:** 2026-09-28

> Content authority: `SundayBest THEO-01-01 v2 2026-09-28.json` (schema v2,
> exam version 4). Design and behavior authority: the "THEO-01-01
> implementation prompt (schema v2)". Where this spec and the JSON disagree
> about content, the JSON wins.
>
> Field paths are written in full: `exam.…` for fields of the whole exam,
> `questions[].…` for fields of each question. Inside a criterion about one
> question, `interaction.…` and `teaching.…` are that question's.

## Problem

Fun's **Theology Exams** tile opens a "Coming soon" page. There is no way to
take an exam, learn from one, or see how you did.

The first exam, _The Scriptures Received_ (Foundations, 15 questions), is
authored and ready. Without this feature it sits unused, and the Fun tab keeps
promising something it does not deliver.

## User stories

- As a learner, I want to take a scored exam on a passage-grounded topic so
  that I can see how well I know what the texts actually say.
- As a learner, I want a study mode that teaches me after each answer so that
  I can learn the material before being scored.
- As a learner, I want to see why an answer is right, with the passages to
  read, so that a wrong answer becomes a teachable moment.
- As a learner, I want my results broken down by concept, without being told
  I'm strong or weak on too little evidence.

## Decisions already made (2026-09-28)

| Topic           | Decision                                                                                                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Answer keys     | Bundled in the app in every build and graded on the device. There is no backend yet. Grading goes through one seam a trusted service can replace later (ADR 0013).                                                                                 |
| Entry point     | The Fun tab's Theology Exams tile opens this exam in place of its "Coming soon" page. The other Fun destinations keep theirs.                                                                                                                      |
| Incorrect state | Monochrome: an ink ✕ and the word "Incorrect". Never red — a wrong answer is a teachable moment. Correct keeps the existing green with ✓ and "Correct answer".                                                                                     |
| Selected state  | SundayBest red (`accent`) marks what is selected or active, and nothing else.                                                                                                                                                                      |
| Concept labels  | Fewer than 3 independent scored observations of a concept: **Not enough evidence**. 3 or more at 80% correct or better: **Strength**. 3 or more below 80%: **Needs review**. Only Exam Mode first attempts are independent scored observations.    |
| Practice        | After any attempt that revealed answers — a submitted Exam Mode attempt, or a Study Mode attempt with at least one checked answer — every later Exam Mode attempt at the same exam is **Practice**: raw score and explanations, no concept labels. |
| Review queue    | Every missed primary concept goes to review, whatever its label.                                                                                                                                                                                   |
| Passage links   | Open in an in-app Safari sheet (`expo-web-browser`), so the exam stays in the foreground. Needs one new development build.                                                                                                                         |
| Design source   | The brief's Design direction. Not the Quick Check format.                                                                                                                                                                                          |
| Catalog         | None yet. One exam, so the tile opens it directly. A catalog comes with the second exam.                                                                                                                                                           |

## Acceptance criteria

### Entry

1. **The tile opens the exam**
   - **Given** the Fun tab
   - **When** the user taps the Theology Exams tile
   - **Then** the overview of _The Scriptures Received_ appears, not "Coming soon"

2. **Other destinations are unchanged**
   - **Given** the Fun tab
   - **When** the user taps any other game, "See all", or Challenge friends
   - **Then** its "Coming soon" page appears as before

### Content validation

3. **The supplied exam loads**
   - **Given** the bundled THEO-01-01 v2 JSON
   - **When** it is loaded
   - **Then** it yields 15 questions in `exam.questionIds` order, with 8 single choice, 2 true/false, 1 matching, 2 multiple select, and 2 ordering

4. **Content fails closed**
   - **Given** exam content where any of these is wrong: a question ID missing from or out of order with `exam.questionIds`, `exam.questionCount` or `exam.interactionAllocation` not matching `questions`, a `questions[].examId` other than `exam.id`, a duplicate ID, a `questions[].interaction.answerKey` naming a choice, prompt, target, or step that does not exist, a matching key that does not pair every prompt with a distinct target, an ordering key that is not a permutation of the steps, a `questions[].interaction.choices[]` entry without a `rationale`, a missing `questions[].teaching.matchFeedback` or `questions[].teaching.stepFeedback` entry for any prompt or step, a missing `questions[].whyCorrect` or `questions[].teaching` field, a `questions[].interaction.scoring` that disagrees with `exam.experience.grading`, an unknown `questions[].interaction.kind`, a `questions[].passageRefs` entry with no matching `questions[].sources[]` link, a link that is not `https://www.biblegateway.com/…`, or `exam.experience.results.bands` not descending to 0
   - **When** it is loaded
   - **Then** the overview shows an internal content error naming the failing field paths (never their values), and offers no way to start

5. **The question screen never receives a key**
   - **Given** the loaded exam
   - **When** the items for the question screen are produced
   - **Then** none carries `questions[].interaction.answerKey`, any `questions[].interaction.choices[].rationale`, `questions[].whyCorrect`, or `questions[].teaching` (and so no `matchFeedback` or `stepFeedback`)

### Overview

6. **The overview describes the exam**
   - **Given** the overview
   - **Then** it shows `exam.domain`, `exam.level`, `exam.title`, "15 questions" (`exam.questionCount`), "8–12 min" (`exam.durationMinutes`), what the learner will do (`exam.objectives`), the areas covered (`exam.concepts`), the source scope with a link per passage (`exam.sourceScope.scriptureLinks`), and a note that the score measures performance on these questions — not spiritual standing, and not a credential

7. **The modes are explained before starting**
   - **Given** the overview
   - **Then** Exam Mode and Study Mode are offered with their descriptions from `exam.completionBehavior.examMode` and `exam.completionBehavior.studyMode`, Exam Mode is selected, and Start begins an attempt in the selected mode

8. **An open attempt resumes**
   - **Given** an attempt left before it was finished
   - **When** the overview opens
   - **Then** it offers Resume, which returns to the first unanswered question with every earlier response kept, and no second attempt can be open at once

### Every question

9. **One question at a time, in context**
   - **Given** an attempt in either mode
   - **Then** the screen shows "Question N of 15", the instruction for its kind, the stem (`questions[].stem`), and a link for each `questions[].passageRefs` entry (its URL from `questions[].sources[]`) directly beneath the stem

10. **The control matches the kind**
    - **Given** a question
    - **Then** single choice and true/false show one-answer rows; multiple select shows several-answer rows with the instruction "Select all that apply" and never a count; matching shows each prompt with its own choice of target, and a target already paired shows which prompt it is used for; ordering shows the steps to number in order

11. **Ordering numbers steps in the order tapped**
    - **Given** an ordering question
    - **When** the user taps steps
    - **Then** each tapped step takes the next number; tapping a numbered step removes it and renumbers the rest; "Clear order" removes every number; the response is complete only when every step is numbered

12. **Matching uses each target once**
    - **Given** a matching question
    - **When** the user picks a target for a prompt
    - **Then** that prompt shows it, and picking another replaces it; if the target was already paired with another prompt, it moves to this prompt and the other prompt becomes unanswered (never swapped), and VoiceOver announces the move; no target is ever paired with two prompts — a response that would pair one twice is refused by the store, not only prevented by the control; and the response is complete only when every prompt has its own target

13. **Moving between questions keeps responses**
    - **Given** responses to several questions
    - **When** the user goes previous and next
    - **Then** every response is shown as it was left

14. **Grading ignores display order**
    - **Given** the same content with choices, targets, or steps in a different order
    - **When** the same IDs are chosen
    - **Then** the outcome is the same

### Exam Mode

15. **No correctness before submitting**
    - **Given** an Exam Mode attempt
    - **When** the user answers any question
    - **Then** the response saves ("Answer saved") and nothing shows whether it is correct: no verdict, rationale, `questions[].whyCorrect`, or teaching

16. **Progress counts answered questions**
    - **Given** an Exam Mode attempt
    - **Then** the screen shows how many of the 15 are answered, counting only complete responses

17. **Review before submitting**
    - **Given** the last question
    - **When** the user moves on
    - **Then** a review lists every question as answered or unanswered, and tapping one returns to it

18. **Submitting needs confirmation**
    - **Given** the review
    - **When** the user taps Submit exam
    - **Then** a confirmation names each unanswered or incomplete question and says it will count as incorrect; Submit now submits, Keep working returns to the review

19. **Unanswered scores as incorrect**
    - **Given** an attempt submitted with unanswered or incomplete questions
    - **Then** each of them is scored incorrect

20. **A submitted attempt is final**
    - **Given** a submitted attempt
    - **When** anything tries to change a response or submit again
    - **Then** nothing changes

### Study Mode

21. **Check needs a complete response**
    - **Given** a Study Mode question
    - **Then** Check answer is disabled until the response is complete

22. **Checking reveals the answer**
    - **Given** a complete Study Mode response
    - **When** the user taps Check answer
    - **Then** the response locks, and the screen shows ✓ "Correct" or ✕ "Incorrect", `questions[].whyCorrect`, and "Understand why" (label from `exam.experience.teaching.actionLabel`)

23. **Choice feedback**
    - **Given** a checked single choice or true/false question
    - **Then** the correct choice is marked "Correct answer", a wrong pick is marked "Your answer · Incorrect", and each marked choice shows its `interaction.choices[].rationale`

24. **Multiple select feedback**
    - **Given** a checked multiple select question
    - **Then** every keyed choice is shown as correct, each wrongly selected choice and each missed correct choice shows its `interaction.choices[].rationale`, and missed choices are marked "Missed"

25. **Matching feedback**
    - **Given** a checked matching question
    - **Then** each prompt shows its correct target, whether the user's pairing was right, and its `questions[].teaching.matchFeedback` line

26. **Ordering feedback**
    - **Given** a checked ordering question
    - **Then** the correct sequence is shown with each step's `questions[].teaching.stepFeedback` line, and each of the user's positions is marked right or wrong

27. **A Study attempt ends with a recap**
    - **Given** every question checked
    - **When** the user finishes
    - **Then** the recap shows "N of 15 correct", says Study Mode is not scored, and shows no band

### Understand why

28. **The reading sheet teaches**
    - **Given** a question whose answer has been revealed
    - **When** the user opens Understand why
    - **Then** it shows `questions[].teaching.title`, `.concept`, `.biblicalGrounding` with a link per passage (from `questions[].sources[]`), `.importantDistinction`, and `.rememberThis` — and no passage text

29. **The reading sheet stays locked until reveal**
    - **Given** an Exam Mode question before submission, or a Study Mode question not yet checked
    - **When** its Understand why is opened
    - **Then** it shows only that it is available after the answer is revealed

### Results

30. **The score**
    - **Given** a submitted Exam Mode attempt
    - **Then** results show "N of 15", the percentage rounded to a whole number, and the band from `exam.experience.results.bands` (at 90, 80, 70, and 0)

31. **Every question reviewed**
    - **Given** results
    - **Then** each question shows the user's answer (or "No answer"), the correct answer, ✓/✕ with words, `questions[].whyCorrect`, and Understand why

32. **Concept labels follow the evidence rule**
    - **Given** a first Exam Mode attempt
    - **Then** each primary concept (`questions[].primaryConceptId`) shows correct over total, labelled Strength (at least `exam.experience.results.conceptLabelMinimumIndependentObservations` — 3 — observations, ≥ 80%), Needs review (at least 3, < 80%), or Not enough evidence (fewer than 3). The 80% cut is the owner's decision of 2026-09-28; the JSON does not carry it

33. **Missed concepts go to review**
    - **Given** any attempt with a missed question
    - **Then** its `questions[].primaryConceptId` is listed under "For review" on the results and on the overview

### Retakes

34. **Practice after answers were revealed**
    - **Given** a submitted Exam Mode attempt, or a Study Mode attempt with at least one checked answer
    - **When** the user starts Exam Mode again
    - **Then** the attempt and its results are labelled Practice, keep the raw score and explanations, and show Not enough evidence for every concept

35. **Opening Study Mode alone does not make Practice**
    - **Given** a Study Mode attempt with no checked answer
    - **When** the user starts Exam Mode
    - **Then** it is not Practice

36. **An attempt is a snapshot**
    - **Given** a submitted attempt
    - **Then** it keeps `exam.id` and `exam.version`, each item's `questions[].id` and `questions[].version`, the mode, whether it is Practice, every response with its time, start and submit times, and the graded result — and a later content version does not change it

### Links

37. **Links open over the app**
    - **Given** any passage link
    - **When** the user taps it
    - **Then** the passage opens in an in-app Safari sheet and the attempt is unchanged when it closes

38. **Only allowed links open**
    - **Given** a URL that is not `https://www.biblegateway.com/…`
    - **When** anything asks to open it
    - **Then** nothing opens

### Accessibility

39. **VoiceOver describes position, state, and feedback**
    - **Given** VoiceOver
    - **Then** each question announces "Question N of 15"; each row its role (radio or checkbox) and whether it is selected; ordering steps their position or "not placed"; and, once revealed, "Your answer", "Correct answer", "Incorrect", or "Missed"

40. **Feedback never relies on colour**
    - **Given** any revealed state
    - **Then** it carries an icon and a word as well as colour

41. **Reduce Motion is respected**
    - **Given** Reduce Motion on
    - **When** the user moves between questions
    - **Then** the body changes without rising, as the app's shared step transition already does

## Data touched and privacy impact

| Data                                                  | Where it comes from | Where it is stored                                                                   | Leaves the device?                                                                          |
| ----------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Exam content, including answer keys                   | Bundled JSON        | The app bundle, read-only                                                            | No                                                                                          |
| Attempts: mode, responses, timestamps, graded results | The user's taps     | The in-memory app store. Lost when the app is closed, until the local database lands | No                                                                                          |
| The passage a link points to                          | The bundled content | Nowhere                                                                              | Yes — only when the user taps a link: Bible Gateway receives the request, as any page visit |

- Responses to theology questions could hint at religious belief, so they are
  treated as personal. They never leave the device, are never logged, and move
  to the encrypted SQLCipher database — never plain storage — when attempts are
  persisted.
- Retention: until the app process ends. Nothing to delete yet.
- No accounts and no tracking. Nothing here needs either.

## Security considerations

- **Untrusted input:** the bundled JSON is parsed with Zod in
  `src/features/exams/data` and fails closed (criterion 4). Route params
  (`attemptId`, `questionId`) are parsed with Zod in the slice's route hook; an
  unknown attempt or question shows a not-found state.
- **Answer keys are public.** Bundling the keys means anyone who unpacks the
  app can read them. Accepted by the owner while there is no backend; the
  grading seam lets a trusted service take over (ADR 0013). No credential,
  account, or server trust depends on a score.
- **Deep links:** the exam routes are not added to the deep-link allowlist, so
  nothing outside the app can open them. `src/core/security` does not change.
- **New dependency:** `expo-web-browser` (`~57.0.3`, native), through
  `/add-dependency`, wrapped in `src/core/links`. No new permission,
  entitlement, or background mode.
- **URLs:** only `https://www.biblegateway.com/…` opens — checked when content
  loads and again at the opener.
- **Logging:** no response, answer, or content text is logged. A content error
  logs the exam ID and field paths only, through `src/core/monitoring`.
- **Jailbroken device:** can read the keys (already public) and alter
  in-memory scores. Nothing server-side trusts them.

## testIDs

| Element                                   | testID                                                     |
| ----------------------------------------- | ---------------------------------------------------------- |
| Fun's Theology Exams tile (existing)      | `fun-games-exams`                                          |
| Overview screen                           | `exam-overview-screen`                                     |
| Overview back button                      | `exam-overview-back-button`                                |
| Mode option                               | `exam-overview-mode-{exam\|study}`                         |
| Start / Resume button                     | `exam-overview-start-button`                               |
| Overview source link                      | `exam-overview-source-link-{index}`                        |
| Content error                             | `exam-content-error`                                       |
| Session screen                            | `exam-session-screen`                                      |
| Session close button                      | `exam-session-close-button`                                |
| Progress line                             | `exam-progress`                                            |
| Question stem                             | `exam-question-stem`                                       |
| Passage link under the stem               | `exam-passage-link-{index}`                                |
| Choice row (single, true/false, multiple) | `exam-choice-{choiceId}`                                   |
| Matching target for a prompt              | `exam-match-{promptId}-{targetId}`                         |
| Ordering step                             | `exam-order-step-{stepId}`                                 |
| Clear order                               | `exam-order-clear-button`                                  |
| Previous / Next                           | `exam-previous-button` / `exam-next-button`                |
| Check answer                              | `exam-check-button`                                        |
| Study feedback                            | `exam-study-feedback`                                      |
| Understand why (any screen)               | `exam-understand-why-button`                               |
| Review row                                | `exam-review-row-{questionId}`                             |
| Submit exam                               | `exam-submit-button`                                       |
| Confirm submit / keep working             | `exam-submit-confirm-button` / `exam-submit-cancel-button` |
| Results screen                            | `exam-results-screen`                                      |
| Score / band                              | `exam-results-score` / `exam-results-band`                 |
| Concept row                               | `exam-results-concept-{conceptId}`                         |
| Result item                               | `exam-results-item-{questionId}`                           |
| Results done                              | `exam-results-done-button`                                 |
| Understand why screen                     | `exam-why-screen`                                          |
| Understand why passage link               | `exam-why-passage-link-{index}`                            |
| Locked Understand why                     | `exam-why-locked`                                          |

## Out of scope

- A trusted grading service, and moving the keys off the device.
- Saving attempts across app launches (waits for the local database).
- A catalog of exams, and THEO-04-03.
- Mastery tracking across exams, and any credential or badge.
- Fun's other games, its category rail, and "See all".
- Dark mode.
- Sharing or exporting results.
