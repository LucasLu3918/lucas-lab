// Every module returns this envelope so readers can see which rules and copy produced a result.

export type InputPrecision = 'full' | 'approximate' | 'minimal';

export interface MethodResult<T> {
  module: string;
  methodVersion: string;
  contentVersion: string;
  inputPrecision: InputPrecision;
  disclaimer: string;
  data: T;
}

export const DEFAULT_DISCLAIMER = '內容依固定規則和傳統象徵整理，供娛樂與自我反思，不保證事件，也不取代醫療、法律或財務專業建議。';

export function createMethodResult<T>(input: Omit<MethodResult<T>, 'disclaimer'> & { disclaimer?: string }): MethodResult<T> {
  return { ...input, disclaimer: input.disclaimer ?? DEFAULT_DISCLAIMER };
}
