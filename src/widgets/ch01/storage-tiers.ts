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

  // Qualitative-only descriptors, co-located on the tier they describe rather
  // than kept as parallel arrays in the widget — so they can never
  // positionally desync from `storageTiers`. No numeric value anywhere; the
  // deck states none (D-02/D-03, RESEARCH Pitfall 2). `cost` always carries an
  // explicit [ASSUMED] marker: the slides give no cost, so it is the standard
  // inverse-of-speed corollary, never slide-sourced fact (RESEARCH Open
  // Question 1, threat T-02-05).
  speed: string;

  size: string;

  cost: string;
};

// Fastest/smallest (Registers) -> slowest/largest (Magnetic tapes), exactly
// as slide 16's pyramid diagram orders them. The dashed volatile/nonvolatile
// boundary on the diagram falls after "Main memory" (index 2).
export const storageTiers: StorageTier[] = [
  {
    name: 'Registers',
    storageClass: 'primary',
    volatile: true,
    speed: 'Fastest of all seven tiers',
    size: 'Smallest capacity of all seven tiers',
    cost: 'Costliest per byte [ASSUMED]',
  },

  {
    name: 'Cache',
    storageClass: 'primary',
    volatile: true,
    speed: 'Faster than main memory, slower than registers',
    size: 'Larger than registers, smaller than main memory',
    cost: 'Costlier than main memory, cheaper than registers [ASSUMED]',
  },

  {
    name: 'Main memory',
    storageClass: 'primary',
    volatile: true,
    speed: 'Faster than secondary storage, slower than cache',
    size: 'Larger than cache, smaller than secondary storage',
    cost: 'Costlier than secondary storage, cheaper than cache [ASSUMED]',
  },

  {
    name: 'Nonvolatile memory',
    storageClass: 'secondary',
    volatile: false,
    speed: 'Slower than main memory, faster than hard-disk drives',
    size: 'Larger than main memory, smaller than hard-disk drives',
    cost: 'Cheaper than main memory, costlier than hard-disk drives [ASSUMED]',
  },

  {
    name: 'Hard-disk drives',
    storageClass: 'secondary',
    volatile: false,
    speed: 'Slower than nonvolatile memory, faster than optical disks',
    size: 'Larger than nonvolatile memory, smaller than optical disks',
    cost: 'Cheaper than nonvolatile memory, costlier than optical disks [ASSUMED]',
  },

  {
    name: 'Optical disk',
    storageClass: 'tertiary',
    volatile: false,
    speed: 'Slower than hard-disk drives, faster than magnetic tapes',
    size: 'Larger than hard-disk drives, smaller than magnetic tapes',
    cost: 'Cheaper than hard-disk drives, costlier than magnetic tapes [ASSUMED]',
  },

  {
    name: 'Magnetic tapes',
    storageClass: 'tertiary',
    volatile: false,
    speed: 'Slowest of all seven tiers',
    size: 'Largest capacity of all seven tiers',
    cost: 'Cheapest per byte [ASSUMED]',
  },
];
