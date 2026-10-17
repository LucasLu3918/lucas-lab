import { createApp, defineComponent, h, ref } from 'vue';
import HintPanel from './HintPanel.vue';
import LedgerPuzzle from './LedgerPuzzle.vue';
import LightPuzzle from './LightPuzzle.vue';
import MasksPuzzle from './MasksPuzzle.vue';
import InventoryPanel from './InventoryPanel.vue';
import JournalPanel from './JournalPanel.vue';
import MazePuzzle from './MazePuzzle.vue';
import PipesPuzzle from './PipesPuzzle.vue';
import ReflectionPuzzle from './ReflectionPuzzle.vue';
import WatchPuzzle from './WatchPuzzle.vue';
import Gears13Puzzle from './Gears13Puzzle.vue';
import PendulumPuzzle from './PendulumPuzzle.vue';
import PrismRaysPuzzle from './PrismRaysPuzzle.vue';
import PrismBlendPuzzle from './PrismBlendPuzzle.vue';
import PrismBallroomPuzzle from './PrismBallroomPuzzle.vue';
import StarwheelPuzzle from './StarwheelPuzzle.vue';
import ApothecaryTestimonyPuzzle from './ApothecaryTestimonyPuzzle.vue';
import { parsePendulumSnapshot, type PendulumAction, type PendulumSnapshot } from './pendulum';
import { parsePrismRaysSnapshot, type PrismRaysAction, type PrismRaysSnapshot } from './prism-rays';
import { parsePrismBlendSnapshot, type PrismBlendAction, type PrismBlendSnapshot } from './prism-blend';
import { parsePrismBallroomSnapshot, type PrismBallroomAction, type PrismBallroomSnapshot } from './prism-ballroom';
import { parseStarwheelSnapshot, type StarwheelAction, type StarwheelSnapshot } from './starwheel';
import { parseApothecaryTestimonySnapshot, type ApothecaryTestimonyAction, type ApothecaryTestimonySnapshot } from './apothecary-testimony';
import { parseGears13Snapshot, type Gears13Action, type Gears13Snapshot } from './gears13';
import { parseHintSnapshot } from './hints';
import { parseLedgerSnapshot, type LedgerAction, type LedgerSnapshot } from './ledger';
import { parseLightPuzzleSnapshot, type LightPuzzleAction, type LightPuzzleSnapshot } from './light';
import { parseMasksSnapshot, type MasksAction, type MasksSnapshot } from './masks';
import { parseWatchSnapshot, type WatchAction, type WatchSnapshot } from './watch';
import { parseJournalSnapshot } from './journal';
import { parsePipesSnapshot, type PipesAction } from './pipes';
import type { PipesSnapshot } from './pipes';
import { useInventory } from './useInventory';

const inventoryRoot = document.querySelector('[data-vue-game-inventory]');

if (inventoryRoot) {
  const InventoryIsland = defineComponent({
    name: 'InventoryIsland',
    setup() {
      const { items, selectItem } = useInventory();
      return () => h(InventoryPanel, {
        items: items.value,
        onSelect: selectItem,
      });
    },
  });

  createApp(InventoryIsland).mount(inventoryRoot);
}

export function mountJournalIsland(
  root: Element,
  snapshot: unknown,
  onSecretEpilogue: () => void,
): (() => void) | null {
  const parsed = parseJournalSnapshot(snapshot);
  if (!parsed) return null;

  const app = createApp(JournalPanel, {
    snapshot: parsed,
    onSecretEpilogue,
  });
  app.mount(root);
  return () => app.unmount();
}

export function mountHintIsland(
  root: Element,
  value: unknown,
  onRevealNext: () => number,
): (() => void) | null {
  const snapshot = parseHintSnapshot(value);
  if (!snapshot) return null;

  const count = ref(snapshot.count);
  const app = createApp(defineComponent({
    name: 'HintIsland',
    setup() {
      const revealNext = () => {
        count.value = onRevealNext();
      };
      return () => h(HintPanel, {
        snapshot,
        count: count.value,
        onRevealNext: revealNext,
      });
    },
  }));
  app.mount(root);
  return () => app.unmount();
}

