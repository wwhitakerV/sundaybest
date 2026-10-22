# the-99

The daily game, The 99: call a flock of 20 through the gate before the wolf
gets them. The score is sheep saved — there's no clock. The page fits the
screen and never scrolls: the tally (saved, in the field, lost), the board as
large as the room allows, and under it what to do, or Share and Done.

- **Place the gate**: slide it along the line between the band (where the
  saved gather, red) and the field; let go and it's locked.
- **The wolf arrives**: a hollow jagged red outline where it starts; its 3,
  2, 1 flash inside it in Canela as its red rises from its foot (the number
  red over the hollow, white over the red). Solid, the numbers gone, it
  hunts at once (`FlockWolf`). It's drawn larger than it catches
  (`WOLF_DRAWN` against `WOLF.radius`), so the number fits inside it.
- **Call**: a touch in the field sends waves that draw nearby sheep toward
  it — a tap a small call; a hold grows over two seconds, reaching further
  and pulling harder, its waves (and haptic pulses) quickening and firming.
  The sheep hop on their own beats, each with its own nature for the day;
  near the gate they see it and make for it. The wolf never answers a call.
- **The wolf** weighs up the sheep it sees — the near and the alone — its
  dashed V narrowing as it settles, one line when it locks on and runs. It
  never comes near the gate. Sheep near it redden.
- **The end**: when every sheep is saved or taken. One board a day, the same
  for everyone (its seed is the date); played once, its count kept on the
  phone (`game_results`, which still records how long it ran). The result is
  set over the stilled board.

The rules, the board and its drawing are the `flock` entity
(`src/entities/flock`), which Home's preview also runs, with a shepherd
leading the flock. Tuning lives in `flock-rules.ts` (`SHEEP`, `WOLF`, `CALL`)
and `flock-sheep.ts` (`PULL`, `GATE_SEEN`).

"Better than 82% of shepherds" needs anonymous results on the server (an ADR
first); until then the result compares with yesterday, on the phone.
