import {h, render, Diagram, Node, Edge} from 'jsx-tikzcd'

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
                    from={edge.from.toString()}
                    to={edge.to.toString()}
                    value={edge.value}
                    labelPosition={edge.labelPosition}
                    args={[
                        ...[edge.head, edge.line, edge.tail].map((id, i) => ({
                            none: ['no head', null][i],
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
