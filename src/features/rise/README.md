# rise

RISE, the daily game: six general-knowledge questions, two answers each,
the same for everyone on the day. Each question's answers rise from the
screen's foot in balloons, and the player paints across the one they think
is **wrong** before it reaches the line — about five seconds. The score is
right answers out of six; time to spare breaks ties.

- **Crossing out**: a stroke of thick white paint across a balloon marks it
  once it's run 24pt; a tap or dab never does. Painting the other balloon
  moves the mark. Flecks fly off a quick stroke.
- **The line**: as a pair reaches it, the mark is final. The wrong one
  crossed out: it pops, and the right one rises on, turning green as it
  crosses, to float in the atmosphere for the rest of the game. The right
  one crossed out: the wrong one bursts in black paint and the right one
  pops too. Neither: both burst. Paint stays where it lands; torn latex
  catches on the line or lies on the floor. Nothing is ever cleaned up —
  except the practice pair, the first time anyone plays.
- **The atmosphere**: from the lock, the survivor is a body like the saved —
  rising on, the line a one-way floor under it — then adrift as in space:
  each at its own depth and pace, touching the others edge to edge and
  bouncing off them by its size, never passing through.
- **The end**: the board stays as the run left it, the score on a black
  panel over its foot. "What you learned" (three-quarters of the screen,
  its title in the serif, "03 / 06" opposite) is a page per question, swiped
  through, a slider's dots in their own band at its foot. Each page is a
  print advertisement: the fact, large, as its statement; the category and
  question in its foot. Behind the words the outcome is alive — the balloon
  with the answer and the time it kept on it, adrift; or the red one,
  drifting, then bursting, its debris resting on the hairline. The words can
  be selected as iOS selects, and a tap lets go. The balloon is in reach:
  held and dragged, thrown to ricochet off the page's edges, or stopped dead
  by a tap — and while it's held the page won't turn.
- **Share**: a sheet with the reader's own board as a poster at the top —
  the answers blurred past reading, the score and decision time on black —
  and two cards under it: a post (4:5, cropped to what happened: feeds and
  Messages) and a story (9:16, the whole board, full screen). A tap sends
  that one to iOS's share sheet with "RISE · DAY 001 · 5 of 6 · +13.6s to spare".
  Drawn on the phone; nothing leaves it until shared.
- **Time to spare**: each pair's rise is a 5-second clock. A right answer
  banks what was left of it when its final mark went down — changing your
  mind costs — kept to the tenth, shown as it's won ("+2.9s" rising off
  the saved balloon); one that burst banks nothing. Summed:
  "+13.6s". More is better, as the score is, and it breaks ties between
  equal scores. "What you learned" shows each one's beside its mark (a dash
  for a burst) and, under a thick rule, the total.
- **Kept**: once a day, on the phone (`game_results`, game `"rise"`): the
  score, the decision time, and the run (`rise-run.ts`: question ids, the
  answers' order, the mark and when). A day already played is replayed from
  its marks to the board it left.

The day is the UTC day (`riseDayNumber`), so everyone has the same six at
the same time and a leaderboard would compare like with like. The phone's
clock decides it for now; a ranked leaderboard needs the server's clock and
the server scoring the marks (an ADR first — see docs/SETUP_CHECKLIST.md).

The questions, the schedule, the rules and the board are the `rise` entity
(`src/entities/rise`), which Home's preview also runs on demo pairs. The
bank is `scripts/rise/questions.json`; `npm run build:rise` checks every
rule and appends to the schedule — see `src/entities/rise/README.md`.
