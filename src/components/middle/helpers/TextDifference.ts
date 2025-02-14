export class TextDifference {
  previous!: string
  next!: string
  offset!: number

  private static reverse(s: string) {
    let result = ''
    for (let i = s.length - 1; i >= 0; i--) {
      result += s.charAt(i)
    }
    return result
  }

  static diff(previous = '', next = '') {
    if (previous === next) {
      return { previous: '', next: '', offset: 0 }
    }

    let big = next
    let small = previous

    const previousIsBigger = previous.length > next.length
    if (previousIsBigger) {
      big = previous
      small = next
    }

    const bigLength = big.length
    const smallLength = small.length

    let i = 0
    for (; i < smallLength; i++) {
      if (big.charAt(i) !== small.charAt(i)) {
        break
      }
    }

    const reverseBig = TextDifference.reverse(big.substring(i))
    const reverseSmall = TextDifference.reverse(small.substring(i))

    let j = 0
    for (; j < reverseSmall.length; j++) {
      if (reverseBig.charAt(j) !== reverseSmall.charAt(j)) {
        break
      }
    }

    let nextJ = bigLength - j
    let previousJ = smallLength - j
    if (previousIsBigger) {
      const copy = nextJ
      nextJ = previousJ
      previousJ = copy
    }

    return { previous: previous.substring(i, previousJ), next: next.substring(i, nextJ), offset: i }
  }

  static previous({ previous, next, offset }: TextDifference, current: string) {
    return `${current.slice(0, offset)}${previous}${current.slice(offset + next.length)}`
  }

  static next({ previous, next, offset }: TextDifference, current: string) {
    return `${current.slice(0, offset)}${next}${current.slice(offset + previous.length)}`
  }
}
