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
import {parse} from './parser'

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
          labelPosition={edge.line === 'none' ? null : edge.labelPosition}
          args={[
            ...[
              edge.head,
              edge.line,
              edge.tail,
              edge.labelPositionLongitudinal
            ].map(
              (id, i) =>
                ({
                  double: 'Rightarrow',
                  solid: null,
                  dashed: 'dashed',
                  dotted: 'dotted',
                  none: [
                    edge.line === 'none' ? null : 'no head',
                    'phantom',
                    null
                  ][i],
                  default: null,
                  harpoon: 'harpoon',
                  harpoonalt: "harpoon'",
                  hook: 'hook',
                  hookalt: "hook'",
                  mapsto: 'maps to',
                  tail: 'tail',
                  twoheads: 'two heads',
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
                  let [inAngle, outAngle] = [235, 305].map(
                    x => (x + angle + 360) % 360
                  )
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
  let diagram = parse(code)
  return fromJSON(JSON.stringify(diagram))
}
