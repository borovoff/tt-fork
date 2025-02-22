import type {
  ApiFormattedText, ApiMessageEntity,
} from '../api/types';
import type { CharActions, MarkdownActions } from './BaseParser';
import { ApiMessageEntityTypes } from '../api/types';

import { emojiPrefix, userPrefix } from './UrlParser';

type Escaping = Partial<CharActions<true>>;
type MarkdownEntity = ApiMessageEntity & {
  language?: string;
  documentId?: string;
  userId?: string;
  url?: string;
  canCollapse?: boolean;
};
type ActionMap = Partial<Record<ApiMessageEntityTypes, (e?: MarkdownEntity) => string>>;

const codeEscaping: Escaping = {
  '`': true,
};

const escapingSymbols: Escaping = {
  ...codeEscaping,
  '*': true,
  _: true,
  '~': true,
  '|': true,
  '[': true,
  ']': true,
  '>': true,
};

const typeToSymbol: ActionMap = {
  [ApiMessageEntityTypes.Bold]: () => '*',
  [ApiMessageEntityTypes.Italic]: () => '_',
  [ApiMessageEntityTypes.Underline]: () => '__',
  [ApiMessageEntityTypes.Strike]: () => '~',
  [ApiMessageEntityTypes.Spoiler]: () => '||',
  [ApiMessageEntityTypes.Code]: () => '`',
};

const typeToSymbolLeft: ActionMap = {
  ...typeToSymbol,
  [ApiMessageEntityTypes.TextUrl]: () => '[',
  [ApiMessageEntityTypes.CustomEmoji]: () => '![',
  [ApiMessageEntityTypes.MentionName]: () => '[',
  [ApiMessageEntityTypes.Pre]: (e) => `\`\`\`${e?.language ?? ''}\n`,
  [ApiMessageEntityTypes.Blockquote]: () => '>',
};

const typeToSymbolRight: ActionMap = {
  ...typeToSymbol,
  [ApiMessageEntityTypes.TextUrl]: (e) => `](${e?.url})`,
  [ApiMessageEntityTypes.CustomEmoji]: (e) => `](${emojiPrefix}${e?.documentId})`,
  [ApiMessageEntityTypes.MentionName]: (e) => `](${userPrefix}${e?.userId})`,
  [ApiMessageEntityTypes.Pre]: () => '\n```',
  [ApiMessageEntityTypes.Blockquote]: (e) => (e?.canCollapse ? '||' : ''),
};

let offsetToSymbols: { [key: number]: string[] } = {};

const addKey = (offset: number, value?: string, left = true) => {
  if (!value) {
    return;
  }
  const v = offsetToSymbols[offset];
  if (v) {
    left ? v.push(value) : v.unshift(value);
  } else {
    offsetToSymbols[offset] = [value];
  }
};

const restoreEscaping = (unescapedText: string, entities?: ApiMessageEntity[]) => {
  const textParts = [];
  let textEnd = unescapedText;
  let mainOffset = 0;
  entities
    ?.filter((e) => e.type === ApiMessageEntityTypes.Code || e.type === ApiMessageEntityTypes.Pre)
    .forEach(({ offset, length }) => {
      textParts.push({ text: textEnd.slice(0, offset), escape: escapingSymbols, offset: mainOffset });
      mainOffset = offset + length;
      textParts.push({ text: textEnd.slice(offset, mainOffset), escape: codeEscaping, offset: mainOffset });
      textEnd = textEnd.slice(mainOffset);
    });

  textParts.push({ text: textEnd, escape: escapingSymbols, offset: mainOffset });

  textParts.forEach(({ text, escape, offset }) => [...text].forEach((char, i) => {
    if (text.charAt(i - 1) !== '\\' && escape[char as MarkdownActions]) {
      addKey(offset + i, '\\');
    }
  }));
};

const restoreBlockqouteSeparation = (text: string, entities?: ApiMessageEntity[]) => {
  const bqs = entities?.filter((e) => e.type === ApiMessageEntityTypes.Blockquote);
  if (!bqs) {
    return;
  }

  for (let i = 0; i < bqs.length - 1; i++) {
    const previous = bqs[i];
    const next = bqs[i + 1];
    const newLine = previous.offset + previous.length;
    if (!previous.canCollapse && (newLine + 1 === next.offset) && text.charAt(newLine) === '\n') {
      addKey(next.offset, '**', false);
    }
  }
};

const getSymbol = (i: number) => {
  return offsetToSymbols?.[i]?.join('') ?? '';
};

export function formattedTextToMarkdown({ entities, text }: ApiFormattedText) {
  offsetToSymbols = {};
  entities?.forEach((entity) => {
    const { type, offset, length } = entity;
    addKey(offset, typeToSymbolLeft[type]?.(entity));
    addKey(offset + length, typeToSymbolRight[type]?.(entity), false);

    if (type === ApiMessageEntityTypes.Blockquote) {
      const bq = text.slice(offset, offset + length);
      for (let i = 0; i < bq.length; i++) {
        const char = bq.charAt(i);
        if (char === '\n') {
          addKey(offset + i + 1, typeToSymbolLeft[type]?.());
        }
      }
    }
  });

  restoreBlockqouteSeparation(text, entities);
  restoreEscaping(text, entities);

  let markdown = '';
  let i = 0;
  for (; i < text.length; i++) {
    const s = getSymbol(i);
    markdown += s + text.charAt(i);
  }
  markdown += getSymbol(i);

  return markdown;
}
