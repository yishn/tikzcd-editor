import {h, render, Component} from 'preact'
import copyText from 'copy-text-to-clipboard'
import * as diagram from '../diagram'

import Grid from './Grid'
import Properties from './Properties'
import Toolbox, {Button, Separator} from './Toolbox'

export default class App extends Component {
    constructor() {
        super()

        this.state = {
            tool: 'pan',
            cellSize: 130,
            selectedEdge: null,
            confirmCodeCopy: false,
            confirmLinkCopy: false,
            diagram: {nodes: [], edges: []}
        }

        // Try to load a diagram from the hash if given

        if (window.location.hash.length > 0) {
            try {
                this.state.diagram = diagram.fromBase64(window.location.hash.slice(1))
            } catch (err) {
                alert('Invalid URL encoding')
            }
        }

        this.history = [{diagram: this.state.diagram, time: Date.now()}]
        this.historyPointer = 0
    }

    componentDidMount() {
        // Switch tool when holding Control and Space

        let toolControl = {
            17: 'arrow',    // Control
            32: 'pan'       // Space
        }

        document.addEventListener('keydown', evt => {
            if (toolControl[evt.keyCode] != null) {
                if (this.prevTool != null) return

                this.prevTool = this.state.tool
                this.setState({tool: toolControl[evt.keyCode]})
            }
        })

        document.addEventListener('keyup', evt => {
            if (Object.keys(toolControl).includes(evt.keyCode.toString())) {
                // Space or Control

                if (this.prevTool == null) return

                this.setState({tool: this.prevTool})
                this.prevTool = null
            }
        })

        document.addEventListener('keyup', evt => {
            if (evt.keyCode === 27) {
                // Escape

                this.setState({selectedEdge: null})
            }
        })

        window.addEventListener('beforeunload', evt => {
            let message = 'Do you really want to leave?'

            evt.returnValue = message
            return message
        })
    }

    copyCode = () => {
        if (this.state.confirmCodeCopy) return

        let code = diagram.toTeX(this.state.diagram)
        let success = copyText(code)

        if (success) {
            this.setState({confirmCodeCopy: true})
            setTimeout(() => this.setState({confirmCodeCopy: false}), 1000)
        } else {
            prompt('Copy code down below:', code.replace(/\n/g, ' '))
        }
    }

    copyLink = () => {
        if (this.state.confirmLinkCopy) return

        let encoded = diagram.toBase64(this.state.diagram)
        let base = window.location.href.split('#')[0]

        let url = base + '#' + encoded
        window.history.replaceState(null, null, '#' + encoded)

        let success = copyText(url)

        if (success) {
            this.setState({confirmLinkCopy: true})
            setTimeout(() => this.setState({confirmLinkCopy: false}), 1000)
        } else {
            prompt('Copy link down below:', url)
        }
    }

    moveInHistory = step => {
        if (this.history[this.historyPointer + step] == null) return

        this.historyPointer += step

        this.setState({
            diagram: this.history[this.historyPointer].diagram,
            selectedEdge: null
        })
    }

    undo = () => {
        return this.moveInHistory(-1)
    }

    redo = () => {
        return this.moveInHistory(1)
    }

    handleDataChange = evt => {
        let edgeAdded = this.state.diagram.edges.length + 1 === evt.data.edges.length
        let historyEntry = {diagram: evt.data, time: Date.now()}

        if ((this.historyPointer < this.history.length - 1
        || Date.now() - this.history[this.historyPointer].time > 500)
        && this.history[this.historyPointer].diagram !== evt.data) {
            this.history.splice(this.historyPointer + 1, this.history.length, historyEntry)
            this.historyPointer = this.history.length - 1
        } else {
            this.history[this.historyPointer] = historyEntry
        }

        this.setState({
            diagram: evt.data,
            selectedEdge: edgeAdded ? evt.data.edges.length - 1 : this.state.selectedEdge
        })
    }

    handleEdgeClick = evt => {
        this.setState({selectedEdge: this.state.selectedEdge === evt.edge ? null : evt.edge})
    }

    handleToolClick = tool => {
        if (this.toolClickHandlersCache == null) this.toolClickHandlersCache = {}

        if (this.toolClickHandlersCache[tool] == null) {
            this.toolClickHandlersCache[tool] = evt => {
                this.setState({tool, selectedEdge: null})
            }
        }

        return this.toolClickHandlersCache[tool]
    }

    handleAboutClick = () => {
        let a = render((
            <a href="https://github.com/yishn/tikzcd-editor" target="_blank" />
        ), document.body)

        a.click()
        a.remove()
    }

    handleEdgeChange = evt => {
        let newEdges = [...this.state.diagram.edges]

        newEdges[this.state.selectedEdge] = {
            ...newEdges[this.state.selectedEdge],
            ...evt.data
        }

        if (evt.data.value != null && evt.data.value.trim() === '') {
            delete newEdges[this.state.selectedEdge].value
        }

        this.handleDataChange({
            data: {
                nodes: this.state.diagram.nodes,
                edges: newEdges
            }
        })
    }

    handleEdgeRemoveClick = () => {
        let newEdges = this.state.diagram.edges
            .filter((_, i) => i !== this.state.selectedEdge)

        let newNodes = this.state.diagram.nodes
            .filter(n => n.value.trim() !== '' || newEdges.some(e =>
                e.from === n.id || e.to === n.id
            ))

        this.handleDataChange({
            data: {
                nodes: newNodes,
                edges: newEdges
            }
        })

        this.setState({selectedEdge: null})
    }

    render() {
        return <div id="root">
            <Grid
                cellSize={this.state.cellSize}
                data={this.state.diagram}
                mode={this.state.tool}
                selectedEdge={this.state.selectedEdge}

                onDataChange={this.handleDataChange}
                onEdgeClick={this.handleEdgeClick}
            />

            <Properties
                edgeId={this.state.selectedEdge}
                show={this.state.selectedEdge != null}
                data={this.state.diagram.edges[this.state.selectedEdge]}

                onChange={this.handleEdgeChange}
                onRemoveClick={this.handleEdgeRemoveClick}
            />

            <Toolbox id="toolbox">
                <Button
                    checked={this.state.tool === 'pan'}
                    icon="./img/tools/pan.svg"
                    name="Pan Tool (Space)"
                    onClick={this.handleToolClick('pan')}
                />

                <Button
                    checked={this.state.tool === 'arrow'}
                    icon="./img/tools/arrow.svg"
                    name="Arrow Tool (Ctrl)"
                    onClick={this.handleToolClick('arrow')}
                />

                <Separator/>

                <Button
                    disabled={this.history[this.historyPointer - 1] == null}
                    icon="./img/tools/undo.svg"
                    name="Undo"
                    onClick={this.undo}
                />

                <Button
                    disabled={this.history[this.historyPointer + 1] == null}
                    icon="./img/tools/redo.svg"
                    name="Redo"
                    onClick={this.redo}
                />

                <Separator/>

                <Button
                    icon={`./img/tools/${this.state.confirmCodeCopy ? 'tick' : 'code'}.svg`}
                    name="Copy Diagram Code"
                    onClick={this.copyCode}
                />

                <Button
                    icon={`./img/tools/${this.state.confirmLinkCopy ? 'tick' : 'link'}.svg`}
                    name="Copy Diagram Permalink"
                    onClick={this.copyLink}
                />

                <Separator/>

                <Button
                    icon="./img/tools/about.svg"
                    name="GitHub Repository"
                    onClick={this.handleAboutClick}
                />
            </Toolbox>
        </div>
    }
}
