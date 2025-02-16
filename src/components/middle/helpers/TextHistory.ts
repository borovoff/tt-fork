import {ApiFormattedText} from "../../../api/types"
import {EntitiesDifference} from "./EntitiesDifference"
import {TextDifference} from "./TextDifference"

interface History {
  text: TextDifference
  entities: EntitiesDifference
}

export class TextHistory {
  private currentIndex = -1
  private history: History[] = []

  reinit() {
    this.currentIndex = -1
    this.history = []
  }

  add(next: ApiFormattedText, previous?: ApiFormattedText) {
    const textDiff = TextDifference.diff(previous?.text ?? '', next.text)
    const entityDiff = EntitiesDifference.diff(previous?.entities ?? [], next.entities)

    if (textDiff.next === '' && textDiff.previous === '' &&
        entityDiff.next.length === 0 && entityDiff.previous.length === 0) {
      return
    }

    if (this.currentIndex < this.history.length - 1) {
      this.history.splice(this.currentIndex + 1)
    }

    const previousDiff = this.history?.[this.history.length - 1]
    if (!textDiff.next.startsWith(' ') && textDiff.next !== '' && textDiff.previous === '' && previousDiff &&
        previousDiff.text.previous === '' && previousDiff.text.next !== '' && !previousDiff.text.next.endsWith(' ') &&
        previousDiff.text.offset + previousDiff.text.next.length === textDiff.offset)  {
      previousDiff.text.next += textDiff.next
    } else {
      this.history.push({
        text: textDiff,
        entities: entityDiff
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

export const textHistory = new TextHistory()
