import { createApp, defineComponent, h, ref } from 'vue';
import HintPanel from './HintPanel.vue';
import InventoryPanel from './InventoryPanel.vue';
import JournalPanel from './JournalPanel.vue';
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
