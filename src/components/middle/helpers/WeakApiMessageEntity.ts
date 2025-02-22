import type { ApiMessageEntity } from '../../../api/types';

export type WeakApiMessageEntity = ApiMessageEntity & { url?: string };
