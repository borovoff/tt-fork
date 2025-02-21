import type { CharToAction, CutEntity } from './BaseParser';

import { BaseParser } from './BaseParser';

export abstract class SpecialParser extends BaseParser {
  protected abstract charToAction: CharToAction;

  protected abstract maxLength: number;

  protected entity: CutEntity;

  protected startIndex: number;

  constructor(text: string, entity: CutEntity, i: number) {
    super(text);

    this.entity = entity;
    this.startIndex = i;
    this.i = i;
  }
}
