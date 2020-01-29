import {regexRule, createTokenizer} from 'doken'

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

export const tokenizeArrow = createTokenizer({
  rules: [
    regexRule('_whitespace', /^\s+/),
    regexRule('_comma', /^,/),
    regexRule('command', /^\\arrow\[/),
    regexRule('end', /^\]/),
    regexRule('alt', /^'/),
    regexRule('argName', /^([a-zA-Z]+ )*[a-zA-Z]+/),
    regexRule('argValue', /^=\d+(em)?/),
    {
      type: 'label',
      match: contents => {
        let label = parseLabel(contents)
        if (label == null) return null

        return {length: label.match.length}
      }
    }
  ],
  shouldStop: token => [null, 'end'].includes(token.type)
})

export const tokenize = createTokenizer({
  rules: [
    regexRule('_whitespace', /^\s+/),
    regexRule('_comment', /^%.*/),
    regexRule('begin', /^\\begin{tikzcd}/),
    regexRule('end', /^\\end{tikzcd}/),
    {
      type: 'node',
      match: contents => {
        let {match} = parseNode(contents)
        return match.length === 0 ? null : {length: match.length}
      }
    },
    {
      type: 'arrow',
      match: contents => {
        if (!contents.startsWith('\\arrow[')) return null

        let tokens = [...tokenizeArrow(contents)]
        let lastToken = tokens[tokens.length - 1]
        if (lastToken.type !== 'end') return null

        return {length: lastToken.pos + 1}
      }
    },
    regexRule('align', /^&/),
    regexRule('newrow', /^\\\\/)
  ],
  shouldStop: token => [null, 'end'].includes(token.type)
})
