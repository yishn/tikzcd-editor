import {h, Component} from 'preact'
import Grid from './grid'

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

    render() {
        return <Grid
            cellSize={130}
            data={this.state.diagram}
            pannable={this.state.tool === 'pan'}
        />
    }
}
