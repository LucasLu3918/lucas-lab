// Content packs hold reviewed copy as versioned JSON. Runtime code only reads them; tests validate them with ajv (devDependency).

export interface ContentPack<TEntries = Record<string, unknown>> {
  schemaVersion: 1;
  pack: string;
  contentVersion: string;
  entries: TEntries;
}

/** JSON Schema for a content pack. contentVersion looks like 2026.10.17 or 2026.10.17-2. */
export const CONTENT_PACK_SCHEMA = {
  $id: 'fortune-content-pack',
  type: 'object',
  required: ['schemaVersion', 'pack', 'contentVersion', 'entries'],
  additionalProperties: false,
  properties: {
    schemaVersion: { const: 1 },
    pack: { type: 'string', pattern: '^[a-z][a-z0-9-]*$' },
    contentVersion: { type: 'string', pattern: '^\\d{4}\\.\\d{2}\\.\\d{2}(-\\d+)?$' },
    entries: { type: 'object' },
  },
} as const;

const PACK_ID = /^[a-z][a-z0-9-]*$/;
const CONTENT_VERSION = /^\d{4}\.\d{2}\.\d{2}(-\d+)?$/;

/** Runtime guard that mirrors CONTENT_PACK_SCHEMA without loading a validator in the browser. */
export function isContentPack(value: unknown): value is ContentPack {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const pack = value as Record<string, unknown>;
  const allowed = new Set(['schemaVersion', 'pack', 'contentVersion', 'entries']);
  if (Object.keys(pack).some(key => !allowed.has(key))) return false;
  return pack.schemaVersion === 1
    && typeof pack.pack === 'string' && PACK_ID.test(pack.pack)
    && typeof pack.contentVersion === 'string' && CONTENT_VERSION.test(pack.contentVersion)
    && typeof pack.entries === 'object' && pack.entries !== null && !Array.isArray(pack.entries);
}
