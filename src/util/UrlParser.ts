import {ApiMessageEntityMentionName, ApiMessageEntityTextUrl, ApiMessageEntityTypes} from "../api/types";
import {BaseParser, CutEntity} from "./BaseParser";


export class UrlParser extends BaseParser {
  protected maxLength = 100
  private entity: CutEntity
  private startIndex: number

  constructor(text: string, entity: CutEntity, i: number) {
    super(text)
    this.entity = entity
    this.i = i
    this.startIndex = i
  }

  getEntity() {
    this.slice(2)
    this.parse()

    return { e: this.entity, i: this.i - this.startIndex + 2 }
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
