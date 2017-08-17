import {h, Component} from 'preact'
import {h as th, Diagram, Edge, Node} from 'jsx-tikzcd'
import Grid from './grid'

export default class App extends Component {
    constructor() {
        super()

        this.state = {
            diagram: (h =>
                <Diagram>
                    <Node key="test" position={[1, 1]} value="T" />
                    <Node key="a" position={[2, 1]} value="X" />
                    <Node key="base" position={[2, 2]} value="Z" />
                    <Node key="b" position={[1, 2]} value="Y" />

                    <Edge from="a" to="base" />
                    <Edge from="b" to="base" />
                    <Edge from="test" to="a" value="f" />
                    <Edge from="test" to="b" value="g" alt />

                    <Node key="product" position={[0, 0]} value="X\times_Z Y" />

                    <Edge from="product" to="test" value="\phi" />
                    <Edge from="product" to="a" value="p_X" />
                    <Edge from="product" to="b" value="p_Y" alt />
                </Diagram>
            )(th)
        }
    }

    render() {
        return <Grid cellSize={120}>{this.state.diagram}</Grid>
    }
}
