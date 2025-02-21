import {ApiMessageEntity} from "../../../api/types"
import {sortEntities} from "./sortEntities"

export function getSlicedEntities(es?: ApiMessageEntity[]) {
  let entities = es?.filter(e => e.length).map(e => ({ ...e})) ?? []

  for (let i = 0; i < entities.length; i++) {
    const { offset, length } = entities[i]
    const newEntities = []
    for (let j = i + 1; j < entities.length; j++) {
      const innerEntity = entities[j]
      const end = offset + length
      if (innerEntity.offset < end) {
        const innerEnd = innerEntity.offset + innerEntity.length
        if (innerEnd > end) {
          const newLength = end - innerEntity.offset
          newEntities.push({ ...innerEntity, offset: end, length: innerEntity.length - newLength })
          innerEntity.length = newLength
        }
      } else {
        break
      }
    }
    entities.push(...newEntities)
    entities = sortEntities(entities) ?? []
  }

  return entities
}
