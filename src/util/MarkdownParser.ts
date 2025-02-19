import {ApiMessageEntityBlockquote, ApiMessageEntityTypes} from "../api/types"
import {BaseParser, CutEntity, MarkdownSymbol, OpenEntities} from "./BaseParser"
import {UrlParser} from "./UrlParser"


export class MarkdownParser extends BaseParser {
  protected maxLength = 10000
  private openEntities: Partial<OpenEntities> = {}
  private entities: CutEntity[] = []

  constructor(text: string) {
    super(text)
    console.log(text)
  }

  getFormattedText() {
    this.parse()

    console.log(this.entities)
    console.log(this.text)

    return { entities: this.entities, text: this.text }
  }

  private simple = (symbol: MarkdownSymbol) => {
    const entity = this.openEntities[symbol]
    this.slice(symbol.length)
    if (entity) {
      this.addEntity(entity, symbol)
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
      this.simple('```')
    } else {
      this.simple('`')
    }
  }

  private addEntity = (entity: CutEntity, symbol: MarkdownSymbol) => {
    const length = this.i - entity.offset
    this.entities.push({ ...entity, length })
    delete this.openEntities[symbol]
  }

  private addToOpenEntities = (symbol: MarkdownSymbol, type?: ApiMessageEntityTypes) => {
    this.openEntities[symbol] = { type: type ? type : this.charToEntityType[symbol], offset: this.i, length: -1 }
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

  private startUrl = () => {
    if (this.openEntities.hasOwnProperty('[')) {
      this.error('Try to add a new url before finishing the previous one')
    }

    if (this.charAt(-1) === '!') {
      --this.i
      this.slice(2)
      this.addToOpenEntities('[', ApiMessageEntityTypes.CustomEmoji)
    } else {
      this.slice(1)
      this.addToOpenEntities('[')
    }
  }

  private endUrl = () => {
    const entity = this.openEntities['[']
    if (entity && this.charAt(1) === '(') {
      const { e, i } = new UrlParser(this.text, entity, this.i).getEntity()
      this.slice(i)
      this.addEntity(e, '[')
    } else {
      this.error('Missing an open url parenthesis or wrong char after it')
    }
  }

  protected charToAction = {
    '*': this.simple,
    '_': this.underline,
    '~': this.simple,
    '|': this.spoiler,
    '\\': this.escape,
    '`': this.code,
    '>': this.quote,
    '\n': this.newLine,
    '[': this.startUrl,
    ']': this.endUrl
  }
}
