export const getRangeByOffset = (e: HTMLElement | null, offset?: number, end?: number) => {
  const textNodeToOffset = new Map()
  const element = e as Node
  let index = 0
  let startContainer = element
  let startOffset = 0
  let endContainer = element
  let endOffset = 0

  const checkNode = (node: ChildNode) => {
    const { nodeType, textContent } = node
    if (nodeType === Node.COMMENT_NODE) {
      return
    }

    if (nodeType === Node.TEXT_NODE && textContent) {
      textNodeToOffset.set(node, index)
      const { length } = textContent
      if (offset !== undefined && end !== undefined) {
        const nodeEnd = index + length
        if (index <= offset && offset < nodeEnd) {
          startContainer = node
          startOffset = offset - index
        }

        if (index < end && end <= nodeEnd) {
          endContainer = node
          endOffset = end - index
        }
      }

      index += length
    }

    [...node.childNodes].forEach(checkNode)
  }

  [...element.childNodes].forEach(checkNode)

  return { textNodeToOffset, startContainer, endContainer, startOffset, endOffset }
}
