import {h, render, Component} from 'preact'
import copyText from 'copy-text-to-clipboard'
import * as diagram from '../diagram'
import {arrAdd, lexicalCompare} from '../helper'

import Grid from './Grid'
import Properties from './Properties'
import Toolbox, {Button, Separator} from './Toolbox'
import CodeBox from './CodeBox'

export default class App extends Component {
  constructor() {
    super()

    this.state = {
      tool: 'pan',
      cellSize: 130,
      diagram: {nodes: [], edges: []},

      cameraPosition: [-65, -65],
      selectedCell: [0, 0],
      selectedArrow: null,
      cellEditMode: false,

      confirmLinkCopy: false,
      showCodeBox: false
    }

    this.state.diagram = this.parseDiagramFromUrl()
    this.history = [{diagram: this.state.diagram, time: Date.now()}]
    this.historyPointer = 0
  }

  componentDidMount() {
    // Switch tool when holding Shift and Space

    let toolControl = {
      Shift: 'arrow',
      ' ': 'pan'
    }

    let arrowControl = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    }

    document.addEventListener('keydown', evt => {
      if (toolControl[evt.key] != null) {
        if (this.prevTool != null) return

        this.prevTool = this.state.tool
        this.setState({tool: toolControl[evt.key]})
      } else if (Object.keys(arrowControl).includes(evt.key)) {
        // Arrow keys

        this.setState(state =>
          state.showCodeBox || state.cellEditMode || state.selectedArrow != null
            ? null
            : {selectedCell: arrAdd(state.selectedCell, arrowControl[evt.key])}
        )
      } else if (evt.key === 'Tab' && this.state.selectedArrow != null) {
        // Neutralize browser focus mechanism and instead cycle through arrows

        evt.preventDefault()
        evt.stopPropagation()

        let diff = evt.shiftKey ? -1 : 1

        this.setState(state => {
          if (state.selectedArrow == null) return

          let {nodes, edges} = state.diagram
          let length = edges.length
          let findNodePositionById = id =>
            nodes.find(node => node.id === id).position

          // Constructing a natural tab order for edges

          let indices = [...Array(length)]
            .map((_, i) => [
              i,
              [edges[i].from, edges[i].to]
                .map(findNodePositionById)
                .reduce((sum, x) => arrAdd(sum, x), [0, 0])
            ])
            .sort(([_, arr1], [__, arr2]) => lexicalCompare(arr1, arr2))
            .map(([i, _]) => i)

          let metaIndex = indices.indexOf(state.selectedArrow)

          return {
            selectedArrow:
              indices[(((metaIndex + diff) % length) + length) % length]
          }
        })
      } else if (evt.key === 'Enter') {
        this.setState(state =>
          state.showCodeBox || state.cellEditMode || state.selectedArrow != null
            ? null
            : {cellEditMode: true}
        )
      }
    })

    document.addEventListener('keyup', evt => {
      if (Object.keys(toolControl).includes(evt.key)) {
        // Space or Control

        if (this.prevTool == null) return

        this.setState({tool: this.prevTool})
        this.prevTool = null
      } else if (evt.key === 'Escape') {
        this.setState(state =>
          state.showCodeBox
            ? {showCodeBox: false}
            : state.selectedArrow != null
            ? {selectedArrow: null}
            : state.cellEditMode
            ? {cellEditMode: false}
            : null
        )
      }
    })

    window.addEventListener('popstate', evt => {
      this.handleDataChange({data: this.parseDiagramFromUrl()})
      this.resetCamera()
    })

