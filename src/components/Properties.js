import {h, Fragment, Component} from 'preact'
import classNames from 'classnames'
import {clamp} from '../helper'

import Toolbox, {Button, Separator} from './Toolbox'

export default class Properties extends Component {
  constructor() {
    super()

    this.state = {
      edit: false,
      editTop: 0,
      editLeft: 0
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', evt => {
      if (evt.ctrlKey || evt.metaKey || !this.props.show || this.state.edit)
        return

      let edgeEdit = 'Enter'
      let edgeDelete = ['Delete', 'Backspace']
      let edgeControl = {
        ArrowUp: evt.shiftKey ? 'bendleft' : 'shiftleft',
        ArrowDown: evt.shiftKey ? 'bendright' : 'shiftright',
        r: 'reversearrow',
        a: 'labelleft',
        s: 'labelinside',
        d: 'labelright',
        e: 'rotate'
      }

      if (edgeControl[evt.key] != null) {
        evt.preventDefault()

        this.handleButtonClick(edgeControl[evt.key])()
      } else if (edgeDelete.includes(evt.key)) {
        evt.preventDefault()

        let {onRemoveClick = () => {}} = this.props
        onRemoveClick(evt)
      } else if (evt.key == edgeEdit) {
        evt.preventDefault()

        this.handleEditButtonClick()
      }
    })
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.show !== this.props.show ||
      nextProps.data !== this.props.data ||
      nextState.edit !== this.state.edit ||
      nextState.editTop !== this.state.editTop ||
      nextState.editLeft !== this.state.editLeft
    )
  }

  componentDidUpdate(_, prevState) {
    if (!prevState.edit && this.state.edit) {
      this.inputElement.select()
    } else if (prevState.edit && !this.state.edit) {
      this.inputElement.blur()
    }
  }

  updateEditPosition() {
    let valueElement = document.querySelector(
      `.grid-arrow[data-id="${this.props.edgeId}"] .value`
    )
    let {left, top, width} = valueElement.getBoundingClientRect()
    let {width: editWidth, height: editHeight} = window.getComputedStyle(
      this.editElement
    )

    this.setState({
      editLeft: left + width / 2 - parseFloat(editWidth) / 2,
      editTop: top - parseFloat(editHeight) - 10
    })
  }

  handleButtonClick = id => {
    if (this.buttonClickHandlersCache == null)
      this.buttonClickHandlersCache = {}

    if (this.buttonClickHandlersCache[id] == null) {
      this.buttonClickHandlersCache[id] = evt => {
        let {data, onChange = () => {}} = this.props
        let change = {}

        if (['tail', 'mapsto', 'twoheads'].includes(id)) {
          let prop = id === 'twoheads' ? 'head' : 'tail'

          change = {[prop]: data[prop] === id ? 'none' : id}
        } else if (id === 'head') {
          change = {head: data.head == null ? 'none' : null}
        } else if (['double', 'solid', 'dashed', 'dotted'].includes(id)) {
          change = {line: (data.line || 'solid') === id ? 'none' : id}

          if (change.line === 'double') {
            change = {
              ...change,
              ...([null, 'none'].includes(data.head) ? {} : {head: null}),
              ...([null, 'mapsto', 'none'].includes(data.tail)
                ? {}
                : {tail: 'none'})
            }
          } else if (change.line === 'none') {
            change = {
              ...change,
              head: 'none',
              tail: 'none',
              labelPosition: 'inside'
            }
          }
        } else if (['labelleft', 'labelright', 'labelinside'].includes(id)) {
          change = {
            labelPosition: data.line === 'none' ? 'inside' : id.slice(5)
          }
        } else if (['hook', 'harpoon'].includes(id)) {
          let prop = id === 'hook' ? 'tail' : 'head'
          let ids = [id, `${id}alt`, 'none']
          let index = (ids.indexOf(data[prop]) + 1) % ids.length

          change = {[prop]: ids[index]}
        } else if (['bendleft', 'bendright'].includes(id)) {
          if (data.loop != null) return

          let {bend = 0} = data
          let increase = bend === 0 || (id === 'bendleft' ? bend > 0 : bend < 0)
          let sign = bend !== 0 ? Math.sign(bend) : id === 'bendleft' ? 1 : -1
          let steps = [0, 30, 49, 60, 67, 71, 74, 76, 78, 79, 80]

          let index = steps.reduce(
            (acc, x, i) => (x <= Math.abs(bend) ? i : acc),
            -1
          )
          if (
            index < steps.length - 1 &&
            bend >= (steps[index + 1] + steps[index]) / 2
          )
            index++

          let newBend =
            sign *
            steps[Math.min(index + (+increase * 2 - 1), steps.length - 1)]

          change = {bend: clamp(-80, 80, newBend)}
        } else if (['shiftleft', 'shiftright'].includes(id)) {
          if (data.loop != null) return

          let {shift = 0} = data
          change = {shift: shift + (id === 'shiftright' ? 1 : -1)}
        } else if (['reversearrow'].includes(id)) {
          let {from, to, labelPosition} = data

          change = {to: from, from: to}

          // Invert label position

          if (labelPosition != null) {
            let newLabelPos = labelPosition

            if (labelPosition === 'left') {
              newLabelPos = 'right'
            } else if (labelPosition === 'right') {
              newLabelPos = 'left'
            }

            change.labelPosition = newLabelPos
          }

          // Invert bend

          if (data.bend != null) {
            change.bend = -data.bend
          }

          // Invert shift

          if (data.shift != null) {
            change.shift = -data.shift
          }

          // Invert loop direction

          if (data.loop != null) {
            let [angle, clockwise] = data.loop
            change.loop = [angle, !clockwise]
          }
        } else if (['rotate'].includes(id)) {
          if (data.loop == null) return

          let [angle, clockwise] = data.loop
          change.loop = [(angle + 90) % 360, clockwise]
        }

        onChange({data: {...data, ...change}})
      }
    }

    return this.buttonClickHandlersCache[id]
  }

  handleEditButtonClick = () => {
    this.updateEditPosition()
    this.setState({edit: true})
  }

  handleFormSubmit = evt => {
    evt.preventDefault()
    this.setState({edit: false})
  }

  handleInputBlur = () => {
    this.setState({edit: false})
  }

  handleInputChange = evt => {
    let {value} = evt.currentTarget
    let {onChange = () => {}} = this.props

    onChange({data: {...this.props.data, value}})
  }

  handleInputKeyDown = evt => {
    evt.stopPropagation()
  }

  handleInputKeyUp = evt => {
    if (evt.key === 'Escape') {
      evt.stopPropagation()
      this.setState({edit: false})
    }
  }

  render() {
    let data = this.props.data == null ? {} : this.props.data

    return (
      <section
        id="properties"
        class={classNames({
          show: this.props.show,
          edit: this.state.edit
        })}
      >
        <Toolbox>
          <Button
            checked={false}
            icon="./img/properties/reverse.svg"
            name="Reverse Arrow (R)"
            onClick={this.handleButtonClick('reversearrow')}
          />

          <Separator />

          <Button
            checked={data.tail === 'tail'}
            disabled={['none', 'double'].includes(data.line)}
            icon="./img/properties/tail.svg"
            name="Tail"
            onClick={this.handleButtonClick('tail')}
          />

          <Button
            checked={data.tail === 'mapsto'}
            disabled={['none'].includes(data.line)}
            icon="./img/properties/mapsto.svg"
            name="Maps To"
            onClick={this.handleButtonClick('mapsto')}
          />

          <Button
            checked={['hook', 'hookalt'].includes(data.tail)}
            disabled={['none', 'double'].includes(data.line)}
            icon={`./img/properties/${
              data.tail === 'hookalt' ? 'hookalt' : 'hook'
            }.svg`}
            name="Hook"
            onClick={this.handleButtonClick('hook')}
          />

          <Separator />

          <Button
            checked={data.line === 'dotted'}
            icon="./img/properties/dotted.svg"
            name="Dotted"
            onClick={this.handleButtonClick('dotted')}
          />

          <Button
            checked={data.line === 'dashed'}
            icon="./img/properties/dashed.svg"
            name="Dashed"
            onClick={this.handleButtonClick('dashed')}
          />

          <Button
            checked={!data.line || data.line === 'solid'}
            icon="./img/properties/solid.svg"
            name="Solid"
            onClick={this.handleButtonClick('solid')}
          />

          <Button
            checked={data.line === 'double'}
            icon="./img/properties/double.svg"
            name="Double"
            onClick={this.handleButtonClick('double')}
          />

          <Separator />

          {data.loop == null ? (
            <>
              <Button
                key="shiftright"
                icon="./img/properties/shiftright.svg"
                name="Shift Right (Down Arrow)"
                onClick={this.handleButtonClick('shiftright')}
              />

              <Button
                key="shiftleft"
                icon="./img/properties/shiftleft.svg"
                name="Shift Left (Up Arrow)"
                onClick={this.handleButtonClick('shiftleft')}
              />

              <Button
                key="bendright"
                icon="./img/properties/bendright.svg"
                name="Bend Right (Shift+Down Arrow)"
                onClick={this.handleButtonClick('bendright')}
              />

              <Button
                key="bendleft"
                icon="./img/properties/bendleft.svg"
                name="Bend Left (Shift+Up Arrow)"
                onClick={this.handleButtonClick('bendleft')}
              />
            </>
          ) : (
            <>
              <Button
                key="rotate"
                icon="./img/properties/rotate.svg"
                name="Rotate (E)"
                onClick={this.handleButtonClick('rotate')}
              />
            </>
          )}

          <Separator />

          <Button
            checked={['harpoon', 'harpoonalt'].includes(data.head)}
            disabled={['none', 'double'].includes(data.line)}
            icon={`./img/properties/${
              data.head === 'harpoonalt' ? 'harpoonalt' : 'harpoon'
            }.svg`}
            name="Harpoon"
            onClick={this.handleButtonClick('harpoon')}
          />

          <Button
            checked={data.head == null}
            disabled={['none'].includes(data.line)}
            icon="./img/properties/head.svg"
            name="Default Head"
            onClick={this.handleButtonClick('head')}
          />

          <Button
            checked={data.head == 'twoheads'}
            disabled={['none', 'double'].includes(data.line)}
            icon="./img/properties/twoheads.svg"
            name="Two Heads"
            onClick={this.handleButtonClick('twoheads')}
          />

          <Separator />

          <Button
            checked={!data.labelPosition || data.labelPosition === 'left'}
            disabled={['none'].includes(data.line)}
            icon="./img/properties/labelleft.svg"
            name="Left Label (A)"
            onClick={this.handleButtonClick('labelleft')}
          />

          <Button
            checked={data.labelPosition === 'inside'}
            icon="./img/properties/labelinside.svg"
            name="Inside Label (S)"
            onClick={this.handleButtonClick('labelinside')}
          />

          <Button
            checked={data.labelPosition === 'right'}
            disabled={['none'].includes(data.line)}
            icon="./img/properties/labelright.svg"
            name="Right Label (D)"
            onClick={this.handleButtonClick('labelright')}
          />

          <Button
            checked={this.state.edit}
            icon="./img/properties/edit.svg"
            name="Edit Label (Enter)"
            onClick={this.handleEditButtonClick}
          />

          <Separator />

          <Button
            class="remove"
            icon="./img/properties/trash.svg"
            name="Remove Arrow (Del)"
            onClick={this.props.onRemoveClick}
          />
        </Toolbox>

        <form
          ref={el => (this.editElement = el)}
          class="edit"
          style={{
            left: this.state.editLeft,
            top: this.state.editTop
          }}
          onSubmit={this.handleFormSubmit}
        >
          <input
            ref={el => (this.inputElement = el)}
            type="text"
            value={data.value || ''}
            onBlur={this.handleInputBlur}
            onInput={this.handleInputChange}
            onKeyDown={this.handleInputKeyDown}
            onKeyUp={this.handleInputKeyUp}
          />
        </form>
      </section>
    )
  }
}
