import {h, Component} from 'preact'
import classNames from 'classnames'
import {getId} from '../helper'

import GridCell from './GridCell'
import GridEdge from './GridEdge'

export default class Grid extends Component {
    constructor(props) {
        super()

        this.state = {
            width: null,
            height: null,
            cameraPosition: Array(2).fill(Math.round(-props.cellSize / 2)),
            editPosition: [null, null]
        }
    }

    componentDidMount() {
        this.updateSize()

        window.addEventListener('resize', () => this.updateSize())
        document.addEventListener('mouseup', () => this.mouseDown = null)

        document.addEventListener('keyup', evt => {
            if (evt.keyCode === 27) {
                // Escape

                this.setState({editPosition: [null, null]})
            }
        })

        document.addEventListener('mousemove', evt => {
            if (this.mouseDown == null) return

            evt.preventDefault()

            if (this.mouseDown.mode === 'pan') {
                let {movementX, movementY} = evt

                this.setState(state => ({
                    cameraPosition: state.cameraPosition.map((x, i) => x - [movementX, movementY][i])
                }))
            } else if (this.mouseDown.mode === 'move') {
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
                        )(this.props.data.nodes),

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

        this.mouseDown = {
            evt, position, node,
            mode: this.props.mode
        }
    }

    handleNodeGrabberMouseDown = evt => {
        if (evt.button !== 0) return

        evt.stopPropagation()

        let {position} = evt
        let node = this.props.data.nodes
            .find(x => x.position.every((y, i) => y === position[i]))

        this.mouseDown = {
            evt, position, node,
            mode: 'move'
        }
    }

    handleNodeMouseUp = evt => {
        if (this.mouseDown == null) return

        let oldEvt = this.mouseDown.evt
        if (evt.clientX !== oldEvt.clientX || evt.clientY !== oldEvt.clientY) return

        let {position} = this.mouseDown

        this.setState({
            editPosition: position
        })
    }

    handleNodeSubmit = () => {
        this.setState({editPosition: [null, null]})
    }

    handleNodeChange = evt => {
        let {onDataChange = () => {}} = this.props

        let nodes = [...this.props.data.nodes]
        let index = nodes.findIndex(n => n.position.every((x, i) => x === evt.position[i]))

        if (index < 0) {
            if (evt.value.trim() !== '') {
                nodes.push({id: getId(), position: evt.position, value: evt.value})
            }
        } else {
            let {id} = nodes[index]
            nodes[index] = {id, position: [...evt.position], value: evt.value}

            if (evt.value.trim() === '') {
                // Cleanup if necessary

                let existingEdge = this.props.data.edges.find(e => e.from === id || e.to === id)
                if (!existingEdge) nodes[index] = null
            }
        }

        onDataChange({
            data: {
                nodes: nodes.filter(x => x != null),
                edges: this.props.data.edges
            }
        })
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
                                edit={position.every((x, i) => x === this.state.editPosition[i])}
                                value={(node =>
                                    node && node.value
                                )(this.props.data.nodes
                                    .find(x => x.position.every((y, k) => y === position[k]))
                                )}

                                onGrabberMouseDown={this.handleNodeGrabberMouseDown}
                                onSubmit={this.handleNodeSubmit}
                                onChange={this.handleNodeChange}
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
                        from={this.props.data.nodes.find(n => n.id === edge.from).position}
                        to={this.props.data.nodes.find(n => n.id === edge.to).position}

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
