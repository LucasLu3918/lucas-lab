export const INVENTORY_UPDATED_EVENT = 'blood-mirror:inventory-updated';
export const INVENTORY_SELECTED_EVENT = 'blood-mirror:inventory-selected';

export function emitInventoryUpdate(target, inventory) {
  target.dispatchEvent(new CustomEvent(INVENTORY_UPDATED_EVENT, {
    detail: { inventory: [...inventory] },
  }));
}

export function readInventoryUpdate(event) {
  const inventory = event.detail?.inventory;
  return Array.isArray(inventory)
    ? inventory.filter(itemId => typeof itemId === 'string')
    : null;
}

export function emitInventorySelection(target, id) {
  target.dispatchEvent(new CustomEvent(INVENTORY_SELECTED_EVENT, {
    detail: { id },
  }));
}

export function readInventorySelection(event) {
  return typeof event.detail?.id === 'string' ? event.detail.id : null;
}
