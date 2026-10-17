export const INVENTORY_UPDATED_EVENT = 'blood-mirror:inventory-updated';
export const INVENTORY_SELECTED_EVENT = 'blood-mirror:inventory-selected';

interface InventoryUpdateDetail {
  inventory?: unknown;
}

interface InventorySelectionDetail {
  id?: unknown;
}

export function emitInventoryUpdate(target: EventTarget, inventory: readonly string[]): void {
  target.dispatchEvent(new CustomEvent(INVENTORY_UPDATED_EVENT, {
    detail: { inventory: [...inventory] },
  }));
}

export function readInventoryUpdate(event: Event): string[] | null {
  const inventory = (event as CustomEvent<InventoryUpdateDetail>).detail?.inventory;
  return Array.isArray(inventory)
    ? inventory.filter((itemId): itemId is string => typeof itemId === 'string')
    : null;
}

export function emitInventorySelection(target: EventTarget, id: string): void {
  target.dispatchEvent(new CustomEvent(INVENTORY_SELECTED_EVENT, { detail: { id } }));
}

export function readInventorySelection(event: Event): string | null {
  const id = (event as CustomEvent<InventorySelectionDetail>).detail?.id;
  return typeof id === 'string' ? id : null;
}
