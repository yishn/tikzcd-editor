import t from 'tap'
import * as parser from '../src/parser'

t.test('parseLabel', async t => {
  let strings = [
    '"hi"',
    '"A\\times_{C,D} B"',
    '"{hello"world}"',
    '"hel{lo"world}"',
    '"hel{lo"wor}ld"',
    '"{]}"',
    '"{\\]}"',
    '"{\\\\]}"',
    '"{\\\\\\]}"',
    '"{\\}}"',
    '"{\\\\}"',
    '"{\\\\\\}}"',
    '"{\\ \\}}"',
    '"{\\{\\}\\}}"',
    'abcd"',
    '"abcd',
    '"hel{lo"world"',
    '"hel{lo"wo{rld}"'
  ]

  let labels = [
    {match: '"hi"', value: 'hi', wrapped: false},
    {match: '"A\\times_{C,D} B"', value: 'A\\times_{C,D} B', wrapped: false},
    {match: '"{hello"world}"', value: 'hello"world', wrapped: true},
    {match: '"hel{lo"world}"', value: 'hel{lo"world}', wrapped: false},
    {match: '"hel{lo"wor}ld"', value: 'hel{lo"wor}ld', wrapped: false},
    {match: '"{]}"', value: ']', wrapped: true},
    {match: '"{\\]}"', value: '\\]', wrapped: true},
    {match: '"{\\\\]}"', value: '\\\\]', wrapped: true},
    {match: '"{\\\\\\]}"', value: '\\\\\\]', wrapped: true},
    {match: '"{\\}}"', value: '\\}', wrapped: true},
    {match: '"{\\\\}"', value: '\\\\', wrapped: true},
    {match: '"{\\\\\\}}"', value: '\\\\\\}', wrapped: true},
    {match: '"{\\ \\}}"', value: '\\ \\}', wrapped: true},
    {match: '"{\\{\\}\\}}"', value: '\\{\\}\\}', wrapped: true},
    null,
    null,
    null,
    null
  ]

  for (let i = 0; i < strings.length; i++) {
    let label = parser.parseLabel(strings[i] + 'abc')
    t.strictDeepEqual(label, labels[i])
  }
})

t.test('tokenizeArrow', async t => {
  t.test('tokenize basic arrow', async t => {
    let tokens = parser.tokenizeArrow(
      '\\arrow[rr, "hi", hook\', bend left, shift left=2]'
    )
    let tokenTypes = tokens.map(token => token.type)
    let tokenValues = tokens.map(token => token.value)

    t.strictDeepEqual(tokenTypes, [
      'command',
      'bracket',
      'argName',
      'label',
      'argName',
      'alt',
      'argName',
      'argName',
      'argValue',
      'bracket'
    ])
    t.strictDeepEqual(tokenValues, [
      '\\arrow',
      '[',
      'rr',
      '"hi"',
      'hook',
      "'",
      'bend left',
      'shift left',
      '=2',
      ']'
    ])
  })

  t.test('tokenize loops', async t => {
    let tokens = parser.tokenizeArrow(
      '\\arrow["f"\', loop, distance=2em, in=305, out=235]'
    )
    let tokenTypes = tokens.map(token => token.type)
    let tokenValues = tokens.map(token => token.value)

    t.strictDeepEqual(tokenTypes, [
      'command',
      'bracket',
      'label',
      'alt',
      'argName',
      'argName',
      'argValue',
      'argName',
      'argValue',
      'argName',
      'argValue',
      'bracket'
    ])
    t.strictDeepEqual(tokenValues, [
      '\\arrow',
      '[',
      '"f"',
      "'",
      'loop',
      'distance',
      '=2em',
      'in',
      '=305',
      'out',
      '=235',
      ']'
    ])
  })

  t.test('tokenize invalid token', async t => {
    let tokens = parser.tokenizeArrow(
      '\\arrow["f"\', loop, distance=2em, in=, out=235]'
    )

    let invalidToken = tokens.find(token => token.type === 'invalid')

    t.ok(invalidToken != null)
    t.equal(invalidToken.value, '=')
  })
})
