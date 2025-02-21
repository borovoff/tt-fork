import {ApiMessageEntity} from "../../../api/types";

export function sortEntities(entities?: ApiMessageEntity[]) {
  return entities?.sort((e1, e2) => e1.offset - e2.offset || e2.length - e1.length)
}
