import {ApiFormattedText, ApiMessageEntity, ApiMessageEntityTextUrl, ApiMessageEntityTypes, ApiMessageEntityTypesDefault} from "../../../api/types";
import parseHtmlAsFormattedText from "../../../util/parseHtmlAsFormattedText";
import {getTextWithEntitiesAsHtml} from "../../common/helpers/renderTextWithEntities";

type Interval = { offset: number, length: number }
type WeakApiMessageEntity = ApiMessageEntity & { url?: string }

export class TransformFormattedText implements ApiFormattedText {
  text: string
  entities?: ApiMessageEntity[]

  constructor({text, entities}: ApiFormattedText) {
    this.text = text
    this.entities = entities
  }

  static getFormattedText(html: string) {
    return new TransformFormattedText(parseHtmlAsFormattedText(html))
  }

  getHtml() {
    return getTextWithEntitiesAsHtml(this)
  }

  getActiveTypes(entity: Interval) {
    return this.entities?.filter(e => {
      const result = this.isOverlapping(entity, e)
      if (!result) {
        return
      }

      const { offset1, end1, offset2, end2 } = result

      return offset1 >= offset2 && end1 <= end2
    })
  }

  private isOverlapping(entity1: Interval, entity2: ApiMessageEntity) {
    const offset1 = entity1.offset
    const end1 = offset1 + entity1.length - 1

    const offset2 = entity2.offset
    const end2 = offset2 + entity2.length - 1

    if (end1 + 1 < offset2 || end2 + 1 < offset1) {
      return
    }

    return { offset1, end1, offset2, end2 }
  }

  private getOverlappingInterval(entity1: Interval, entity2: ApiMessageEntity, add: boolean) {
    const result = this.isOverlapping(entity1, entity2)
    if (!result) {
      return
    }

    const { offset1, end1, offset2, end2 } = result

    const offset = Math.min(offset1, offset2)
    const end = Math.max(end1, end2)
    if (add) {
      return { ...entity2, offset, length: end - offset + 1 }
    } else {
      const overlapStart = Math.max(offset1, offset2)
      const overlapEnd = Math.min(end1, end2)
      return [
        { ...entity2, offset, length: overlapStart - offset },
        { ...entity2, offset: overlapEnd + 1, length: end - overlapEnd }
      ]
    }
  }

  private sort() {
    this.entities = this.entities?.filter(e => e.length > 0).sort((e1, e2) => e1.offset - e2.offset || e2.length - e1.length)
  }

  private pushSides(e1: ApiMessageEntity, e2: ApiMessageEntity, i: number) {
    this.entities?.splice(i, 1)
    if (e1.offset !== e2.offset || e1.length !== e2.length) {
      this.entities?.push(e1, e2)
      this.sort()
    }
  }

  recalculateEntities(entity: ApiMessageEntity, add = true) {
    if (!this.entities) {
      this.entities = [entity]
      return
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i] as WeakApiMessageEntity
      const { type, url } = entity as WeakApiMessageEntity
      if (e.type !== type) {
        continue
      }

      const result = this.getOverlappingInterval(entity, e, add)
      if (!result) {
        continue
      }

      const typeIsUrl = type === ApiMessageEntityTypes.TextUrl
      if (Array.isArray(result)) {
        const [e1, e2] = result
        if (typeIsUrl && url) {
          if (url === e.url) {
            return
          }

          this.pushSides(e1, e2, i)
          const offset = e1.offset + e1.length
          this.entities.push({ type, url, offset, length: e2.offset - offset })
          this.sort()
          return
        }
        this.pushSides(e1, e2, i)
        return
      }

      if (typeIsUrl && (!url || url !== e.url)) {
        // TODO: add logic for clear part of url or add 2 url
        continue
      }
      this.entities.splice(i, 1)
      entity = result
    }

    this.entities.push(entity)
    this.sort()
  }
}
