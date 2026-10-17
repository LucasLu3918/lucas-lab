// @ts-expect-error This plain JavaScript module is also consumed directly by the legacy game entry.
import * as legacyInventoryEvents from '../../../games/blood-mirror/inventory-events.js';

interface InventoryEventBridge {
  INVENTORY_UPDATED_EVENT: string;
  INVENTORY_SELECTED_EVENT: string;
  emitInventoryUpdate(target: EventTarget, inventory: readonly string[]): void;
  readInventoryUpdate(event: Event): string[] | null;
  emitInventorySelection(target: EventTarget, id: string): void;
  readInventorySelection(event: Event): string | null;
}

const bridge = legacyInventoryEvents as unknown as InventoryEventBridge;

export const {
  INVENTORY_UPDATED_EVENT,
  INVENTORY_SELECTED_EVENT,
  emitInventoryUpdate,
  readInventoryUpdate,
  emitInventorySelection,
  readInventorySelection,
} = bridge;
