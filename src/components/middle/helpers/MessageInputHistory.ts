import {ApiFormattedText} from "../../../api/types"
import {EntitiesDifference} from "./EntitiesDifference"
import {TextDifference} from "./TextDifference"

interface History {
  text: TextDifference
  entities: EntitiesDifference
}

export class MessageInputHistory {
  private currentIndex = -1
  private history: History[] = []

  add(next: ApiFormattedText, previous?: ApiFormattedText) {
    if (this.currentIndex < this.history.length - 1) {
      this.history.splice(this.currentIndex + 1)
    }
    const textDiff = TextDifference.diff(previous?.text ?? '', next.text)
    const previousDiff = this.history?.[this.history.length - 1]
    if (textDiff.next !== ' ' && textDiff.next !== '' && textDiff.previous === '' && previousDiff &&
        previousDiff.text.previous === '' && previousDiff.text.next !== '') {
      previousDiff.text.next += textDiff.next
    } else {
      this.history.push({
        text: textDiff,
        entities: EntitiesDifference.diff(previous?.entities ?? [], next.entities)
      })
    }
    this.currentIndex = this.history.length - 1
  }

  next({ text, entities }: ApiFormattedText) {
    if (!this.history.length || this.currentIndex >= this.history.length - 1) {
      return
    }
    ++this.currentIndex
    const h = this.history[this.currentIndex]
    return {
      text: TextDifference.next(h.text, text),
      entities: EntitiesDifference.next(h.entities, entities),
      offset: h.text.offset + h.text.next.length
    }
  }

  previous({ text, entities }: ApiFormattedText) {
    if (this.currentIndex < 0) {
      return
    }
    const h = this.history[this.currentIndex]
    --this.currentIndex
    return {
      text: TextDifference.previous(h.text, text),
      entities: EntitiesDifference.previous(h.entities, entities),
      offset: h.text.offset + h.text.previous.length
    }
  }
}
