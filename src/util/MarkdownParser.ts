import {ApiMessageEntity, ApiMessageEntityBlockquote, ApiMessageEntityTypes} from "../api/types"


interface KeyType<M> {
  '*': M,
  '_': M,
  '__': M,
  '~': M,
  '>': M,
  '```': M,
  '`': M,
  '||': M
}

type OpenEntities = KeyType<ApiMessageEntity>
type MarkdownSymbol = keyof OpenEntities


const charToEntityType = {
  '*': ApiMessageEntityTypes.Bold,
  '_': ApiMessageEntityTypes.Italic,
  '__': ApiMessageEntityTypes.Underline,
  '~': ApiMessageEntityTypes.Strike,
  '>': ApiMessageEntityTypes.Blockquote,
  '```': ApiMessageEntityTypes.Pre,
  '`': ApiMessageEntityTypes.Code,
  '||': ApiMessageEntityTypes.Spoiler
}


export class MarkdownParser {
  private openEntities: Partial<OpenEntities> = {}
  private entities = []
  private i = 0
  private text = ''

  private charAt = (shift = 0) => {
    return this.text.charAt(this.i + shift)
  }

  parse(text: string) {
    this.text = text
    let counter = 0
    while(this.i < this.text.length && counter < 10000) {
      ++counter
      const char = this.charAt() as MarkdownSymbol
      const a = this.charToAction[char]
      if (a) {
        a(char)
      } else {
        this.i++
      }
    }
    console.log(this.entities)
    console.log(this.text)
    console.log(text)

    return { entities: this.entities, text: this.text }
  }

  private simple = (symbol: MarkdownSymbol, additionAction = () => {}) => {
    const entity = this.openEntities[symbol]
    this.slice(symbol.length)
    if (entity) {
      this.addEntity(entity, symbol)
      additionAction()
    } else {
      this.addToOpenEntities(symbol)
    }
  }

  private quote = () => {
    if (this.charAt(-1) === '\n') {
      const quote = this.openEntities['>']
      this.slice(1)
      if (!quote) {
        this.addToOpenEntities('>')
      }
    } else {
      this.i++
    }
  }

  private newLine = () => {
    const entity = this.openEntities['>']
    if (this.charAt(1) !== '>' && entity) {
      this.addEntity(entity, '>')
    }
    this.i++
  }

  private code = () => {
    if (this.charAt(1) === '`' && this.charAt(2) === '`' && this.charAt(-1) === '\n') {
      this.simple('```', () => {
        this.openEntities = {}
      })
    } else {
      this.simple('`')
    }
  }

  private escape = () => {
    this.slice(1)
    this.i++
  }

  private slice = (length: number) => {
    this.text = this.text.slice(0, this.i) + this.text.slice(this.i + length)
  }

  private addEntity = (entity: ApiMessageEntity, symbol: keyof OpenEntities) => {
    const length = this.i - entity.offset
    this.entities.push({ ...entity, length })
    delete this.openEntities[symbol]
  }

  private addToOpenEntities = (symbol: string) => {
    this.openEntities[symbol] = { type: charToEntityType[symbol], offset: this.i }
  }

  private underline = () => {
    const symbol = this.charAt(1) === '_' ? '__' : '_'
    this.simple(symbol)
  }

  private spoiler = () => {
    if (this.charAt(1) === '|') {
      const quote = this.openEntities['>'] as ApiMessageEntityBlockquote
      if (!this.openEntities.hasOwnProperty('||') && quote && 
          (this.charAt(2) === '\n' || this.i + 2 === this.text.length)) {
        quote.canCollapse = true
        this.addEntity(quote, '>')
      } else {
        this.simple('||')
      }
    }
  }

  private charToAction = {
    '*': this.simple,
    '_': this.underline,
    '~': this.simple,
    '|': this.spoiler,
    '\\': this.escape,
    '`': this.code,
    '>': this.quote,
    '\n': this.newLine
  }
}
