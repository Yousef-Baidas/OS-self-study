// Pure, framework-free data for the OsStructureExplorer (Ch2, slides 40-53).
// The five ways to structure a general-purpose OS, each reduced to: where its
// components sit relative to the user/kernel boundary, how those components
// talk, a real example, and the trade-offs the slides call out. Three render
// `kind`s cover all five layouts so the widget stays small:
//   • split   — a user-space band over a kernel band (monolithic, microkernel)
//   • layered — a bottom-to-top stack of layers (layered, hybrid)
//   • modular — a core kernel ringed by loadable modules (modular)
// Kept beside the widget as data so the taxonomy is auditable and testable.
export type OsStructure = {
  id: string;

  name: string;

  tagline: string;

  // How the pieces communicate — the line that most distinguishes the models.
  comm: string;

  // A real OS (or teaching model) built this way, from the slides.
  example: string;

  // Short trade-off bullets; each starts with + (strength) or − (cost).
  tradeoffs: string[];

  kind: 'split' | 'layered' | 'modular';

  // kind: 'split' — blocks above and below the system-call interface.
  userspace?: string[];

  kernelspace?: string[];

  // Label for the kernel band ("Kernel" vs "Microkernel").
  kernelLabel?: string;

  // kind: 'layered' — layers listed bottom (hardware) to top (user interface);
  // the widget reverses them for top-down display.
  layers?: string[];

  // kind: 'modular' — a core plus the modules that load around it.
  core?: string;

  modules?: string[];
};

export const osStructures: OsStructure[] = [

  {
    id: 'monolithic',
    name: 'Monolithic',
    tagline: 'Everything runs together in one kernel address space.',
    kind: 'split',
    userspace: ['User programs', 'System programs & shells'],
    kernelLabel: 'Kernel (one large level)',
    kernelspace: ['File system', 'CPU scheduling', 'Memory management', 'Device drivers', 'I/O'],
    comm: 'Direct function calls inside a single kernel — nothing crosses an address-space boundary.',
    example: 'Original UNIX; the core of Linux',
    tradeoffs: [
      '+ Fast — no message-passing overhead between components',
      '+ Simple to get running early on',
      '− A huge amount of functionality packed into one level; hard to extend or isolate',
    ],
  },

  {
    id: 'layered',
    name: 'Layered',
    tagline: 'Levels stacked hardware-up, each using only the one below it.',
    kind: 'layered',
    layers: [
      'Layer 0 — Hardware',
      'Memory & device drivers',
      'CPU scheduling',
      'File system',
      'System programs',
      'Layer N — User interface',
    ],
    comm: 'A layer may call only the operations and services of lower-numbered layers.',
    example: 'The THE system — mainly a teaching abstraction',
    tradeoffs: [
      '+ Modular — each layer is built on and tested against the layers below only',
      '+ Abstraction hides lower-level detail from higher layers',
      '− Layers are hard to define cleanly, and crossing many of them adds overhead',
    ],
  },

  {
    id: 'microkernel',
    name: 'Microkernel',
    tagline: 'Push as much as possible out of the kernel into user space.',
    kind: 'split',
    userspace: ['Applications', 'File server', 'Device drivers', 'Other OS services'],
    kernelLabel: 'Microkernel',
    kernelspace: ['Inter-process communication', 'Minimal memory & scheduling'],
    comm: 'User modules communicate with one another by message passing through the microkernel.',
    example: 'Mach; Darwin (macOS) is partly based on Mach',
    tradeoffs: [
      '+ Easier to extend and to port to new architectures',
      '+ More reliable and secure — less code runs in kernel mode',
      '− User-space ↔ kernel-space messaging adds a performance overhead',
    ],
  },

  {
    id: 'modular',
    name: 'Modular',
    tagline: 'A small core with functionality loaded as kernel modules on demand.',
    kind: 'modular',
    core: 'Core kernel',
    modules: ['Scheduling classes', 'File systems', 'Device drivers', 'Networking', 'Executable formats'],
    comm: 'Each core component talks to the others over known interfaces; modules load as needed.',
    example: 'Linux, Solaris (loadable kernel modules)',
    tradeoffs: [
      '+ Flexible — load functionality at runtime instead of rebuilding the kernel',
      '+ Like layers, but modules need not sit in a strict hierarchy',
      '− Modules still run in the kernel address space, so a bad one can bring it down',
    ],
  },

  {
    id: 'hybrid',
    name: 'Hybrid',
    tagline: 'Real systems blend several models at once.',
    kind: 'layered',
    layers: [
      'Kernel — Mach microkernel + BSD UNIX',
      'I/O Kit + kernel extensions (modules)',
      'Core services & frameworks',
      'Cocoa & media frameworks',
      'Aqua user interface',
    ],
    comm: 'Combines approaches: a Mach microkernel, monolithic BSD parts, and dynamically loadable extensions.',
    example: 'macOS & iOS, Windows, Android',
    tradeoffs: [
      '+ Balances performance, security, and usability instead of one pure model',
      '+ Nearly every modern general-purpose OS is a hybrid',
      '− More complex — the "structure" is really several structures layered together',
    ],
  },
];
