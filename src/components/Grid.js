import {h, Component} from 'preact'
import {renderToDiagram} from 'jsx-tikzcd'
import GridCell from './GridCell'

export default class Grid extends Component {
    constructor(props) {
        super()

        this.state = {
            width: null,
            height: null,
            cameraPosition: Array(2).fill(Math.round(-props.cellSize / 2))
        }
    }

    componentDidMount() {
        this.updateSize()
        window.addEventListener('resize', () => this.updateSize())
    }

    updateSize() {
        let {width, height} = this.element.getBoundingClientRect()
        this.setState({width, height})
    }

    render() {
        let {cellSize} = this.props
        let size = [this.state.width, this.state.height]
        let [xstart, ystart] = this.state.cameraPosition.map(x => Math.floor(x / cellSize))
        let [xend, yend] = this.state.cameraPosition.map((x, i) => Math.floor((x + size[i]) / cellSize))
        let [cols, rows] = [xend - xstart + 1, yend - ystart + 1]
        let [tx, ty] = [xstart, ystart].map((x, i) => x * cellSize - this.state.cameraPosition[i])

        let diagram = renderToDiagram(this.props.children[0])
        let nodeKey

        return <section ref={el => this.element = el} id="grid">
            <ol style={{
                gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
                left: tx,
                top: ty,
                width: cols * cellSize,
                height: rows * cellSize
            }}>
                {Array(rows).fill().map((_, j) =>
                    Array(cols).fill().map((_, i) =>
                        <GridCell
                            key={[i + xstart, j + ystart].join(',')}
                            position={[i + xstart, j + ystart]}
                            size={cellSize}
                        >
                            {(nodeKey = Object.keys(diagram.nodes).find(key =>
                                diagram.nodes[key].attributes.position
                                    .every((x, k) => x === [i + xstart, j + ystart][k])
                            )) && diagram.nodes[nodeKey].attributes.value}
                        </GridCell>
                    )
                )}
            </ol>
        </section>
    }
}
