// Pure, framework-free data for the CategorySorter self-quiz (Ch2). Two
// datasets, both slides-only: "services" splits the nine OS services into the
// user-helpful vs system-helpful buckets (slide 3), and "syscalls" sorts
// representative calls into the five system-call categories (slides 28-33).
// Kept out of the .svelte file so the taxonomy is unit-testable and each item's
// source slide is auditable in one place.
export type SortItem = {
  // The call or service shown to the reader, verbatim vocabulary from the deck.
  label: string;

  // id of the bucket this item belongs in — validated against `buckets` below.
  bucket: string;

  // One-line justification revealed after the reader answers, so a wrong guess
  // still teaches instead of just scoring.
  why: string;
};

export type SortBucket = {
  id: string;

  label: string;
};

export type SortDataset = {
  prompt: string;

  buckets: SortBucket[];

  items: SortItem[];
};

// slide 3 — the two halves of "Operating System Services": operations helpful to
// the user, and operations that keep the system itself running efficiently.
const services: SortDataset = {
  prompt: 'Is each service mainly there to help the user, or to keep the system itself running?',

  buckets: [
    { id: 'user', label: 'Helpful to the user' },

    { id: 'system', label: 'Helpful to the system' },
  ],

  items: [
    {
      label: 'User interface',
      bucket: 'user',
      why: 'The CLI, GUI, or touch interface exists to make the machine usable by a person.',
    },

    {
      label: 'Program execution',
      bucket: 'user',
      why: "Loading a program into memory and running it is the user's core reason for the machine.",
    },

    {
      label: 'File-system manipulation',
      bucket: 'user',
      why: 'Reading, writing, creating, searching, and setting permissions on files serves the user directly.',
    },

    {
      label: 'Error detection',
      bucket: 'user',
      why: 'Catching CPU, memory, I/O, and program errors keeps computing correct for the user (with debugging aids).',
    },

    {
      label: 'Resource allocation',
      bucket: 'system',
      why: 'Dividing CPU cycles, memory, storage, and I/O among concurrent jobs is about the system running efficiently.',
    },

    {
      label: 'Accounting (logging)',
      bucket: 'system',
      why: 'Tracking who used how much of which resource serves the system, not any one user.',
    },

    {
      label: 'Protection and security',
      bucket: 'system',
      why: 'Controlling access and authenticating users defends the system as a whole from interference and outsiders.',
    },
  ],
};

// slides 28-33 — the five categories every system call falls into. One clear
// representative call per category, chosen from the calls the slides list.
const syscalls: SortDataset = {
  prompt: 'Which of the five system-call categories does each call belong to?',

  buckets: [
    { id: 'process', label: 'Process control' },

    { id: 'file', label: 'File management' },

    { id: 'device', label: 'Device management' },

    { id: 'info', label: 'Information maintenance' },

    { id: 'comms', label: 'Communications' },
  ],

  items: [
    {
      label: 'fork() / create process',
      bucket: 'process',
      why: 'Creating, ending, and aborting processes — plus load/execute and memory allocation — is process control.',
    },

    {
      label: 'open() a file',
      bucket: 'file',
      why: 'Create, delete, open, close, read, write, and get/set attributes on files is file management.',
    },

    {
      label: 'read() from a device',
      bucket: 'device',
      why: 'Requesting/releasing a device and reading, writing, or attaching/detaching it is device management.',
    },

    {
      label: 'get time or date',
      bucket: 'info',
      why: 'Getting/setting the time, date, or system data, and querying attributes, is information maintenance.',
    },

    {
      label: 'send() a message',
      bucket: 'comms',
      why: 'Opening/closing connections and sending or receiving messages between processes is communications.',
    },

    {
      label: 'allocate memory',
      bucket: 'process',
      why: 'Allocating and freeing memory for a running process is grouped under process control.',
    },

    {
      label: 'set file attributes',
      bucket: 'file',
      why: 'Getting and setting a file’s attributes is part of file management.',
    },

    {
      label: 'create a shared-memory region',
      bucket: 'comms',
      why: 'Creating and gaining access to shared-memory regions is a communications call, not device management.',
    },
  ],
};

export const sorterDatasets: Record<'services' | 'syscalls', SortDataset> = {
  services,

  syscalls,
};

export type SorterDatasetKey = keyof typeof sorterDatasets;
