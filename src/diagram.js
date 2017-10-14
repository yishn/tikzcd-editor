import {h, render, Diagram, Node, Edge} from 'jsx-tikzcd'
import * as helper from './helper'

export function toJSON(diagram) {
    let leftTop = [0, 1].map(i => diagram.nodes.reduce(
        (min, node) => Math.min(min, node.position[i]),
        Infinity
    ))

    return JSON.stringify({
        nodes: diagram.nodes.map(node => ({
            ...node,
            id: undefined,
            position: node.position.map((x, i) => x - leftTop[i])
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
        id: helper.getId()
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
    return btoa(toJSON(diagram))
}

export function fromBase64(base64) {
    return fromJSON(atob(base64))
}

export function toTeX(diagram) {
    return render(
        <Diagram>
            {diagram.nodes.map((node, i) =>
                <Node
                    key={node.id}
                    position={node.position}
                    value={node.value}
                />
            )}

            {diagram.edges.map(edge => [
                <Edge
                    from={edge.from}
                    to={edge.to}
                    value={edge.value}
                    labelPosition={edge.labelPosition}
                    args={[
                        ...[edge.head, edge.line, edge.tail].map((id, i) => ({
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
                            solid: null
                        })[id]),

                        edge.bend > 0 ? `bend left=${edge.bend}`.replace('=30', '')
                        : edge.bend < 0 ? `bend right=${-edge.bend}`.replace('=30', '')
                        : null
                    ].filter(x => x != null)}
                />
            ])}
        </Diagram>
    )
}
