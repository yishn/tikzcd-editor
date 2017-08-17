import {h, Component} from 'preact'
import classNames from 'classnames'
import Grid from './grid'
import Toolbox from './toolbox'

export default class App extends Component {
    constructor() {
        super()

        this.state = {
            tool: 'pan',
            cellSize: 130,
            cameraPosition: [-60, -60],
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

    componentDidMount() {
        document.addEventListener('mousedown', evt => {
            if (evt.button !== 0) return
            this.mouseDown = evt
        })

        document.addEventListener('mouseup', () => {
            this.mouseDown = null
        })

        document.addEventListener('mousemove', evt => {
            if (this.mouseDown == null) return
            evt.preventDefault()

            if (this.state.tool === 'pan') {
                let diff = [evt.movementX, evt.movementY]

                this.setState(({cameraPosition}) => ({
                    cameraPosition: cameraPosition.map((x, i) => x - diff[i])
                }))
            }
        })
    }

    onToolClick = evt => {
        if (evt.id === 'code') return

        this.setState({tool: evt.id})
    }

    render() {
        return <div id="root" class={classNames({[`tool-${this.state.tool}`]: true})}>
            <Grid
                cellSize={this.state.cellSize}
                cameraPosition={this.state.cameraPosition}
                data={this.state.diagram}
            />

            <Toolbox
                tool={this.state.tool}
                onItemClick={this.onToolClick}
            />
        </div>
    }
}