type MazePuzzleProps = InstanceType<typeof MazePuzzle>['$props'];
type MazeSnapshot = MazePuzzleProps['snapshot'];
type MazeCellKind = MazeSnapshot['cells'][number];

function isMazeSnapshot(value: unknown): value is MazeSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<MazeSnapshot>;
  return snapshot.rows === 5
    && snapshot.columns === 7
    && Array.isArray(snapshot.cells)
    && snapshot.cells.length === snapshot.rows * snapshot.columns
    && snapshot.cells.every((cell: unknown): cell is MazeCellKind =>
      cell === 'wall' || cell === 'floor' || cell === 'gate' || cell === 'exit')
    && Array.isArray(snapshot.position)
    && snapshot.position.length === 2
    && snapshot.position.every(Number.isInteger)
    && snapshot.position[0] >= 0 && snapshot.position[0] < snapshot.rows
    && snapshot.position[1] >= 0 && snapshot.position[1] < snapshot.columns
    && typeof snapshot.steps === 'number' && Number.isInteger(snapshot.steps) && snapshot.steps >= 0
    && typeof snapshot.message === 'string'
    && typeof snapshot.gateOpen === 'boolean';
}

export function mountMazePuzzleIsland(
  root: Element,
  value: unknown,
  onAction: MazePuzzleProps['onAction'],
): (() => void) | null {
  if (!isMazeSnapshot(value) || typeof onAction !== 'function') return null;

  const app = createApp(MazePuzzle, { snapshot: value, onAction });
  app.mount(root);
  root.setAttribute('data-vue-maze-ready', 'true');
  return () => app.unmount();
}

type PipesPuzzleProps = InstanceType<typeof PipesPuzzle>['$props'];

export function mountPipesPuzzleIsland(
  root: Element,
  value: unknown,
  onAction: (action: PipesAction) => PipesSnapshot,
): (() => void) | null {
  const snapshot = parsePipesSnapshot(value);
  if (!snapshot || typeof onAction !== 'function') return null;

  const app = createApp(PipesPuzzle, { snapshot, onAction } satisfies PipesPuzzleProps);
  app.mount(root);
  root.setAttribute('data-vue-pipes-ready', 'true');
  return () => app.unmount();
}

type LedgerPuzzleProps = InstanceType<typeof LedgerPuzzle>['$props'];

export function mountLedgerPuzzleIsland(
  root: Element,
  value: unknown,
  onAction: (action: LedgerAction) => LedgerSnapshot,
): (() => void) | null {
  const snapshot = parseLedgerSnapshot(value);
  if (!snapshot || typeof onAction !== 'function') return null;

  const app = createApp(LedgerPuzzle, { snapshot, onAction } satisfies LedgerPuzzleProps);
  app.mount(root);
  root.setAttribute('data-vue-ledger-ready', 'true');
  return () => app.unmount();
}

type MasksPuzzleProps = InstanceType<typeof MasksPuzzle>['$props'];

export function mountMasksPuzzleIsland(
  root: Element,
  value: unknown,
  onAction: (action: MasksAction) => MasksSnapshot,
): (() => void) | null {
  const snapshot = parseMasksSnapshot(value);
  if (!snapshot || typeof onAction !== 'function') return null;

  const app = createApp(MasksPuzzle, { snapshot, onAction } satisfies MasksPuzzleProps);
  app.mount(root);
  root.setAttribute('data-vue-masks-ready', 'true');
  return () => app.unmount();
}

type LightPuzzleProps = InstanceType<typeof LightPuzzle>['$props'];

export function mountLightPuzzleIsland(
  root: Element,
  value: unknown,
  onAction: (action: LightPuzzleAction) => LightPuzzleSnapshot | null,
): (() => void) | null {
  const snapshot = parseLightPuzzleSnapshot(value);
  if (!snapshot || typeof onAction !== 'function') return null;

  const app = createApp(LightPuzzle, { snapshot, onAction } satisfies LightPuzzleProps);
  app.mount(root);
  root.setAttribute('data-vue-light-ready', 'true');
  return () => app.unmount();
}

type WatchPuzzleProps = InstanceType<typeof WatchPuzzle>['$props'];

