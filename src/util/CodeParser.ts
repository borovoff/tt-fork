import {ApiMessageEntityTypes} from "../api/types";
import {CutEntity} from "./BaseParser";
import {SpecialParser} from "./SpecialParser";


export class CodeParser extends SpecialParser {
  protected maxLength = 1000

  constructor(text: string, entity: CutEntity, i: number) {
    super(text, entity, i)
  }

  getOffset() {
    this.parse()

    return this.i - this.startIndex
  }

  private newLine = () => {
    if (this.entity.type === ApiMessageEntityTypes.Pre && this.entity.language === undefined) {
      this.entity.language = this.text.slice(this.startIndex, this.i)
      const length = this.i - this.startIndex
      this.i -= length
      this.slice(length + 1)
    } else {
      this.i++
    }
  }

  private code = () => {
    if ((this.entity.type === ApiMessageEntityTypes.Pre && this.isPre()) || this.entity.type === ApiMessageEntityTypes.Code) {
      this.entity.length = this.i - this.entity.offset
      return true
    }

    this.error('Wrong code block syntax')
  }
  
  protected charToAction = {
    '\\': this.escape,
    '`': this.code,
    '\n': this.newLine
  }
}
