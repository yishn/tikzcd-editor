import {h, Component} from 'preact'
import classNames from 'classnames'
import * as helper from '../helper'

import GridCell from './GridCell'
import GridEdge from './GridEdge'

export default class Grid extends Component {
    constructor(props) {
        super()

        this.state = {
            width: null,
            height: null,
            cameraPosition: Array(2).fill(Math.round(-props.cellSize / 2)),
            editPosition: [null, null],
            phantomEdge: null
        }
    }

    componentDidMount() {
        this.updateSize()

        window.addEventListener('resize', () => this.updateSize())

        document.addEventListener('mouseup', () => {
            this.mouseDown = null

            let {phantomEdge} = this.state

            if (phantomEdge != null) {
                if (!helper.arrEquals(phantomEdge.from, phantomEdge.to)) {
                    // Add edge

                    let newNodes = [...this.props.data.nodes]

                    let [fromNode, toNode] = [phantomEdge.from, phantomEdge.to].map(position =>
                        newNodes.find(n => helper.arrEquals(n.position, position))
                    )

                    if (fromNode == null)
                        newNodes.push(fromNode = {id: helper.getId(), position: phantomEdge.from, value: ''})
                    if (toNode == null)
                        newNodes.push(toNode = {id: helper.getId(), position: phantomEdge.to, value: ''})

                    let newEdges = [...this.props.data.edges, {
                        from: fromNode.id,
                        to: toNode.id
                    }]

                    let {onDataChange = () => {}} = this.props
                    onDataChange({data: {nodes: newNodes, edges: newEdges}})
                }

                this.setState({phantomEdge: null})
            }
        })

        document.addEventListener('keyup', evt => {
            if (evt.keyCode === 27) {
                // Escape

                evt.stopPropagation()
                this.setState({editPosition: [null, null]})
            }
        })

        document.addEventListener('mousemove', evt => {
            if (this.mouseDown == null) return

            evt.preventDefault()

            let {cellSize} = this.props
            let {cameraPosition} = this.state
            let newPosition = [evt.clientX, evt.clientY]
                .map((x, i) => Math.floor((x + cameraPosition[i]) / cellSize))

            if (this.mouseDown.mode === 'pan') {
                let {movementX, movementY} = evt

                this.setState({
                    cameraPosition: helper.arrSubtract(cameraPosition, [movementX, movementY])
                })
            } else if (this.mouseDown.mode === 'move') {
                let {nodeIndex} = this.mouseDown
                if (nodeIndex < 0) return

                let existingNode = this.props.data.nodes.find(n => helper.arrEquals(n.position, newPosition))
                if (existingNode != null) return

                let {onDataChange = () => {}} = this.props

                onDataChange({
                    data: {
                        nodes: this.props.data.nodes.map((x, i) =>
                            i !== nodeIndex ? x
                            : {...x, position: newPosition}
                        ),

                        edges: this.props.data.edges
                    }
                })
            } else if (this.mouseDown.mode === 'arrow') {
                let {position: from} = this.mouseDown
                let to = newPosition

                if (this.state.phantomEdge != null
                    && helper.arrEquals(from, this.state.phantomEdge.from)
                    && helper.arrEquals(to, this.state.phantomEdge.to)) return

                this.setState({
                    phantomEdge: {from, to}
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
        let nodeIndex = this.props.data.nodes
            .findIndex(n => helper.arrEquals(n.position, position))
        let node = this.props.data.nodes[nodeIndex]

        this.mouseDown = {
            evt, position, nodeIndex, node,
            mode: this.props.mode
        }
    }

    handleNodeGrabberMouseDown = evt => {
        if (evt.button !== 0) return

        evt.stopPropagation()

        let {position} = evt
        let nodeIndex = this.props.data.nodes
            .findIndex(n => helper.arrEquals(n.position, position))
        let node = this.props.data.nodes[nodeIndex]

        this.mouseDown = {
            evt, position, nodeIndex, node,
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
        let index = nodes.findIndex(n => helper.arrEquals(n.position, evt.position))

        if (index < 0) {
            if (evt.value.trim() !== '') {
                nodes.push({id: helper.getId(), position: evt.position, value: evt.value})
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

    handleEdgeClick = index => {
        if (this.edgeClickHandlersCache == null) this.edgeClickHandlersCache = {}

        if (this.edgeClickHandlersCache[index] == null) {
            this.edgeClickHandlersCache[index] = evt => {
                let {onEdgeClick = () => {}} = this.props

                evt.edge = index
                onEdgeClick(evt)
            }
        }

        return this.edgeClickHandlersCache[index]
    }

    render() {
        if (this.state.width == null) return <section ref={el => this.element = el} id="grid"/>

        let {cellSize} = this.props
        let size = [this.state.width, this.state.height]
        let [xstart, ystart] = this.state.cameraPosition.map(x => Math.floor(x / cellSize))
        let [xend, yend] = this.state.cameraPosition.map((x, i) => Math.floor((x + size[i]) / cellSize))
        let [cols, rows] = [xend - xstart + 1, yend - ystart + 1]
        let [tx, ty] = helper.arrSubtract(helper.arrScale(cellSize, [xstart, ystart]), this.state.cameraPosition)

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
                                edit={helper.arrEquals(position, this.state.editPosition)}
                                value={(node =>
                                    node && node.value
                                )(this.props.data.nodes.find(
                                    n => helper.arrEquals(n.position, position)
                                ))}

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
                {this.props.data.edges.map((edge, i) =>
                    <GridEdge
                        cellSize={cellSize}

                        id={i.toString()}
                        from={this.props.data.nodes.find(n => n.id === edge.from).position}
                        to={this.props.data.nodes.find(n => n.id === edge.to).position}
                        selected={this.props.selectedEdge === i}

                        bend={edge.bend}
                        tail={edge.tail}
                        line={edge.line}
                        head={edge.head}
                        value={edge.value}
                        labelPosition={edge.labelPosition}

                        onClick={this.handleEdgeClick(i)}
                    />
                )}

                {this.state.phantomEdge &&
                    <GridEdge
                        cellSize={cellSize}
                        phantom

                        from={this.state.phantomEdge.from}
                        to={this.state.phantomEdge.to}
                    />
                }
            </ul>
        </section>
    }
}
