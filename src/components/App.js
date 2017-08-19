import {h, render, Component} from 'preact'
import copy from 'copy-text-to-clipboard'
import * as diagram from '../diagram'

import Grid from './grid'
import Toolbox, {Button, Separator} from './toolbox'

export default class App extends Component {
    constructor() {
        super()

        this.state = {
            tool: 'pan',
            cellSize: 130,
            selectedEdge: null,
            confirmCopy: false,
            diagram: {
                nodes: [
                    {id: '0', position: [1, 1], value: 'T'},
                    {id: '1', position: [2, 1], value: 'X'},
                    {id: '2', position: [2, 2], value: 'Z'},
                    {id: '3', position: [1, 2], value: 'Y'},
                    {id: '4', position: [0, 0], value: 'X\\times_Z Y'}
                ],
                edges: [
                    {from: '1', to: '2', tail: 'hookalt', head: 'none'},
                    {from: '3', to: '2', tail: 'mapsto', head: 'harpoonalt'},
                    {from: '0', to: '1', value: 'f', tail: 'tail', head: 'twoheads'},
                    {from: '0', to: '3', value: 'g\\circ h', alt: true, dashed: true},
                    {from: '4', to: '0', value: '\\phi', tail: 'hook', head: 'harpoon'},
                    {from: '4', to: '1', value: 'p_X', tail: 'hook', bend: 30},
                    {from: '4', to: '3', value: 'p_Y', alt: true, tail: 'tail', bend: -30}
                ]
            }
        }
    }

    componentDidMount() {
        // Switch tool when holding Control and Space

        let data = {
            17: 'arrow',    // Control
            32: 'pan'       // Space
        }

        document.addEventListener('keydown', evt => {
            if (data[evt.keyCode] != null) {
                if (this.prevTool != null) return

                this.prevTool = this.state.tool
                this.setState({tool: data[evt.keyCode]})
            }
        })

        document.addEventListener('keyup', evt => {
            if (Object.keys(data).includes(evt.keyCode.toString())) {
                // Space or Control

                if (this.prevTool == null) return

                this.setState({tool: this.prevTool})
                this.prevTool = null
            }
        })
    }

    handleDataChange = evt => {
        this.setState({diagram: evt.data})
    }

    handleEdgeClick = evt => {
        this.setState({selectedEdge: evt.edge})
    }

    handleToolClick = tool => {
        let handler = tool => evt => {
            this.setState({tool, selectedEdge: null})
        }

        return ({
            pan: handler('pan'),
            arrow: handler('arrow')
        })[tool]
    }

    handleCopyClick = () => {
        let success = copy(diagram.toTeX(this.state.diagram))

        if (success) {
            this.setState({confirmCopy: true})
            setTimeout(() => this.setState({confirmCopy: false}), 1000)
        }
    }

    handleAboutClick = () => {
        let a = render((
            <a href="https://github.com/yishn/tikzcd-editor" target="_blank" />
        ), document.body)

        a.click()
        a.remove()
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

            <Toolbox id="toolbox">
                <Button
                    checked={this.state.tool === 'pan'}
                    icon="pan"
                    name="Pan Tool (Space)"
                    onClick={this.handleToolClick('pan')}
                />

                <Button
                    checked={this.state.tool === 'arrow'}
                    icon="arrow"
                    name="Arrow Tool (Ctrl)"
                    onClick={this.handleToolClick('arrow')}
                />

                <Separator/>

                <Button
                    icon={this.state.confirmCopy ? 'tick' : 'code'}
                    name="Copy Code"
                    onClick={this.handleCopyClick}
                />

                <Button
                    icon="about"
                    name="About…"
                    onClick={this.handleAboutClick}
                />
            </Toolbox>
        </div>
    }
}
