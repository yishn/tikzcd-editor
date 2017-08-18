import {h, Component} from 'preact'
import {h as th, render as renderToTeX, Diagram, Node, Edge} from 'jsx-tikzcd'
import copy from 'copy-text-to-clipboard'

import Grid from './grid'
import Toolbox from './toolbox'

export default class App extends Component {
    constructor() {
        super()

        this.state = {
            tool: 'pan',
            diagram: {
                nodes: [
                    {position: [1, 1], value: 'T'},
                    {position: [2, 1], value: 'X'},
                    {position: [2, 2], value: 'Z'},
                    {position: [1, 2], value: 'Y'},
                    {position: [0, 0], value: 'X\\times_Z Y'}
                ],
                edges: [
                    {from: 1, to: 2, tail: 'hookalt'},
                    {from: 3, to: 2, tail: 'mapsto', head: 'harpoonalt'},
                    {from: 0, to: 1, tail: 'tail', head: 'twoheads'},
                    {from: 0, to: 3, dashed: true},
                    {from: 4, to: 0, value: '\\phi', tail: 'hook'},
                    {from: 4, to: 1, value: 'p_X', tail: 'hook', bend: 30},
                    {from: 4, to: 3, value: 'p_Y', tail: 'tail', bend: -30}
                ]
            }
        }
    }

    getTeX() {
        return (h => renderToTeX(
            <Diagram>
                {this.state.diagram.nodes.map((node, i) =>
                    <Node
                        key={i.toString()}
                        position={node.position}
                        value={node.value}
                    />
                )}

                {this.state.diagram.edges.map(edge => [
                    <Edge
                        from={edge.from.toString()}
                        to={edge.to.toString()}
                        value={edge.value}
                        alt={edge.alt}
                        args={[
                            ...[edge.head, edge.tail].map((id, i) => ({
                                none: ['no head', null][i],
                                default: null,
                                harpoon: 'harpoon',
                                harpoonalt: "harpoon'",
                                hook: 'hook',
                                hookalt: "hook'",
                                mapsto: 'maps to',
                                tail: 'tail',
                                twoheads: 'two heads'
                            })[id]),

                            edge.dashed ? 'dashed' : null,

                            edge.bend > 0 ? `bend left=${edge.bend}`
                            : edge.bend < 0 ? `bend right=${-edge.bend}`
                            : null
                        ].filter(x => x)}
                    />
                ])}
            </Diagram>
        ))(th)
    }

    onToolClick = evt => {
        if (evt.id === 'code') {
            let success = copy(this.getTeX())
            return
        }

        this.setState({tool: evt.id})
    }

    render() {
        return <div id="root">
            <Grid
                cellSize={130}
                data={this.state.diagram}
                mode={this.state.tool}
            />

            <Toolbox
                tool={this.state.tool}
                onItemClick={this.onToolClick}
            />
        </div>
    }
}
