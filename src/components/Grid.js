import {h, Component} from 'preact'
import classNames from 'classnames'

import GridCell from './GridCell'
import GridEdge from './GridEdge'

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
        document.addEventListener('mouseup', () => this.mouseDown = null)

        document.addEventListener('mousemove', evt => {
            if (this.mouseDown == null) return

            evt.preventDefault()

            if (this.props.mode === 'pan') {
                let {movementX, movementY} = evt

                this.setState(state => ({
                    cameraPosition: state.cameraPosition.map((x, i) => x - [movementX, movementY][i])
                }))
            }
        })
    }

    updateSize() {
        let {width, height} = this.element.getBoundingClientRect()
        this.setState({width, height})
    }

    onMouseDown = evt => {
        if (evt.button !== 0) return
        this.mouseDown = evt
    }

    render() {
        if (this.state.width == null) return <section ref={el => this.element = el} id="grid"/>

        let {cellSize} = this.props
        let size = [this.state.width, this.state.height]
        let [xstart, ystart] = this.state.cameraPosition.map(x => Math.floor(x / cellSize))
        let [xend, yend] = this.state.cameraPosition.map((x, i) => Math.floor((x + size[i]) / cellSize))
        let [cols, rows] = [xend - xstart + 1, yend - ystart + 1]
        let [tx, ty] = [xstart, ystart].map((x, i) => x * cellSize - this.state.cameraPosition[i])

        return <section
            ref={el => this.element = el}
            id="grid"
            class={classNames({[this.props.mode]: true})}
        >
            <ol
                style={{
                    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
                    left: tx,
                    top: ty,
                    width: cols * cellSize,
                    height: rows * cellSize
                }}
                onMouseDown={this.onMouseDown}
            >
                {Array(rows).fill().map((_, j) =>
                    Array(cols).fill().map((_, i) =>
                        (position =>
                            <GridCell
                                key={position.join(',')}
                                position={position}
                                size={cellSize}
                            >
                                {(node =>
                                    node && node.value
                                )(this.props.data.nodes
                                    .find(x => x.position.every((y, k) => y === position[k]))
                                )}
                            </GridCell>
                        )([i + xstart, j + ystart])
                    )
                )}
            </ol>

            <ul
                style={{
                    left: -this.state.cameraPosition[0],
                    top: -this.state.cameraPosition[1]
                }}
            >
                {this.props.data.edges.map(edge =>
                    <GridEdge
                        from={this.props.data.nodes[edge.from].position}
                        to={this.props.data.nodes[edge.to].position}

                        dashed={edge.dashed}
                        tail={edge.tail}
                        tip={edge.tip}

                        cellSize={cellSize}
                    />
                )}
            </ul>
        </section>
    }
}
