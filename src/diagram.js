import {h, render, Diagram, Node, Edge} from 'jsx-tikzcd'
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent
} from 'lz-string'

import {
  getId,
  arrEquals,
  arrSubtract,
  b64DecodeUnicode,
  b64EncodeUnicode
} from './helper'

export function toJSON(diagram) {
  let leftTop = [0, 1].map(i =>
    diagram.nodes.reduce(
      (min, node) => Math.min(min, node.position[i]),
      Infinity
    )
  )

  return JSON.stringify({
    nodes: diagram.nodes.map(node => ({
      ...node,
      id: undefined,
      position: arrSubtract(node.position, leftTop)
    })),

    edges: diagram.edges.map(edge => ({
      ...edge,
      from: diagram.nodes.findIndex(node => node.id === edge.from),
      to: diagram.nodes.findIndex(node => node.id === edge.to)
    }))
  })
}

export function fromJSON(json) {
  let obj = JSON.parse(json)
  let nodes = obj.nodes.map(node => ({
    ...node,
    id: getId()
  }))

  return {
    nodes,
    edges: obj.edges.map(edge => ({
      ...edge,
      from: nodes[edge.from].id,
      to: nodes[edge.to].id
    }))
  }
}

export function toBase64(diagram) {
  return b64EncodeUnicode(toJSON(diagram))
}

export function fromBase64(base64) {
  return fromJSON(b64DecodeUnicode(base64))
}

export function toCompressedBase64(diagram) {
  return compressToEncodedURIComponent(toJSON(diagram))
}

export function fromCompressedBase64(compressed) {
  return fromJSON(decompressFromEncodedURIComponent(compressed))
}

export function toTeX(diagram) {
  return render(
    <Diagram>
      {diagram.nodes.map((node, i) => (
        <Node key={node.id} position={node.position} value={node.value} />
      ))}

      {diagram.edges.map(edge => [
        <Edge
          from={edge.from}
          to={edge.to}
          value={edge.value}
          labelPosition={edge.labelPosition}
          args={[
            ...[
              edge.head,
              edge.line,
              edge.tail,
              edge.labelPositionLongitudinal
            ].map(
              (id, i) =>
                ({
                  none: ['no head', null, null][i],
                  default: null,
                  harpoon: 'harpoon',
                  harpoonalt: "harpoon'",
                  hook: 'hook',
                  hookalt: "hook'",
                  mapsto: 'maps to',
                  tail: 'tail',
                  twoheads: 'two heads',
                  dashed: 'dashed',
                  dotted: 'dotted',
                  solid: null,
                  center: null,
                  nearstart: 'near start',
                  nearend: 'near end',
                  verynearstart: 'very near start',
                  verynearend: 'very near end'
                }[id])
            ),

            edge.bend > 0
              ? `bend left=${edge.bend}`.replace(/=30$/, '')
              : edge.bend < 0
              ? `bend right=${-edge.bend}`.replace(/=30$/, '')
              : null,

            edge.shift < 0
              ? `shift left=${-edge.shift}`.replace(/=1$/, '')
              : edge.shift > 0
              ? `shift right=${edge.shift}`.replace(/=1$/, '')
              : null,

            ...(edge.loop != null
              ? (() => {
                  let [angle, clockwise] = edge.loop || [0, false]
                  let [inAngle, outAngle] = [
                    (235 + angle + 360) % 360,
                    (305 + angle + 360) % 360
                  ]
                  if (!clockwise) {
                    ;[inAngle, outAngle] = [outAngle, inAngle]
                  }
                  return [
                    'loop',
                    'distance=2em',
                    `in=${inAngle}`,
                    `out=${outAngle}`
                  ]
                })()
              : [])
          ].filter(x => x != null)}
        />
      ])}
    </Diagram>,
    {align: true}
  )
}