export function mountWatchPuzzleIsland(
  root: Element,
  value: unknown,
  onAction: (action: WatchAction) => WatchSnapshot | null,
): (() => void) | null {
  const snapshot = parseWatchSnapshot(value);
  if (!snapshot || typeof onAction !== 'function') return null;

  const app = createApp(WatchPuzzle, { snapshot, onAction } satisfies WatchPuzzleProps);
  app.mount(root);
  root.setAttribute('data-vue-watch-ready', 'true');
  return () => app.unmount();
}

type Gears13PuzzleProps = InstanceType<typeof Gears13Puzzle>['$props'];

export function mountGears13PuzzleIsland(
  root: Element,
  value: unknown,
  onAction: (action: Gears13Action) => Gears13Snapshot | null,
): { update(value: unknown): void; unmount(): void } | null {
  const snapshot = parseGears13Snapshot(value);
  if (!snapshot || typeof onAction !== 'function') return null;

  const current = ref(snapshot);
  const dispatch = (action: Gears13Action) => {
    const next = parseGears13Snapshot(onAction(action));
    if (next) current.value = next;
    return next;
  };
  const app = createApp(defineComponent({
    name: 'Gears13PuzzleIsland',
    setup() {
      return () => h(Gears13Puzzle, {
        snapshot: current.value,
        onAction: dispatch,
      } satisfies Gears13PuzzleProps);
    },
  }));
  app.mount(root);
  root.setAttribute('data-vue-gears13-ready', 'true');
  return {
    update(value: unknown) {
      const next = parseGears13Snapshot(value);
      if (next) current.value = next;
    },
    unmount: () => app.unmount(),
  };
}

type PendulumPuzzleProps = InstanceType<typeof PendulumPuzzle>['$props'];

export function mountPendulumPuzzleIsland(
  root: Element,
  value: unknown,
  onAction: (action: PendulumAction) => PendulumSnapshot | null,
): (() => void) | null {
  const snapshot = parsePendulumSnapshot(value);
  if (!snapshot || typeof onAction !== 'function') return null;

  const app = createApp(PendulumPuzzle, { snapshot, onAction } satisfies PendulumPuzzleProps);
  app.mount(root);
  root.setAttribute('data-vue-pendulum-ready', 'true');
  return () => app.unmount();
}

type StarwheelPuzzleProps = InstanceType<typeof StarwheelPuzzle>['$props'];

export function mountStarwheelPuzzleIsland(
  root: Element,
  value: unknown,
  onAction: (action: StarwheelAction) => StarwheelSnapshot | null,
): { update(value: unknown): void; unmount(): void } | null {
  const snapshot = parseStarwheelSnapshot(value);
  if (!snapshot || typeof onAction !== 'function') return null;

  const current = ref(snapshot);
  const update = (value: unknown) => {
    const next = parseStarwheelSnapshot(value);
    if (next) current.value = next;
  };
  const dispatch = (action: StarwheelAction) => {
    const next = parseStarwheelSnapshot(onAction(action));
    if (next) current.value = next;
    return next;
  };
  const app = createApp(defineComponent({
    name: 'StarwheelPuzzleIsland',
    setup() {
      return () => h(StarwheelPuzzle, {
        snapshot: current.value,
        onAction: dispatch,
      } satisfies StarwheelPuzzleProps);
    },
  }));
  app.mount(root);
  root.setAttribute('data-vue-starwheel-ready', 'true');
  return { update, unmount: () => app.unmount() };
}

type PrismRaysPuzzleProps = InstanceType<typeof PrismRaysPuzzle>['$props'];

export function mountPrismRaysPuzzleIsland(
  root: Element,
  value: unknown,
  onAction: (action: PrismRaysAction) => PrismRaysSnapshot | null,
): (() => void) | null {
  const snapshot = parsePrismRaysSnapshot(value);
  if (!snapshot || typeof onAction !== 'function') return null;

  const current = ref(snapshot);
  const dispatch = (action: PrismRaysAction) => {
    const next = parsePrismRaysSnapshot(onAction(action));
    if (next) current.value = next;
    return next;
  };
  const app = createApp(defineComponent({
    name: 'PrismRaysPuzzleIsland',
    setup() {
      return () => h(PrismRaysPuzzle, {
        snapshot: current.value,
        onAction: dispatch,
      } satisfies PrismRaysPuzzleProps);
    },
  }));
  app.mount(root);
  root.setAttribute('data-vue-prism-rays-ready', 'true');
  return () => app.unmount();
}

