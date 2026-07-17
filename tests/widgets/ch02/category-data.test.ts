import { describe, expect, it } from 'vitest';

import { sorterDatasets, type SorterDatasetKey } from '../../../src/widgets/ch02/category-data';

// Locks the two CategorySorter taxonomies (slide 3 services; slides 28-33
// system-call categories) against drift. The core invariant a self-quiz must
// never violate: every item's declared bucket has to be a real bucket, or the
// widget could mark a correct answer wrong.
describe('sorterDatasets', () => {

  const keys: SorterDatasetKey[] = ['services', 'syscalls'];

  it('exposes exactly the services and syscalls datasets', () => {

    expect(Object.keys(sorterDatasets).sort()).toEqual(['services', 'syscalls']);
  });

  it('splits services into the two slide-3 buckets', () => {

    expect(sorterDatasets.services.buckets.map((bucket) => bucket.id)).toEqual(['user', 'system']);
  });

  it('splits syscalls into the five slide-28 categories', () => {

    expect(sorterDatasets.syscalls.buckets.map((bucket) => bucket.id)).toEqual([
      'process',
      'file',
      'device',
      'info',
      'comms',
    ]);
  });

  it.each(keys)('every %s item points at a real bucket and carries a justification', (key) => {

    const dataset = sorterDatasets[key];

    const bucketIds = new Set(dataset.buckets.map((bucket) => bucket.id));

    expect(dataset.items.length).toBeGreaterThan(0);

    for (const item of dataset.items) {

      expect(bucketIds.has(item.bucket)).toBe(true);

      expect(item.label.length).toBeGreaterThan(0);

      expect(item.why.length).toBeGreaterThan(0);
    }
  });

  it.each(keys)('every %s bucket is actually used by at least one item', (key) => {

    const dataset = sorterDatasets[key];

    const usedBuckets = new Set(dataset.items.map((item) => item.bucket));

    for (const bucket of dataset.buckets) {

      expect(usedBuckets.has(bucket.id)).toBe(true);
    }
  });
});
