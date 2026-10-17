// Copy guardrails from the Fortune Hub plan (§3.2 and §5): empower rather than predict, express possibility rather than certainty,
// and never frighten. Patterns are deliberately narrow; reviewers still read every line of new copy.

export interface EthicsFinding {
  id: 'death-prediction' | 'absolute-certainty' | 'intimidation';
  match: string;
  reason: string;
}

const RULES: Array<{ id: EthicsFinding['id']; pattern: RegExp; reason: string }> = [
  { id: 'death-prediction', pattern: /(會|將|必)?(死亡|死於|身亡|離世|喪命)|會死/g, reason: '不做死亡或生命終結的預測' },
  // Negated forms ("不一定會", "不保證") are allowed because disclaimers use them.
  { id: 'absolute-certainty', pattern: /(?<!不)(一定會|必定會|絕對會|保證會|肯定會)/g, reason: '改用「可能」「趨勢指向」等可能性語氣' },
  { id: 'intimidation', pattern: /大凶|災難(必定|即將)?降臨|詛咒|報應|厄運纏身/g, reason: '負面資訊需附帶建設性方向，避免恐嚇' },
];

export function lintCopy(text: string): EthicsFinding[] {
  const findings: EthicsFinding[] = [];
  for (const rule of RULES) {
    for (const found of text.matchAll(rule.pattern)) {
      findings.push({ id: rule.id, match: found[0], reason: rule.reason });
    }
  }
  return findings;
}