export function fromTeX(code) {
  let nodes = []
  let edges = []
  let x = 0
  let y = 0

  // Remove comments
  code = code.replace(/%.*/g, '')

  let consumers = [
    {string: '\\begin{tikzcd}'},
    {string: '\\end{tikzcd}'},
    {
      string: '&',
      callback: () => {
        x++
      }
    },
    {
      string: '\\\\',
      callback: () => {
        y++
        x = 0
      }
    },
    {
      string: '\\arrow[',
      callback: () => {
        // get arrow definition
        let parts = code.split(']')
        let definition = parts.shift()
        code = parts.join(']')

        parts = definition.split(',')
        let dir = ''
        if (/^[dlru]+$/.test(parts[0])) dir = parts[0]

        let to_x = x + (dir.split('r').length - 1) - (dir.split('l').length - 1)
        let to_y = y + (dir.split('d').length - 1) - (dir.split('u').length - 1)

        let from = [x, y]
        let to = [to_x, to_y]

        let edge = {
          from,
          to
        }

        // label
        if (parts.length > 1 && parts[1].includes('"')) {
          let valueMatcher
          if (parts[1].includes('"{')) {
            valueMatcher = /"{(.*)}"/
          } else {
            valueMatcher = /"(.*)"/
          }
          let match = parts[1].match(valueMatcher)
          if (!match || match.length !== 2) {
            throw new Error('Could not match edge label.')
          }
          edge.value = match[1]

          // label position
          if (parts[1].endsWith("'")) {
            edge.labelPosition = 'right'
          }
          if (parts[1].endsWith('description')) {
            edge.labelPosition = 'inside'
          }
        }

        // label position longitudinal
        if (definition.includes('near start')) {
          edge.labelPositionLongitudinal = 'nearstart'
        }
        if (definition.includes('very near start')) {
          edge.labelPositionLongitudinal = 'verynearstart'
        }
        if (definition.includes('near end')) {
          edge.labelPositionLongitudinal = 'nearend'
        }
        if (definition.includes('very near end')) {
          edge.labelPositionLongitudinal = 'verynearend'
        }

        // head
        if (definition.includes('harpoon')) {
          edge.head = 'harpoon'
        }
        if (definition.includes("harpoon'")) {
          edge.head = 'harpoonalt'
        }
        if (definition.includes('two heads')) {
          edge.head = 'twoheads'
        }
        if (definition.includes('no head')) {
          edge.head = 'none'
        }

        // tail
        if (definition.includes('hook')) {
          edge.tail = 'hook'
        }
        if (definition.includes("hook'")) {
          edge.tail = 'hookalt'
        }
        if (definition.includes('maps to')) {
          edge.tail = 'mapsto'
        }

        // line
        if (definition.includes('dashed')) {
          edge.line = 'dashed'
        }
        if (definition.includes('dotted')) {
          edge.line = 'dotted'
        }

        // bend
        if (definition.includes('bend left')) {
          let match = definition.match(/bend left=(\d+)/)
          if (match && match.length > 1) {
            edge.bend = parseInt(match[1])
          } else {
            edge.bend = 30
          }
        }
        if (definition.includes('bend right')) {
          let match = definition.match(/bend right=(\d+)/)
          if (match && match.length > 1) {
            edge.bend = -parseInt(match[1])
          } else {
            edge.bend = -30
          }
        }

        // shift
        if (definition.includes('shift left')) {
          let match = definition.match(/shift left=(\d+)/)
          if (match && match.length > 1) {
            edge.shift = -parseInt(match[1])
          } else {
            edge.shift = -1
          }
        }
        if (definition.includes('shift right')) {
          let match = definition.match(/shift right=(\d+)/)
          if (match && match.length > 1) {
            edge.shift = parseInt(match[1])
          } else {
            edge.shift = 1
          }
        }

        // loop
        if (definition.includes('loop')) {
          let [inAngle, outAngle] = [
            definition.match(/in=(-?\d+)/),
            definition.match(/out=(-?\d+)/)
          ]
          if (
            inAngle &&
            outAngle &&
            inAngle.length > 1 &&
            outAngle.length > 1
          ) {
            ;[inAngle, outAngle] = [parseInt(inAngle[1]), parseInt(outAngle[1])]
            let angle = ((inAngle + outAngle) / 2 + 90) % 360
            if ((outAngle - inAngle + 360) % 360 < 180) {
              edge.loop = [angle, true]
            } else {
              edge.loop = [angle, false]
            }
          } else {
            edge.loop = [0, false]
          }
        }

        edges.push(edge)
      }
    },
    {
      string: '',
      callback: () => {
        let splitIndex = Math.min(
          ...[
            code.indexOf('&'),
            code.indexOf('\n'),
            code.indexOf('\\\\'),
            code.indexOf('\\arrow')
          ].filter(val => val > -1)
        )
        let value = code.substring(0, splitIndex)
        value = value.trim()
        code = code.substring(splitIndex)

        if (value.startsWith('{') && value.endsWith('}')) {
          value = value.substring(1, value.length - 1)
        }

        let node = {
          position: [x, y],
          value
        }
        nodes.push(node)
      }
    }
  ]

  while (code.length !== 0) {
    code = code.trim()
    let consumed = false
    for (let consumer of consumers) {
      if (code.startsWith(consumer.string)) {
        code = code.replace(consumer.string, '')
        if (consumer.callback) {
          consumer.callback()
        }
        consumed = true
        break
      }
    }
    if (!consumed) {
      throw new Error('Cannot parse the code further.')
    }
  }

  function convertPositionToIndex(edge) {
    let from = edge.from
    let to = edge.to

    let fromIndex = nodes.findIndex(node => arrEquals(node.position, from))
    let toIndex = nodes.findIndex(node => arrEquals(node.position, to))

    if (fromIndex === -1) {
      let node = {
        position: from,
        value: ''
      }
      nodes.push(node)
      fromIndex = nodes.length - 1

      // Account for loops.
      if (arrEquals(from, to)) toIndex = fromIndex
    }

    if (toIndex === -1) {
      let node = {
        position: to,
        value: ''
      }
      nodes.push(node)
      toIndex = nodes.length - 1
    }

    edge.from = fromIndex
    edge.to = toIndex
  }

  edges.forEach(convertPositionToIndex)

  return fromJSON(JSON.stringify({nodes, edges}))
}
