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
                nodes: {
                    '1,1': 'T',
                    '2,1': 'X',
                    '2,2': 'Z',
                    '1,2': 'Y',
                    '0,0': 'X\\times_Z Y'
                },
                edges: [
                    {from: [2, 1], to: [2, 2]},
                    {from: [1, 2], to: [2, 2]},
                    {from: [1, 1], to: [2, 1]},
                    {from: [1, 1], to: [1, 2]},
                    {from: [0, 0], to: [1, 1], value: '\\phi'},
                    {from: [0, 0], to: [2, 1], value: 'p_X'},
                    {from: [0, 0], to: [1, 2], value: 'p_Y'}
                ]
            }
        }
    }

    getTeX() {
        return (h => renderToTeX(
            <Diagram>
                {Object.keys(this.state.diagram.nodes).map(key =>
                    <Node
                        key={key}
                        position={key.split(',').map(x => +x)}
                        value={this.state.diagram.nodes[key]}
                    />
                )}

                {this.state.diagram.edges.map(edge => [
                    <Node key={edge.from.join(',')} position={edge.from} />,
                    <Node key={edge.to.join(',')} position={edge.to} />,

                    <Edge
                        from={edge.from.join(',')}
                        to={edge.to.join(',')}
                        value={edge.value}
                        alt={edge.alt}
                        args={edge.args}
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
