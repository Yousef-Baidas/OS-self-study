// Pure, framework-free data for the SyscallJourney sim (Ch2, slides 22-36).
// Encodes the FreeBSD process-creation sequence (slide 36) as a 7-step trace:
// the shell forks a child, the child execs a new program, the parent waits, and
// the child exits — with the CPU's user/kernel mode flipping on every trap
// (slide 22). This is the concrete, running-process counterpart to Chapter 1's
// static mode-transition figure. Order and wording are slides-only; step 6's
// "shell resumes" is the standard corollary of wait() returning. Kept beside the
// widget as data so the sequence is auditable and testable.
export type JourneyStep = {
  caption: string;

  // CPU privilege level while this step executes — drives the mode indicator.
  mode: 'user' | 'kernel';

  // The system call being issued this step, shown as a trap badge; null when no
  // call is crossing the boundary (plain user-mode execution).
  syscall: string | null;

  // Whether the child process exists yet (it appears the moment fork() runs).
  childPresent: boolean;

  // Name shown on the child box — it is a copy of the shell until exec() swaps
  // in a new program image.
  childLabel: string;

  parentStatus: string;

  childStatus: string;

  // Which box(es) the reader should focus on this step.
  active: 'parent' | 'child' | 'both';
};

export const syscallJourneySteps: JourneyStep[] = [

  {
    caption: 'The shell (the parent process) runs in user mode, waiting for your command.',
    mode: 'user',
    syscall: null,
    childPresent: false,
    childLabel: 'Child',
    parentStatus: 'running',
    childStatus: '',
    active: 'parent',
  },

  {
    caption: 'The shell calls fork(). This traps into the kernel, which creates a child process as a copy of the parent.',
    mode: 'kernel',
    syscall: 'fork()',
    childPresent: true,
    childLabel: 'Child',
    parentStatus: 'calls fork()',
    childStatus: 'created — a copy of the shell',
    active: 'parent',
  },

  {
    caption: 'fork() returns twice: the parent receives the child’s PID, the child receives 0. Two processes now run in user mode.',
    mode: 'user',
    syscall: null,
    childPresent: true,
    childLabel: 'Child',
    parentStatus: 'fork() returned the child’s PID',
    childStatus: 'fork() returned 0',
    active: 'both',
  },

  {
    caption: 'The parent calls wait() and blocks. The child calls exec(), trapping into the kernel to load a new program.',
    mode: 'kernel',
    syscall: 'exec()',
    childPresent: true,
    childLabel: 'Child',
    parentStatus: 'wait() — blocked',
    childStatus: 'calls exec()',
    active: 'child',
  },

  {
    caption: 'The kernel has replaced the child’s memory image. The child now runs the new program in user mode; the parent stays blocked.',
    mode: 'user',
    syscall: null,
    childPresent: true,
    childLabel: 'New program',
    parentStatus: 'blocked in wait()',
    childStatus: 'running the new program',
    active: 'child',
  },

  {
    caption: 'The new program finishes and calls exit(0). This traps into the kernel, which records the exit code and wakes the parent.',
    mode: 'kernel',
    syscall: 'exit(0)',
    childPresent: true,
    childLabel: 'New program',
    parentStatus: 'still blocked in wait()',
    childStatus: 'exit(0) — exit code 0',
    active: 'child',
  },

  {
    caption: 'wait() returns the child’s exit code and the shell resumes in user mode, ready for the next command.',
    mode: 'user',
    syscall: null,
    childPresent: true,
    childLabel: 'New program',
    parentStatus: 'wait() returned code 0 — resumes',
    childStatus: 'terminated',
    active: 'parent',
  },
];