type PrismBlendPuzzleProps = InstanceType<typeof PrismBlendPuzzle>['$props'];

export function mountPrismBlendPuzzleIsland(
  root: Element,
  value: unknown,
  onAction: (action: PrismBlendAction) => PrismBlendSnapshot | null,
): (() => void) | null {
  const snapshot = parsePrismBlendSnapshot(value);
  if (!snapshot || typeof onAction !== 'function') return null;

  const current = ref(snapshot);
  const dispatch = (action: PrismBlendAction) => {
    const next = parsePrismBlendSnapshot(onAction(action));
    if (next) current.value = next;
    return next;
  };
  const app = createApp(defineComponent({
    name: 'PrismBlendPuzzleIsland',
    setup() {
      return () => h(PrismBlendPuzzle, {
        snapshot: current.value,
        onAction: dispatch,
      } satisfies PrismBlendPuzzleProps);
    },
  }));
  app.mount(root);
  root.setAttribute('data-vue-prism-blend-ready', 'true');
  return () => app.unmount();
}

type PrismBallroomPuzzleProps = InstanceType<typeof PrismBallroomPuzzle>['$props'];

export function mountPrismBallroomPuzzleIsland(
  root: Element,
  value: unknown,
  onAction: (action: PrismBallroomAction) => PrismBallroomSnapshot | null,
): (() => void) | null {
  const snapshot = parsePrismBallroomSnapshot(value);
  if (!snapshot || typeof onAction !== 'function') return null;

  const current = ref(snapshot);
  const dispatch = (action: PrismBallroomAction) => {
    const next = parsePrismBallroomSnapshot(onAction(action));
    if (next) current.value = next;
    return next;
  };
  const app = createApp(defineComponent({
    name: 'PrismBallroomPuzzleIsland',
    setup() {
      return () => h(PrismBallroomPuzzle, {
        snapshot: current.value,
        onAction: dispatch,
      } satisfies PrismBallroomPuzzleProps);
    },
  }));
  app.mount(root);
  root.setAttribute('data-vue-prism-ballroom-ready', 'true');
  return () => app.unmount();
}

type ApothecaryTestimonyPuzzleProps = InstanceType<typeof ApothecaryTestimonyPuzzle>['$props'];

export function mountApothecaryTestimonyPuzzleIsland(
  root: Element,
  value: unknown,
  onAction: (action: ApothecaryTestimonyAction) => ApothecaryTestimonySnapshot,
): (() => void) | null {
  const snapshot = parseApothecaryTestimonySnapshot(value);
  if (!snapshot || typeof onAction !== 'function') return null;

  const current = ref(snapshot);
  const dispatch = (action: ApothecaryTestimonyAction) => {
    const next = parseApothecaryTestimonySnapshot(onAction(action));
    if (next) current.value = next;
    return next || current.value;
  };
  const app = createApp(defineComponent({
    name: 'ApothecaryTestimonyPuzzleIsland',
    setup() {
      return () => h(ApothecaryTestimonyPuzzle, {
        snapshot: current.value,
        onAction: dispatch,
      } satisfies ApothecaryTestimonyPuzzleProps);
    },
  }));
  app.mount(root);
  root.setAttribute('data-vue-apothecary-testimony-ready', 'true');
  return () => app.unmount();
}

export function mountReflectionIsland(
  root: Element,
  snapshot: { left: boolean[]; right: boolean[]; onChange: (right: boolean[]) => void },
): (() => void) | null {
  if (snapshot.left.length !== 8 || snapshot.right.length !== 8
    || !snapshot.left.every(value => typeof value === 'boolean')
    || !snapshot.right.every(value => typeof value === 'boolean')
    || typeof snapshot.onChange !== 'function') return null;

  const app = createApp(ReflectionPuzzle, snapshot);
  app.mount(root);
  return () => app.unmount();
}
