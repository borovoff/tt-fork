import { getRangeByOffset } from './getRangeByOffset';

export const getOffsetByRange = (e: HTMLElement | null, {
  startContainer, endContainer, startOffset, endOffset,
}: Range) => {
  const { textNodeToOffset } = getRangeByOffset(e);
  const offset = textNodeToOffset.get(startContainer) + startOffset;
  const length = textNodeToOffset.get(endContainer) + endOffset - offset;

  return { offset, length };
};
