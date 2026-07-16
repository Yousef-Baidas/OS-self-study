// Pure, framework-free data module for the Storage-Device Hierarchy sim
// (SIM-01, flagship). Encodes the exact 7-tier slide-16 diagram — order,
// storage-class grouping, and volatile/nonvolatile divider — with zero
// invented speed/size/cost numbers (02-RESEARCH.md "SIM-01 — exact source
// data"; D-02/D-03 strict slides-only). Locked by
// tests/widgets/ch01/storage-tiers.test.ts.
export type StorageTier = {
  name: string;

  storageClass: 'primary' | 'secondary' | 'tertiary';

  volatile: boolean;
};

// Fastest/smallest (Registers) -> slowest/largest (Magnetic tapes), exactly
// as slide 16's pyramid diagram orders them. The dashed volatile/nonvolatile
// boundary on the diagram falls after "Main memory" (index 2).
export const storageTiers: StorageTier[] = [

  { name: 'Registers', storageClass: 'primary', volatile: true },

  { name: 'Cache', storageClass: 'primary', volatile: true },

  { name: 'Main memory', storageClass: 'primary', volatile: true },

  { name: 'Nonvolatile memory', storageClass: 'secondary', volatile: false },

  { name: 'Hard-disk drives', storageClass: 'secondary', volatile: false },

  { name: 'Optical disk', storageClass: 'tertiary', volatile: false },

  { name: 'Magnetic tapes', storageClass: 'tertiary', volatile: false },
];
