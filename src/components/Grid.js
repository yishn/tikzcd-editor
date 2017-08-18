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
            } else if (this.props.mode === 'move') {
                let {node} = this.mouseDown
                if (node == null) return

                let {cellSize} = this.props
                let {cameraPosition} = this.state
                let newPosition = [evt.clientX, evt.clientY]
                    .map((x, i) => Math.floor((x + cameraPosition[i]) / cellSize))
                let existingNode = this.props.data.nodes
                    .find(x => x.position.every((y, i) => y === newPosition[i]))

                if (existingNode != null) return

                let {onDataChange = () => {}} = this.props

                onDataChange({
                    data: {
                        nodes: (nodes =>
                            (nodes[nodes.indexOf(node)].position = newPosition, nodes)
                        )(this.props.data.nodes.slice()),

                        edges: this.props.data.edges
                    }
                })
            }
        })
    }

    updateSize() {
        let {width, height} = this.element.getBoundingClientRect()
        this.setState({width, height})
    }

    handleNodeMouseDown = evt => {
        if (evt.button !== 0) return

        let {cellSize} = this.props
        let {cameraPosition} = this.state
        let position = [evt.clientX, evt.clientY]
            .map((x, i) => Math.floor((x + cameraPosition[i]) / cellSize))
        let node = this.props.data.nodes
            .find(x => x.position.every((y, i) => y === position[i]))

        this.mouseDown = {evt, position, node}
    }

    handleNodeMouseUp = evt => {
        if (this.mouseDown == null) return

        let oldEvt = this.mouseDown.evt
        if (evt.clientX !== oldEvt.clientX || evt.clientY !== oldEvt.clientY) return

        let {onNodeClick = () => {}} = this.props

        onNodeClick(this.mouseDown)
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
                onMouseDown={this.handleNodeMouseDown}
                onMouseUp={this.handleNodeMouseUp}
            >
                {Array(rows).fill().map((_, j) =>
                    Array(cols).fill().map((_, i) =>
                        (position =>
                            <GridCell
                                key={position.join(',')}
                                position={position}
                                size={cellSize}
                                value={(node =>
                                    node && node.value
                                )(this.props.data.nodes
                                    .find(x => x.position.every((y, k) => y === position[k]))
                                )}
                            />
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

                        bend={edge.bend}
                        dashed={edge.dashed}
                        tail={edge.tail}
                        head={edge.head}
                        value={edge.value}
                        alt={edge.alt}

                        cellSize={cellSize}
                    />
                )}
            </ul>
        </section>
    }
}
