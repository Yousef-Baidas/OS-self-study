import { describe, expect, it } from 'vitest';

import { storageTiers, type StorageTier } from '../../../src/widgets/ch01/storage-tiers';

// Locks the exact slide-16 7-tier storage hierarchy (SIM-02 fidelity anchor,
// 02-RESEARCH.md "SIM-01 — exact source data"). This test is the single
// source of truth that the widget's data can never drift from the deck.
describe('storageTiers', () => {

  it('has length exactly 7', () => {

    expect(storageTiers).toHaveLength(7);
  });

  it('encodes the exact slide-16 tier names in order', () => {

    const names = storageTiers.map((tier) => tier.name);

    expect(names).toEqual([
      'Registers',
      'Cache',
      'Main memory',
      'Nonvolatile memory',
      'Hard-disk drives',
      'Optical disk',
      'Magnetic tapes',
    ]);
  });

  it('groups indexes 0-2 as primary, 3-4 as secondary, 5-6 as tertiary storage', () => {

    const classes = storageTiers.map((tier) => tier.storageClass);

    expect(classes).toEqual([
      'primary',
      'primary',
      'primary',
      'secondary',
      'secondary',
      'tertiary',
      'tertiary',
    ]);
  });

  it('places the volatile/nonvolatile divider after Main memory (index 2)', () => {

    const volatility = storageTiers.map((tier) => tier.volatile);

    expect(volatility).toEqual([true, true, true, false, false, false, false]);
  });
});

// Type-only usage keeps `StorageTier` exercised by the compiler without a
// redundant runtime assertion.
const _typeCheck: StorageTier = storageTiers[0];

void _typeCheck;
