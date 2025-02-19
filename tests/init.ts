import {ApiMessageEntityTypes} from "../src/api/types";
import {MarkdownParser} from "../src/util/MarkdownParser";

const parseMarkdownV2 = (text: string) => {
  return new MarkdownParser(text).getFormattedText()
}

describe('MarkdownV2 Telegram Parser (ApiMessageEntity and Plain Text)', () => {
  test('Bold Text', () => {
    const input = '*bold text*';
    const expected = {
      text: 'bold text',
      entities: [
        {
          type: ApiMessageEntityTypes.Bold,
          offset: 0,
          length: 9,
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Italic Text', () => {
    const input = '_italic text_';
    const expected = {
      text: 'italic text',
      entities: [
        {
          type: ApiMessageEntityTypes.Italic,
          offset: 0,
          length: 11,
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Underlined Text', () => {
    const input = '__underlined text__';
    const expected = {
      text: 'underlined text',
      entities: [
        {
          type: ApiMessageEntityTypes.Underline,
          offset: 0,
          length: 15,
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Strike Text', () => {
    const input = '~strikethrough text~';
    const expected = {
      text: 'strikethrough text',
      entities: [
        {
          type: ApiMessageEntityTypes.Strike,
          offset: 0,
          length: 18,
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Inline Code', () => {
    const input = '`inline code`';
    const expected = {
      text: 'inline code',
      entities: [
        {
          type: ApiMessageEntityTypes.Code,
          offset: 0,
          length: 11,
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Preformatted Code Block', () => {
    const input = '```preformatted code```';
    const expected = {
      text: 'preformatted code',
      entities: [
        {
          type: ApiMessageEntityTypes.Pre,
          offset: 0,
          length: 17,
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Links', () => {
    const input = '[Google](https://google.com)';
    const expected = {
      text: 'Google',
      entities: [
        {
          type: ApiMessageEntityTypes.TextUrl,
          offset: 0,
          length: 6,
          url: 'https://google.com',
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Escaping Special Characters', () => {
    const input = '\\*escaped asterisk\\*';
    const expected = {
      text: '*escaped asterisk*',
      entities: [],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Mixed Formatting', () => {
    const input = '*bold _italic bold* italic_';
    const expected = {
      text: 'bold italic bold italic',
      entities: [
        {
          type: ApiMessageEntityTypes.Bold,
          offset: 0,
          length: 17,
        },
        {
          type: ApiMessageEntityTypes.Italic,
          offset: 5,
          length: 12,
        },
        {
          type: ApiMessageEntityTypes.Italic,
          offset: 18,
          length: 6,
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Nested Formatting', () => {
    const input = '*bold __underline and bold__*';
    const expected = {
      text: 'bold underline and bold',
      entities: [
        {
          type: ApiMessageEntityTypes.Bold,
          offset: 0,
          length: 22,
        },
        {
          type: ApiMessageEntityTypes.Underline,
          offset: 5,
          length: 17,
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Multiple Lines', () => {
    const input = '*line 1*\n_line 2_';
    const expected = {
      text: 'line 1\nline 2',
      entities: [
        {
          type: ApiMessageEntityTypes.Bold,
          offset: 0,
          length: 6,
        },
        {
          type: ApiMessageEntityTypes.Italic,
          offset: 7,
          length: 6,
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Empty Input', () => {
    const input = '';
    const expected = {
      text: '',
      entities: [],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Invalid Formatting', () => {
    const input = '*unclosed bold';
    const expected = {
      text: '*unclosed bold',
      entities: [],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Special Characters in Text', () => {
    const input = '*text with special characters: [ ] ( ) ~ ` > # + - = | { } . !*';
    const expected = {
      text: 'text with special characters: [ ] ( ) ~ ` > # + - = | { } . !',
      entities: [
        {
          type: ApiMessageEntityTypes.Bold,
          offset: 0,
          length: 52,
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Complex Mixed Formatting', () => {
    const input = '*bold* _italic_ __underline__ ~strikethrough~ `code` [link](https://example.com)';
    const expected = {
      text: 'bold italic underline strikethrough code link',
      entities: [
        {
          type: ApiMessageEntityTypes.Bold,
          offset: 0,
          length: 4,
        },
        {
          type: ApiMessageEntityTypes.Italic,
          offset: 5,
          length: 6,
        },
        {
          type: ApiMessageEntityTypes.Underline,
          offset: 12,
          length: 10,
        },
        {
          type: ApiMessageEntityTypes.Strike,
          offset: 23,
          length: 13,
        },
        {
          type: ApiMessageEntityTypes.Code,
          offset: 37,
          length: 4,
        },
        {
          type: ApiMessageEntityTypes.TextUrl,
          offset: 42,
          length: 4,
          url: 'https://example.com',
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });
});
