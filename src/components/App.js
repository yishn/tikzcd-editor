import {h, render, Component} from 'preact'
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
                    {from: 1, to: 2, tail: 'hookalt', head: 'none'},
                    {from: 3, to: 2, tail: 'mapsto', head: 'harpoonalt'},
                    {from: 0, to: 1, value: 'f', tail: 'tail', head: 'twoheads'},
                    {from: 0, to: 3, value: 'g\\circ h', alt: true, dashed: true},
                    {from: 4, to: 0, value: '\\phi', tail: 'hook', head: 'harpoon'},
                    {from: 4, to: 1, value: 'p_X', tail: 'hook', bend: 30},
                    {from: 4, to: 3, value: 'p_Y', alt: true, tail: 'tail', bend: -30}
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

                            edge.bend > 0 ? `bend left=${edge.bend}`.replace('=30', '')
                            : edge.bend < 0 ? `bend right=${-edge.bend}`.replace('=30', '')
                            : null
                        ].filter(x => x)}
                    />
                ])}
            </Diagram>
        ))(th)
    }

    handleToolClick = evt => {
        if (evt.id === 'code') {
            copy(this.getTeX())

            return
        } else if (evt.id === 'about') {
            let a = render((
                <a href="https://github.com/yishn/tikzcd-editor" target="_blank" />
            ), document.body)

            a.click()
            a.remove()

            return
        }

        this.setState({tool: evt.id})
    }

    handleDataChange = evt => {
        this.setState({diagram: evt.data})
    }

    render() {
        return <div id="root">
            <Grid
                cellSize={130}
                data={this.state.diagram}
                mode={this.state.tool}

                onDataChange={this.handleDataChange}
            />

            <Toolbox
                tool={this.state.tool}
                onItemClick={this.handleToolClick}
            />
        </div>
    }
}
