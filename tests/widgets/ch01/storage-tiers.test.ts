import { describe, expect, it } from 'vitest';

import { storageTiers, type StorageTier } from '../../../src/widgets/ch01/storage-tiers';

// Locks the exact slide-16 7-tier storage hierarchy for the SIM-01 storage
// sim — the SIM-02 fidelity anchor (02-RESEARCH.md "SIM-01 — exact source
// data"). This test is the single source of truth that the widget's data,
// including its qualitative Speed/Size/Cost descriptors, can never drift from
// the deck.
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

  it('co-locates a non-empty speed, size, and cost descriptor on every tier', () => {

    for (const tier of storageTiers) {

      expect(tier.speed.length).toBeGreaterThan(0);

      expect(tier.size.length).toBeGreaterThan(0);

      expect(tier.cost.length).toBeGreaterThan(0);
    }
  });

  it('never states a numeric speed, size, or cost value (the deck gives none — D-02/D-03)', () => {

    for (const tier of storageTiers) {

      expect(tier.speed).not.toMatch(/\d/);

      expect(tier.size).not.toMatch(/\d/);

      expect(tier.cost).not.toMatch(/\d/);
    }
  });

  it('flags every cost as [ASSUMED] (the slides state no cost anywhere)', () => {

    for (const tier of storageTiers) {

      expect(tier.cost).toMatch(/\[ASSUMED\]$/);
    }
  });

  it('anchors the extreme speed/size descriptors to the top and bottom tiers', () => {

    const last = storageTiers.length - 1;

    expect(storageTiers[0].speed).toBe('Fastest of all seven tiers');

    expect(storageTiers[0].size).toBe('Smallest capacity of all seven tiers');

    expect(storageTiers[last].speed).toBe('Slowest of all seven tiers');

    expect(storageTiers[last].size).toBe('Largest capacity of all seven tiers');
  });
});

// Type-only usage keeps `StorageTier` exercised by the compiler without a
// redundant runtime assertion.
const _typeCheck: StorageTier = storageTiers[0];

void _typeCheck;
