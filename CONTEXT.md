# OS-self-study

An interactive study site for CE357 Operating Systems, built chapter by chapter from the
course lecture slides. This is the language the codebase uses for the study material and
for exam mode — the words in commits, module names, and conversation should match.

## Study material

**Chapter**:
One unit of the course, matching one lecture deck — its notes, figures, and sims.
_Avoid_: page, article, lesson

**Slide citation**:
A pointer from a claim in the notes back to the slide it came from. Reference-only; the
deck itself is not published with the site.
_Avoid_: source link, footnote, reference

**Sim**:
A hand-built interactive that makes one OS concept manipulable — a hierarchy you probe, a
sequence you step through. Distinct from a figure, which is static.
_Avoid_: demo, simulation, animation, component

**Guided mode**:
The mode a sim opens in, walking the reader through a fixed sequence one step at a time.

**Explore mode**:
The mode a sim unlocks once the reader has finished the guided sequence, letting them drive
it themselves. Locked until then, so the concept is met before it is played with.
_Avoid_: free mode, sandbox, interactive mode

**Step**:
One position in a sim's guided sequence.
_Avoid_: frame, stage, slide

## Exam mode

**Question bank**:
Every question written for a chapter. Grows one chapter at a time.
_Avoid_: quiz data, question set, pool

**Question type**:
What kind of answer a question takes — multiple choice, true-false, numeric, or short. It
determines how the answer is entered and how it is graded.

**Self-graded**:
A question the engine will not mark, because only the learner can judge their own prose
answer. A grading outcome in its own right, never a wrong answer.
_Avoid_: unmarked, skipped, manual

**Verdict**:
The outcome of grading one answer: correct, incorrect, or self-graded.
_Avoid_: result, score, grade

**Practice run**:
One pass through a queue of questions, from the setup screen to the results screen.
_Avoid_: quiz, attempt, test, exam

**Queue**:
The questions a practice run will ask, in the order it will ask them — a filtered slice of
the bank, shuffled.
_Avoid_: list, deck, order

**Session**:
A practice run frozen mid-flight so it can be resumed later. Belongs to one chapter.
_Avoid_: progress, save, state

**Stale session**:
A saved session that can no longer be resumed because the question bank changed under it —
a question it queued has since been renamed or removed. Discarded rather than repaired.

**Summary**:
What a finished practice run scored: the tally, the percentage, whether it passed, and the
questions that were missed.
_Avoid_: result, report, stats

**Pass mark**:
The percentage a practice run must reach to read as a pass.
_Avoid_: threshold, cutoff, passing grade

**Topic** and **Difficulty**:
The two axes a learner can narrow the bank by before starting a run. Topic is authored per
question and mirrors a section of the chapter; difficulty is easy, medium, or hard.
