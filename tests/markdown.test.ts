import {ApiMessageEntityTypes} from "../src/api/types";
import {MarkdownParser} from "../src/util/MarkdownParser";

const parseMarkdownV2 = (t: string) => {
  const { entities, text } = new MarkdownParser(t).getFormattedText()
  console.log(entities)
  return { text, entities }
}

describe('MarkdownV2 Parser', () => {
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
          length: 16,
        },
        {
          type: ApiMessageEntityTypes.Italic,
          offset: 5,
          length: 11,
        },
        {
          type: ApiMessageEntityTypes.Italic,
          offset: 16,
          length: 7,
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
          length: 23,
        },
        {
          type: ApiMessageEntityTypes.Underline,
          offset: 5,
          length: 18,
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
      text: '*text with special characters: [ ] ( ) ~ ` > # + - = | { } . !*',
      entities: [],
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
          length: 9,
        },
        {
          type: ApiMessageEntityTypes.Strike,
          offset: 22,
          length: 13,
        },
        {
          type: ApiMessageEntityTypes.Code,
          offset: 36,
          length: 4,
        },
        {
          type: ApiMessageEntityTypes.TextUrl,
          offset: 41,
          length: 4,
          url: 'https://example.com',
        },
      ],
    };
    expect(parseMarkdownV2(input)).toEqual(expected);
  });

  test('Telegram example urls', () => {
    const input = `[inline mention of a user](tg://user?id=123456789)
![👍](tg://emoji?id=5368324170671202286) [inline URL](http://www.example.com/)`

    const expected = {
      text: 'inline mention of a user\n👍 inline URL',
      entities: [
        {type: "MessageEntityMentionName", offset: 0, length: 24, userId: "123456789"},
        {type: "MessageEntityCustomEmoji", offset: 25, length: 2, documentId: "5368324170671202286"},
        {type: "MessageEntityTextUrl", offset: 28, length: 10, url: "http://www.example.com/"}
      ],
    }
    expect(parseMarkdownV2(input)).toEqual(expected)
  })

  test('Telegram example simple', () => {
    const input = `*bold \\*text*`

    const expected = {
      text: 'bold *text',
      entities: [{type: "MessageEntityBold", offset: 0, length: 10}],
    }
    expect(parseMarkdownV2(input)).toEqual(expected)
  })

  test('Telegram example nested without blocks', () => {
    const input = `*bold \\*text*
_italic \\*text_
__underline__
~strikethrough~
||spoiler||
*bold _italic bold ~italic bold strikethrough ||italic bold strikethrough spoiler||~ __underline italic bold___ bold*`

    const expected = {
      text: `bold *text
italic *text
underline
strikethrough
spoiler
bold italic bold italic bold strikethrough italic bold strikethrough spoiler underline italic bold bold`,
      entities: [
        { type: 'MessageEntityBold', offset: 0, length: 10 },
        { type: 'MessageEntityItalic', offset: 11, length: 12 },
        { type: 'MessageEntityUnderline', offset: 24, length: 9 },
        { type: 'MessageEntityStrike', offset: 34, length: 13 },
        { type: 'MessageEntitySpoiler', offset: 48, length: 7 },
        { type: 'MessageEntityBold', offset: 56, length: 103 },
        { type: 'MessageEntityItalic', offset: 61, length: 93 },
        { type: 'MessageEntityStrike', offset: 73, length: 59 },
        { type: 'MessageEntitySpoiler', offset: 99, length: 33 },
        { type: 'MessageEntityUnderline', offset: 133, length: 21 }
      ],
    }
    expect(parseMarkdownV2(input)).toEqual(expected)
  })

  test('Telegram example code', () => {
    const input = `\`inline fixed-width code\`
\`\`\`
pre-formatted fixed-width code block
\`\`\`
\`\`\`python
in Python programming language
\`\`\``

    const expected = {
      text: `inline fixed-width code
pre-formatted fixed-width code block
in Python programming language`,
      entities: [
        { type: 'MessageEntityCode', offset: 0, length: 23 },
        { type: 'MessageEntityPre', offset: 24, length: 36, language: '' },
        {
          type: 'MessageEntityPre',
          offset: 61,
          length: 30,
          language: 'python'
        }
      ],
    }
    expect(parseMarkdownV2(input)).toEqual(expected)
  })

  test('Telegram example full', () => {
    const input = `*bold \*text*
_italic \*text_
__underline__
~strikethrough~
||spoiler||
*bold _italic bold ~italic bold strikethrough ||italic bold strikethrough spoiler||~ __underline italic bold___ bold*
[inline URL](http://www.example.com/)
![👍](tg://emoji?id=5368324170671202286)
\`inline fixed-width code\`
\`\`\`
pre-formatted fixed-width code block
\`\`\`
\`\`\`python
pre-formatted fixed-width code block written in the Python programming language
\`\`\`
>Block quotation started
>Block quotation continued
>Block quotation continued
>Block quotation continued
>The last line of the block quotation
**>The expandable block quotation started right after the previous block quotation
>It is separated from the previous block quotation by an empty bold entity
>Expandable block quotation continued
>Hidden by default part of the expandable block quotation started
>Expandable block quotation continued
>The last line of the expandable block quotation with the expandability mark||`
    console.log(parseMarkdownV2(input))

    const expected = {
      text: `bold text
italic text
underline
strikethrough
spoiler
bold italic bold italic bold strikethrough italic bold strikethrough spoiler underline italic bold bold
inline URL
👍
inline fixed-width code
pre-formatted fixed-width code block
pre-formatted fixed-width code block written in the Python programming language
Block quotation started
Block quotation continued
Block quotation continued
Block quotation continued
The last line of the block quotation
The expandable block quotation started right after the previous block quotation
It is separated from the previous block quotation by an empty bold entity
Expandable block quotation continued
Hidden by default part of the expandable block quotation started
Expandable block quotation continued
The last line of the expandable block quotation with the expandability mark`,
      entities: [
        { type: ApiMessageEntityTypes.Bold, offset: 0, length: 5 },
        { type: ApiMessageEntityTypes.Bold, offset: 9, length: 8 },
        { type: ApiMessageEntityTypes.Italic, offset: 10, length: 7 },
        { type: ApiMessageEntityTypes.Italic, offset: 17, length: 4 },
        { type: ApiMessageEntityTypes.Underline, offset: 22, length: 9 },
        { type: ApiMessageEntityTypes.Strike, offset: 32, length: 13 },
        { type: ApiMessageEntityTypes.Spoiler, offset: 46, length: 7 },
        { type: ApiMessageEntityTypes.Bold, offset: 54, length: 103 },
        { type: ApiMessageEntityTypes.Italic, offset: 59, length: 93 },
        { type: ApiMessageEntityTypes.Strike, offset: 71, length: 59 },
        { type: ApiMessageEntityTypes.Spoiler, offset: 97, length: 33 },
        { type: ApiMessageEntityTypes.Underline, offset: 131, length: 21 },
        { type: ApiMessageEntityTypes.TextUrl, offset: 158, length: 10, url: 'http://www.example.com/' },
        { type: ApiMessageEntityTypes.CustomEmoji, offset: 169, length: 2, documentId: '5368324170671202286' },
        { type: ApiMessageEntityTypes.Code, offset: 172, length: 23 },
        { type: ApiMessageEntityTypes.Pre, offset: 196, length: 36, language: '' },
        { type: ApiMessageEntityTypes.Pre, offset: 233, length: 79, language: 'python' },
        { type: ApiMessageEntityTypes.Blockquote, offset: 313, length: 138 },
        { type: ApiMessageEntityTypes.Blockquote, offset: 452, length: 368, canCollapse: true }
      ]
    }

    expect(parseMarkdownV2(input)).toEqual(expected)
  })

})
