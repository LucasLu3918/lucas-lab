import { createApp, defineComponent, h, ref } from 'vue';
import HintPanel from './HintPanel.vue';
import InventoryPanel from './InventoryPanel.vue';
import JournalPanel from './JournalPanel.vue';
import MazePuzzle from './MazePuzzle.vue';
import ReflectionPuzzle from './ReflectionPuzzle.vue';
import { parseHintSnapshot } from './hints';
import { parseJournalSnapshot } from './journal';
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
