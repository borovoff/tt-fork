import {ApiMessageEntityMentionName, ApiMessageEntityTextUrl, ApiMessageEntityTypes} from "../api/types";
import {BaseParser, CutEntity} from "./BaseParser";
import {SpecialParser} from "./SpecialParser";


export class UrlParser extends SpecialParser {
  protected maxLength = 100

  constructor(text: string, entity: CutEntity, i: number) {
    super(text, entity, i)
  }

  getEntity() {
    this.parse()

    return { e: this.entity, offset: this.i - this.startIndex }
  }

  private endUrl = () => {
    const url = this.text.slice(this.startIndex, this.i)
    ++this.i
    if (url) {
      const emojiPrefix = 'tg://emoji?id='
      if (this.entity.type === ApiMessageEntityTypes.CustomEmoji && url.startsWith(emojiPrefix)) {
        this.entity.documentId = url.replace(emojiPrefix, '')
        return true
      }

      const userPrefix = 'tg://user?id='
      if (url.startsWith(userPrefix)) {
        const e = this.entity as ApiMessageEntityMentionName
        e.userId = url.replace(userPrefix, '')
        e.type = ApiMessageEntityTypes.MentionName
        return true
      }

      const e = this.entity as ApiMessageEntityTextUrl
      e.url = url

      return true
    } else {
      this.error('The url is empty')
    }
  }

  protected charToAction = {
    '\\': this.escape,
    ')': this.endUrl
  }
}
