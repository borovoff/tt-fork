import {ApiMessageEntity} from "../../../api/types"
import {FormattedText} from "./FormattedText"

export class EntitiesDifference {
  previous!: ApiMessageEntity[]
  next!: ApiMessageEntity[]

  static hashify(entity: ApiMessageEntity | ApiMessageEntity[]) {
    return JSON.stringify(entity)
  }

  static diff(previous: ApiMessageEntity[] = [], next: ApiMessageEntity[] = []) {
    const previousSet = new Set(previous.map((e) => EntitiesDifference.hashify(e)))
    const nextSet = new Set(next.map((e) => EntitiesDifference.hashify(e)))

    const p = previous.filter((e) => !nextSet.has(EntitiesDifference.hashify(e)))
    const n = next.filter((e) => !previousSet.has(EntitiesDifference.hashify(e)))

    return { previous: p, next: n }
  }

  static previous({ previous, next }: EntitiesDifference, current: ApiMessageEntity[] = []) {
    const nextSet = new Set(next.map((e) => EntitiesDifference.hashify(e)))
    const filteredCurrent = current.filter((e) => !nextSet.has(EntitiesDifference.hashify(e)))
    return FormattedText.sort([...filteredCurrent, ...previous])
  }

  static next({ previous, next }: EntitiesDifference, current: ApiMessageEntity[] = []) {
    const previousSet = new Set(previous.map((e) => EntitiesDifference.hashify(e)))
    const filteredCurrent = current.filter((e) => !previousSet.has(EntitiesDifference.hashify(e)))
    return FormattedText.sort([...filteredCurrent, ...next])
  }
}
