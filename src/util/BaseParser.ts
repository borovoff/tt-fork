import {ApiMessageEntity, ApiMessageEntityTypes} from "../api/types"

type ActionsAndSyntax<M> = Record<'*' | '_' | '~' | '>' | '`' | '[', M>
type OnlyAction<M> = Record<'\\' | '\n' | ']' | '|', M>
type OnlySyntax<M> = Record<'__' | '```' | '||', M>
type CharActions<M> = ActionsAndSyntax<M> & OnlyAction<M>
type SyntaxSymbols<M> = ActionsAndSyntax<M> & OnlySyntax<M>

export type CutEntity = Pick<ApiMessageEntity, 'type' | 'offset' | 'length'> & Partial<ApiMessageEntity>
export type OpenEntities = SyntaxSymbols<CutEntity>
export type MarkdownSymbol = keyof SyntaxSymbols<null>
export type MarkdownActions = keyof CharActions<null>
export type CharToAction = Partial<CharActions<(s: MarkdownSymbol) => undefined | boolean | void>>


export abstract class BaseParser {
  protected abstract charToAction: CharToAction
  protected abstract maxLength: number

  protected i = 0
  protected slicedChars = 0
  protected text = ''
  protected charToEntityType: SyntaxSymbols<ApiMessageEntityTypes> = {
    '*': ApiMessageEntityTypes.Bold,
    '_': ApiMessageEntityTypes.Italic,
    '__': ApiMessageEntityTypes.Underline,
    '~': ApiMessageEntityTypes.Strike,
    '>': ApiMessageEntityTypes.Blockquote,
    '```': ApiMessageEntityTypes.Pre,
    '`': ApiMessageEntityTypes.Code,
    '||': ApiMessageEntityTypes.Spoiler,
    '[': ApiMessageEntityTypes.TextUrl
  }

  constructor(text: string) {
    this.text = text
  }

  protected parse() {
    let counter = 0
    while(this.i < this.text.length) {
      if (counter > this.maxLength) {
        this.error(`Maximum string length is exceeded, more than ${this.maxLength}`)
      }
      ++counter
      const char = this.charAt() as MarkdownActions
      const a = this.charToAction[char]
      if (a) {
        const result = a(char as MarkdownSymbol)
        if (result) {
          return
        }
      } else {
        this.i++
      }
    }
  }

  protected isPre = () => {
    return this.charAt(1) === '`' && this.charAt(2) === '`'
  }

  protected charAt = (shift = 0) => {
    return this.text.charAt(this.i + shift)
  }

  protected escape = () => {
    this.slice(1)
    this.i++
  }

  protected slice = (length: number) => {
    this.text = this.text.slice(0, this.i) + this.text.slice(this.i + length)
    this.slicedChars += length
  }

  protected error = (error: string) => {
    throw new Error(`${error}, offset: ${this.i + this.slicedChars}`)
  }
}
