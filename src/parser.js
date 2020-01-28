function regexRule(regex) {
  return contents => {
    let match = regex.exec(contents)
    if (match == null) return null

    return match[0].length
  }
}

function createTokenizer(rules, options = {}) {
  return (contents, opts = {}) => {
    opts = {...options, ...opts}

    let {shouldStop = token => false} = opts
    let tokens = []
    let [row, col, pos] = [0, 0, 0]

    while (contents.length > 0) {
      let token = null

      for (let [type, rule] of rules) {
        let length = rule(contents)
        if (length == null) continue

        let value = contents.slice(0, length)

        token = {
          type,
          value,
          row,
          col,
          pos
        }

        break
      }

      if (token == null) {
        let value = contents[0]

        token = {
          type: 'invalid',
          value,
          row,
          col,
          pos
        }
      }

      if (token.type[0] !== '_') tokens.push(token)
      if (shouldStop(token)) break

      // Update source position

      let newlineIndices = Array.from(token.value)
        .map((c, i) => (c === '\n' ? i : null))
        .filter(x => x != null)

      row += newlineIndices.length

      if (newlineIndices.length > 0) {
        col = token.value.length - newlineIndices.slice(-1)[0] - 1
      } else {
        col += token.value.length
      }

      pos += token.value.length
      contents = contents.slice(token.value.length)
    }

    return tokens
  }
}

export function parseLabel(contents) {
  if (contents[0] !== '"') return null

  let i = 1
  let braceNesting = 0
  let wrapped = contents[1] === '{'

  while (i < contents.length) {
    let c = contents[i]

    if (c === '"' && braceNesting <= 0) break
    if (c === '\\') i++
    if (c === '{') braceNesting++
    if (c === '}') {
      braceNesting--
      if (braceNesting === 0 && contents[i + 1] !== '"') wrapped = false
    }

    i++
  }

  if (contents[i] !== '"') return null

  return {
    match: contents.slice(0, i + 1),
    value: !wrapped ? contents.slice(1, i) : contents.slice(2, i - 1),
    wrapped
  }
}

export function parseNode(contents) {
  let i = 0

  while (i < contents.length) {
    let c = contents[i]

    if (
      ['&', '%'].includes(c) ||
      ['\\\\', '\\arrow[', '\\end{tikzcd}'].some(
        str => contents.slice(i, i + str.length) === str
      )
    ) {
      break
    }

    if (c === '\\') i++
    i++
  }

  let match = contents.slice(0, i).trim()
  if (match[match.length - 1] === '\\') match += contents[match.length]

  let wrapped = match[0] === '{' && match[match.length - 1] === '}'

  return {
    match,
    value: wrapped ? match.slice(1, -1) : match,
    wrapped
  }
}

export const tokenizeArrow = createTokenizer(
  [
    ['_whitespace', regexRule(/^\s+/)],
    ['_comma', regexRule(/^,/)],
    ['command', regexRule(/^\\arrow\[/)],
    ['end', regexRule(/^\]/)],
    ['alt', regexRule(/^'/)],
    ['argName', regexRule(/^([a-zA-Z]+ )*[a-zA-Z]+/)],
    ['argValue', regexRule(/^=\d+(em)?/)],
    [
      'label',
      contents => {
        let label = parseLabel(contents)
        if (label == null) return null

        return label.match.length
      }
    ]
  ],
  {
    shouldStop: token => ['invalid', 'end'].includes(token.type)
  }
)

export const tokenize = createTokenizer(
  [
    ['_whitespace', regexRule(/^\s+/)],
    ['_comment', regexRule(/^%.*/)],
    ['begin', regexRule(/^\\begin{tikzcd}/)],
    ['end', regexRule(/^\\end{tikzcd}/)],
    [
      'node',
      contents => {
        let {match} = parseNode(contents)
        return match.length === 0 ? null : match.length
      }
    ],
    [
      'arrow',
      contents => {
        if (!contents.startsWith('\\arrow[')) return null

        let tokens = tokenizeArrow(contents)
        let lastToken = tokens[tokens.length - 1]
        if (lastToken.type !== 'end') return null

        return lastToken.pos + 1
      }
    ],
    ['align', regexRule(/^&/)],
    ['newrow', regexRule(/^\\\\/)]
  ],
  {
    shouldStop: token => ['invalid', 'end'].includes(token.type)
  }
)
