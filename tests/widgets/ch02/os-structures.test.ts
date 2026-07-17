import { describe, expect, it } from 'vitest';

import { osStructures, type OsStructure } from '../../../src/widgets/ch02/os-structures';

// Locks the five OS structures (slides 40-53) and the shape each render `kind`
// requires. The widget branches on `kind` and reads kind-specific fields, so a
// structure missing its fields would render a blank diagram — these tests catch
// that at authoring time.
describe('osStructures', () => {

  it('lists the five structures in slide order', () => {

    expect(osStructures.map((structure) => structure.id)).toEqual([
      'monolithic',
      'layered',
      'microkernel',
      'modular',
      'hybrid',
    ]);
  });

  it('gives every structure a communication note and an example OS', () => {

    for (const structure of osStructures) {

      expect(structure.comm.length).toBeGreaterThan(0);

      expect(structure.example.length).toBeGreaterThan(0);
    }
  });

  it('marks each trade-off as a strength (+) or a cost (−)', () => {

    for (const structure of osStructures) {

      expect(structure.tradeoffs.length).toBeGreaterThan(0);

      for (const tradeoff of structure.tradeoffs) {

        expect(tradeoff.startsWith('+') || tradeoff.startsWith('−')).toBe(true);
      }
    }
  });

  it('supplies the fields each render kind depends on', () => {

    const requiredFor = (structure: OsStructure): boolean => {

      if (structure.kind === 'split') {

        return Boolean(structure.userspace?.length && structure.kernelspace?.length);
      }

      if (structure.kind === 'layered') {

        return Boolean(structure.layers?.length);
      }

      return Boolean(structure.core && structure.modules?.length);
    };

    for (const structure of osStructures) {

      expect(requiredFor(structure)).toBe(true);
    }
  });
});