    window.addEventListener('beforeunload', evt => {
      if (
        this.state.diagram.nodes.length > 0 ||
        this.state.diagram.edges.length > 0
      ) {
        let message = 'Do you really want to leave?'

        evt.returnValue = message
        return message
      }
    })
  }

  parseDiagramFromUrl = () => {
    if (window.location.hash.length > 0) {
      try {
        return diagram.fromCompressedBase64(window.location.hash.slice(1))
      } catch (err) {}

      try {
        return diagram.fromBase64(window.location.hash.slice(1))
      } catch (err) {
        alert('Invalid diagram permalink.')
      }
    }

    return {nodes: [], edges: []}
  }

  resetCamera = () => {
    this.setState({
      cameraPosition: Array(2).fill(-Math.floor(this.state.cellSize / 2)),
      selectedCell: [0, 0],
      selectedArrow: null
    })
  }

  handlePan = ({cameraPosition}) => {
    this.setState({cameraPosition})
  }

  generateLink = () => {
    let encoded = diagram.toCompressedBase64(this.state.diagram)
    let base = window.location.href.split('#')[0]

    return base + '#' + encoded
  }

  copyLink = () => {
    if (this.state.confirmLinkCopy) return

    let url = this.generateLink()
    window.history.pushState(null, null, url)

    let success = copyText(url)

    if (success) {
      this.setState({confirmLinkCopy: true})
      setTimeout(() => this.setState({confirmLinkCopy: false}), 1000)
    } else {
      prompt('Copy link down below:', url)
    }
  }

  openCodeBox = () => {
    let code = `% ${this.generateLink()}\n${diagram.toTeX(this.state.diagram)}`

    this.setState({
      codeValue: code,
      showCodeBox: true,
      selectedArrow: null
    })
  }

  handleCloseCodeBox = () => {
    this.setState({
      showCodeBox: false
    })
  }

  handleCodeInput = evt => {
    this.setState({
      codeValue: evt.currentTarget.value
    })
  }

  handleParseCode = () => {
    let currentCode = diagram.toTeX(this.state.diagram)
    let newCode = this.state.codeValue
    let data = this.state.diagram

    if (currentCode === newCode) return

    try {
      data = diagram.fromTeX(newCode)

      this.resetCamera()
      this.setState({showCodeBox: false})

      this.handleDataChange({data})
    } catch (err) {
      alert(`Could not parse code.\n\nReason: ${err.message}`)
    }
  }

  moveInHistory = step => {
    if (this.history[this.historyPointer + step] == null) return

    this.historyPointer += step

    this.setState({
      diagram: this.history[this.historyPointer].diagram,
      selectedArrow: null
    })
  }

  undo = () => {
    return this.moveInHistory(-1)
  }

  redo = () => {
    return this.moveInHistory(1)
  }

  handleDataChange = evt => {
    let edgeAdded =
      this.state.diagram.edges.length + 1 === evt.data.edges.length
    let historyEntry = {diagram: evt.data, time: Date.now()}

    if (
      (this.historyPointer < this.history.length - 1 ||
        Date.now() - this.history[this.historyPointer].time > 500) &&
      this.history[this.historyPointer].diagram !== evt.data
    ) {
      this.history.splice(
        this.historyPointer + 1,
        this.history.length,
        historyEntry
      )
      this.historyPointer = this.history.length - 1
    } else {
      this.history[this.historyPointer] = historyEntry
    }

    this.setState(state => ({
      diagram: evt.data,
      selectedArrow: edgeAdded
        ? evt.data.edges.length - 1
        : state.selectedArrow,
      ...(evt.selectedCell != null
        ? {
            selectedCell: evt.selectedCell,
            selectedArrow: null
          }
        : {})
    }))
  }

  handleCellClick = evt => {
    this.setState({
      selectedCell: evt.position,
      selectedArrow: null,
      cellEditMode: true
    })
  }

  handleCellSubmit = evt => {
    this.setState({
      cellEditMode: false
    })
  }

  handleArrowClick = evt => {
    this.setState({
      selectedArrow: this.state.selectedArrow === evt.edge ? null : evt.edge
    })
  }

  handleToolClick = tool => {
    if (this.toolClickHandlersCache == null) this.toolClickHandlersCache = {}

    if (this.toolClickHandlersCache[tool] == null) {
      this.toolClickHandlersCache[tool] = evt => {
        this.setState({tool, selectedArrow: null})
      }
    }

    return this.toolClickHandlersCache[tool]
  }

  handleAboutClick = () => {
    render(
      <a
        ref={el => {
          if (!el) return

          el.click()
          el.remove()
        }}
        href="https://github.com/yishn/tikzcd-editor"
        target="_blank"
      />,
      document.createElement('div')
    )
  }

  handleEdgeChange = evt => {
    let newEdges = [...this.state.diagram.edges]

    newEdges[this.state.selectedArrow] = {
      ...newEdges[this.state.selectedArrow],
      ...evt.data
    }

    if (evt.data.value != null && evt.data.value.trim() === '') {
      delete newEdges[this.state.selectedArrow].value
    }

    this.handleDataChange({
      data: {
        nodes: this.state.diagram.nodes,
        edges: newEdges
      }
    })
  }

  handleEdgeRemoveClick = () => {
    let newEdges = this.state.diagram.edges.filter(
      (_, i) => i !== this.state.selectedArrow
    )

    let newNodes = this.state.diagram.nodes.filter(
      n =>
        n.value.trim() !== '' ||
        newEdges.some(e => e.from === n.id || e.to === n.id)
    )

    this.handleDataChange({
      data: {
        nodes: newNodes,
        edges: newEdges
      }
    })

    this.setState({selectedArrow: null})
  }

  render() {
    return (
      <div id="root">
        <Grid
          cellSize={this.state.cellSize}
          cameraPosition={this.state.cameraPosition}
          data={this.state.diagram}
          mode={this.state.tool}
          selectedCell={
            this.state.selectedArrow == null ? this.state.selectedCell : null
          }
          selectedArrow={this.state.selectedArrow}
          cellEditMode={this.state.cellEditMode}
          onPan={this.handlePan}
          onDataChange={this.handleDataChange}
          onCellClick={this.handleCellClick}
          onCellSubmit={this.handleCellSubmit}
          onArrowClick={this.handleArrowClick}
        />

        <Properties
          edgeId={this.state.selectedArrow}
          show={this.state.selectedArrow != null}
          data={this.state.diagram.edges[this.state.selectedArrow]}
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
            name="Arrow Tool (Shift)"
            onClick={this.handleToolClick('arrow')}
          />

          <Separator />

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

          <Separator />

          <Button
            checked={this.state.showCodeBox}
            icon="./img/tools/code.svg"
            name="Open Code"
            onClick={this.openCodeBox}
          />

          <Button
            icon={`./img/tools/${
              this.state.confirmLinkCopy ? 'tick' : 'link'
            }.svg`}
            name="Copy Diagram Permalink"
            onClick={this.copyLink}
          />

          <Separator />

          <Button
            icon="./img/tools/about.svg"
            name="GitHub Repository"
            onClick={this.handleAboutClick}
          />
        </Toolbox>

        <CodeBox
          code={this.state.codeValue}
          show={this.state.showCodeBox}
          onCodeInput={this.handleCodeInput}
          onParseButtonClick={this.handleParseCode}
          onClose={this.handleCloseCodeBox}
        />
      </div>
    )
  }
}
