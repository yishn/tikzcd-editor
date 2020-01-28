function regexRule(regex) {
  return contents => {
    let match = regex.exec(contents)
    if (match == null) return null

    return match[0]
  }
}

function createTokenizer(rules) {
  return contents => {
    let tokens = []
    let [row, col, pos] = [0, 0, 0]

    while (contents.length > 0) {
      let value = null

      for (let type in rules) {
        value = rules[type](contents)
        if (value == null) continue

        if (type[0] !== '_') {
          tokens.push({
            type,
            value,
            row,
            col,
            pos
          })
        }

        break
      }

      if (value == null) {
        value = contents[0]

        tokens.push({
          type: 'invalid',
          value,
          row,
          col,
          pos
        })
      }

      // Update source position

      let newlineIndices = Array.from(value)
        .map((c, i) => (c === '\n' ? i : null))
        .filter(x => x != null)

      row += newlineIndices.length

      if (newlineIndices.length > 0) {
        col = value.length - newlineIndices.slice(-1)[0] - 1
      } else {
        col += value.length
      }

      pos += value.length
      contents = contents.slice(value.length)
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

export function tokenizeArrow(contents) {
  return createTokenizer({
    _whitespace: regexRule(/^\s+/),
    _comma: regexRule(/^,/),
    command: regexRule(/^\\arrow/),
    bracket: regexRule(/^[\[\]]/),
    alt: regexRule(/^'/),
    argName: regexRule(/^([a-zA-Z]+ )*[a-zA-Z]+/),
    argValue: regexRule(/^=\d+(em)?/),
    label: contents => {
      let label = parseLabel(contents)
      if (label == null) return null

      return label.match
    }
  })(contents)
}
