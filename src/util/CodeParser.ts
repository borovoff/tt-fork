import {BaseParser, CharToAction} from "./BaseParser";

export class CodeParser extends BaseParser {
  protected maxLength = 1000

  constructor(text: string) {
    super(text)
  }

  getEntity(text: string) {
    this.parse(text)
  }

  private code = () => {
  }
  
  protected charToAction = {
    '\\': this.escape,
    '`': this.code
  }
}
