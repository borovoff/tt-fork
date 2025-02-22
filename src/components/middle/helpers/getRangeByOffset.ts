export const getRangeByOffset = (e: HTMLElement | null, offset?: number, end?: number) => {
  const textNodeToOffset = new Map();
  const element = e as Node;
  let index = 0;
  let startContainer = element;
  let startOffset = 0;
  let endContainer = element;
  let endOffset = 0;

  const setOffset = (node: Node, length: number, textNode = true) => {
    textNodeToOffset.set(node, index);
    if (offset !== undefined && end !== undefined) {
      const nodeEnd = index + length;
      if (index <= offset && offset <= nodeEnd) {
        startContainer = node;
        startOffset = textNode ? offset - index : 0;
      }

      if (index < end && end <= nodeEnd) {
        endContainer = node;
        endOffset = textNode ? end - index : 0;
      }
    }

    index += length;
  };

  const checkNode = (node: ChildNode) => {
    const { nodeType, textContent } = node;
    if (nodeType === Node.COMMENT_NODE) {
      return;
    }

    if (node instanceof HTMLElement && (node.tagName === 'BR' || node.tagName === 'DIV')) {
      setOffset(node, 1, false);
    }

    if (nodeType === Node.TEXT_NODE && textContent) {
      setOffset(node, textContent.length);
    }

    [...node.childNodes].forEach(checkNode);
  };

  [...element.childNodes].forEach(checkNode);

  return {
    textNodeToOffset, startContainer, endContainer, startOffset, endOffset,
  };
};
