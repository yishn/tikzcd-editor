import {h, Component} from 'preact'
import classNames from 'classnames'
import GridCell from './GridCell'

export default class Grid extends Component {
    constructor(props) {
        super()

        this.state = {
            width: null,
            height: null
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
        if (this.state.width == null) return <section ref={el => this.element = el} id="grid"/>

        let {cellSize, cameraPosition} = this.props
        let size = [this.state.width, this.state.height]
        let [xstart, ystart] = cameraPosition.map(x => Math.floor(x / cellSize))
        let [xend, yend] = cameraPosition.map((x, i) => Math.floor((x + size[i]) / cellSize))
        let [cols, rows] = [xend - xstart + 1, yend - ystart + 1]
        let [tx, ty] = [xstart, ystart].map((x, i) => x * cellSize - cameraPosition[i])

        return <section ref={el => this.element = el} id="grid">
            <ol
                style={{
                    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
                    left: tx,
                    top: ty,
                    width: cols * cellSize,
                    height: rows * cellSize
                }}
            >
                {Array(rows).fill().map((_, j) =>
                    Array(cols).fill().map((_, i) =>
                        (position =>
                            <GridCell
                                key={position.join(',')}
                                position={position}
                                size={cellSize}
                            >
                                {this.props.data.nodes[position]}
                            </GridCell>
                        )([i + xstart, j + ystart])
                    )
                )}
            </ol>
        </section>
    }
}
