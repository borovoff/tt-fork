import type { ApiMessageEntity, ApiMessageEntityBlockquote, ApiMessageEntityPre } from '../api/types';
import type { CutEntity, MarkdownSymbol, OpenEntities } from './BaseParser';
import { ApiMessageEntityTypes } from '../api/types';

import { getSlicedEntities } from '../components/middle/helpers/getSlicedEntities';

import { BaseParser } from './BaseParser';
import { CodeParser } from './CodeParser';
import { UrlParser } from './UrlParser';

export class MarkdownParser extends BaseParser {
  protected maxLength = 10000;

  private openEntities: Partial<OpenEntities> = {};

  private entities: CutEntity[] = [];

  private initialText = '';

  constructor(text: string) {
    super(text);
    this.initialText = text;
  }

  getFormattedText() {
    try {
      this.parse();
      const quote = this.openEntities['>'];
      if (quote) {
        this.addEntity(quote, '>');
      }
      this.checkUnclosedTags('Detected unclosed tag after parsing');
    } catch (e) {
      // TODO: here error can be highlighted in input

      return { text: this.initialText };
    }

    const es = getSlicedEntities(this.entities as ApiMessageEntity[]);
    if (es.length || this.text.length) {
      return { entities: es.length === 0 ? undefined : es, text: this.text };
    }

    return { text: this.initialText };
  }

  private simple = (symbol: MarkdownSymbol) => {
    const entity = this.openEntities[symbol];
    this.slice(symbol.length);
    if (entity) {
      this.addEntity(entity, symbol);
    } else {
      this.addToOpenEntities(symbol);
    }
  };

  private quote = () => {
    if (this.charAt(-1) === '\n' || this.i === 0) {
      const quote = this.openEntities['>'];
      this.slice(1);
      if (!quote) {
        this.addToOpenEntities('>');
      }
    } else {
      this.i++;
    }
  };

  private newLine = () => {
    const entity = this.openEntities['>'];
    if (this.charAt(1) !== '>' && entity) {
      this.addEntity(entity, '>');
    }
    this.i++;
  };

  private code = () => {
    this.checkUnclosedTags('Detected unclosed tag before code block');

    let shift = 1;
    let symbol: MarkdownSymbol = '`';
    const isPre = this.isPre();
    if (isPre) {
      shift = 3;
      symbol = '```';
    }

    const entity = this.addToOpenEntities(symbol);
    this.slice(shift);
    const offset = new CodeParser(this.text, entity, this.i).getOffset();
    const length = (entity as ApiMessageEntityPre).language?.length;
    this.slice(length !== undefined ? length + 1 : 0);
    this.i += offset;
    if (isPre && this.charAt(-1) === '\n') {
      --this.i;
      this.slice(1);
    }
    this.slice(shift);
    this.addEntity(entity, symbol);
  };

  private checkUnclosedTags(error: string) {
    if (Object.keys(this.openEntities).length > 0) {
      this.error(error);
    }
  }

  private addEntity = (entity: CutEntity, symbol: MarkdownSymbol) => {
    const length = this.i - entity.offset;
    this.entities.push({ ...entity, length });
    delete this.openEntities[symbol];
  };

  private addToOpenEntities = (symbol: MarkdownSymbol, type?: ApiMessageEntityTypes) => {
    const entity = { type: type || this.charToEntityType[symbol], offset: this.i, length: -1 };
    this.openEntities[symbol] = entity;

    return entity;
  };

  private underline = () => {
    const symbol = this.charAt(1) === '_' ? '__' : '_';
    this.simple(symbol);
  };

  private spoiler = () => {
    if (this.charAt(1) === '|') {
      const quote = this.openEntities['>'] as ApiMessageEntityBlockquote;
      if (!this.openEntities.hasOwnProperty('||') && quote
          && (this.charAt(2) === '\n' || this.i + 2 === this.text.length)) {
        quote.canCollapse = true;
        this.addEntity(quote, '>');
        this.slice(2);
      } else {
        this.simple('||');
      }
    }
  };

  private startUrl = () => {
    if (this.openEntities.hasOwnProperty('[')) {
      this.error('Try to add a new url before finishing the previous one');
    }

    if (this.charAt(-1) === '!') {
      --this.i;
      this.slice(2);
      this.addToOpenEntities('[', ApiMessageEntityTypes.CustomEmoji);
    } else {
      this.slice(1);
      this.addToOpenEntities('[');
    }
  };

  private endUrl = () => {
    const entity = this.openEntities['['];
    if (entity && this.charAt(1) === '(') {
      this.slice(2);
      const { e, offset } = new UrlParser(this.text, entity, this.i).getEntity();
      this.slice(offset);
      this.addEntity(e, '[');
    } else {
      this.error('Missing an open url parenthesis or wrong char after it');
    }
  };

  protected charToAction = {
    '*': this.simple,
    _: this.underline,
    '~': this.simple,
    '|': this.spoiler,
    '\\': this.escape,
    '`': this.code,
    '>': this.quote,
    '\n': this.newLine,
    '[': this.startUrl,
    ']': this.endUrl,
  };
}
