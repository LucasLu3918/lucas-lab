// @ts-expect-error The legacy item catalog is JavaScript and remains the game data authority.
import { items as itemCatalog } from '../../../games/blood-mirror/data/items.js';
// @ts-expect-error Reuse the established hand-drawn icon family from the legacy game.
import { icon, itemIcon } from '../../../games/blood-mirror/icons.js';

export interface InventoryItemView {
  id: string;
  name: string;
  iconMarkup: string;
  keepsake: boolean;
}

export function toInventoryItems(ids: readonly string[]): InventoryItemView[] {
  return ids.flatMap(id => {
    if (!Object.hasOwn(itemCatalog, id)) return [];
    const item = itemCatalog[id];
    if (!item || typeof item.name !== 'string') return [];

    return [{
      id,
      name: item.name,
      iconMarkup: icon(itemIcon(id, item)),
      keepsake: item.keepsake === true,
    }];
  });
}
