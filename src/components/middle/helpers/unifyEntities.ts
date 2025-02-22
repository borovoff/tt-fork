import type { ApiMessageEntity, ApiMessageEntityTypes } from '../../../api/types';
import type { WeakApiMessageEntity } from './WeakApiMessageEntity';

import { sortEntities } from './sortEntities';

export function unifyEntities(disconnectedEntities?: ApiMessageEntity[]) {
  if (!disconnectedEntities) {
    return;
  }

  const entityObject = disconnectedEntities.reduce((accumulator, current: WeakApiMessageEntity) => {
    const { type } = current;
    if (accumulator.hasOwnProperty(type)) {
      const entities = accumulator[type];
      const entity = entities[entities.length - 1];
      if ((entity.offset + entity.length === current.offset) && entity.url === current.url) {
        entity.length += current.length;
      } else {
        entities.push(current);
      }
    } else {
      accumulator[type] = [current];
    }

    return { ...accumulator };
  }, {} as { [key in ApiMessageEntityTypes]: WeakApiMessageEntity[] });

  const es = Object.values(entityObject).reduce((accumulator, current) => ([...accumulator, ...current]), []);
  return sortEntities(es);
}
