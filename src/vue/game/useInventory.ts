import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  emitInventorySelection,
  INVENTORY_UPDATED_EVENT,
  readInventoryUpdate,
} from './inventoryEvents';
import { toInventoryItems } from './inventory';

/** Mirrors the legacy engine's inventory events without writing game state. */
export function useInventory() {
  const inventoryIds = ref<string[]>([]);
  const items = computed(() => toInventoryItems(inventoryIds.value));

  function handleInventoryUpdate(event: Event): void {
    const next = readInventoryUpdate(event);
    if (next) inventoryIds.value = next;
  }

  onMounted(() => document.addEventListener(INVENTORY_UPDATED_EVENT, handleInventoryUpdate));
  onUnmounted(() => document.removeEventListener(INVENTORY_UPDATED_EVENT, handleInventoryUpdate));

  function selectItem(id: string): void {
    if (inventoryIds.value.some(itemId => itemId === id && toInventoryItems([itemId]).length > 0)) {
      emitInventorySelection(document, id);
    }
  }

  return { items, selectItem };
}
