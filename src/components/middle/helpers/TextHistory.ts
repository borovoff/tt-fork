import type { ApiFormattedText } from '../../../api/types';

import { EntitiesDifference } from './EntitiesDifference';
import { TextDifference } from './TextDifference';

interface History {
  text: TextDifference;
  entities: EntitiesDifference;
}

export class TextHistory {
  private currentIndex = -1;

  private history: History[] = [];

  reinit() {
    this.currentIndex = -1;
    this.history = [];
  }

  private static isNotBreak(previous: string, next: string, symbol = ' ') {
    return !(next.startsWith(symbol) || (previous.endsWith(symbol) && previous !== symbol));
  }

  add(nextFT: ApiFormattedText, previousFT?: ApiFormattedText) {
    const textDiff = TextDifference.diff(previousFT?.text ?? '', nextFT.text);
    const entityDiff = EntitiesDifference.diff(previousFT?.entities ?? [], nextFT.entities);
    const n = textDiff.next;
    const p = textDiff.previous;

    if (n === '' && p === ''
        && entityDiff.next.length === 0 && entityDiff.previous.length === 0) {
      return;
    }

    if (this.currentIndex < this.history.length - 1) {
      this.history.splice(this.currentIndex + 1);
    }

    const previousDiff = this.history?.[this.history.length - 1];
    let appendToPrevious = false;
    if (n !== '' && p === '' && previousDiff) {
      const { next, previous, offset } = previousDiff.text;
      if (previous === '' && next !== '' && offset + next.length === textDiff.offset
          && TextHistory.isNotBreak(next, n) && TextHistory.isNotBreak(next, n, '\n')) {
        if (EntitiesDifference.hashify(entityDiff.previous)
            === EntitiesDifference.hashify(previousDiff.entities.next)) {
          appendToPrevious = true;
        }
      }
    }

    if (appendToPrevious) {
      previousDiff.text.next += n;
      previousDiff.entities.next = entityDiff.next;
    } else {
      this.history.push({
        text: textDiff,
        entities: entityDiff,
      });
    }
    this.currentIndex = this.history.length - 1;
  }

  next({ text, entities }: ApiFormattedText) {
    if (!this.history.length || this.currentIndex >= this.history.length - 1) {
      return;
    }
    ++this.currentIndex;
    const h = this.history[this.currentIndex];
    return {
      text: TextDifference.next(h.text, text),
      entities: EntitiesDifference.next(h.entities, entities),
      ...TextHistory.getOffsetAndLength(h, h.text.offset + h.text.next.length),
    };
  }

  previous({ text, entities }: ApiFormattedText) {
    if (this.currentIndex < 0) {
      return;
    }
    const h = this.history[this.currentIndex];
    --this.currentIndex;
    return {
      text: TextDifference.previous(h.text, text),
      entities: EntitiesDifference.previous(h.entities, entities),
      ...TextHistory.getOffsetAndLength(h, h.text.offset + h.text.previous.length),
    };
  }

  private static getOffsetAndLength({ text, entities }: History, offset: number) {
    let length = 0;
    if (text.next === '' && text.previous === '') {
      const entity = entities.next?.[0] ?? entities.previous?.[0];
      offset = entity?.offset ?? 0;
      length = entity?.length ?? 0;
    }

    return { offset, length };
  }
}

export const textHistory = new TextHistory();
