import { createApp, defineComponent, h } from 'vue';
import InventoryPanel from './InventoryPanel.vue';
import JournalPanel from './JournalPanel.vue';
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
