import { describe, expect, it } from 'vitest';
import { lintCopy } from './ethics';

describe('copy ethics linter', () => {
  it('flags death predictions, absolute certainty and intimidation', () => {
    expect(lintCopy('這段時間你會死於意外。').map(finding => finding.id)).toContain('death-prediction');
    expect(lintCopy('這件事一定會成功。').map(finding => finding.id)).toContain('absolute-certainty');
    expect(lintCopy('若不照做，災難必定降臨。').map(finding => finding.id)).toContain('intimidation');
  });

  it('does not flag negated certainty used in disclaimers', () => {
    expect(lintCopy('內容不保證事件，也不一定會發生。')).toEqual([]);
  });

  it('accepts empowering, possibility-based wording', () => {
    expect(lintCopy('趨勢指向穩定累積，可以先從一件小事開始。')).toEqual([]);
  });

  it('reports the matched text so reviewers can locate it', () => {
    const [finding] = lintCopy('你一定會成功');
    expect(finding.match).toBe('一定會');
  });
});
