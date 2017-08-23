import {h, Component} from 'preact'
import classNames from 'classnames'
import * as helper from '../helper'

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
        document.addEventListener('keyup', evt => {
            if (!this.props.show) return

            if (evt.keyCode === 46) {
                // Delete

                let {onRemoveClick = () => {}} = this.props
                onRemoveClick(evt)
            }
        })
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.show !== this.props.show
            || nextProps.data !== this.props.data
            || nextState.edit !== this.state.edit
            || nextState.editTop !== this.state.editTop
            || nextState.editLeft !== this.state.editLeft
    }

    componentDidUpdate(_, prevState) {
        if (!prevState.edit && this.state.edit) {
            this.inputElement.select()
        } else if (prevState.edit && !this.state.edit) {
            this.inputElement.blur()
        }
    }

    updateEditPosition() {
        let valueElement = document.querySelector(`.grid-edge[data-id="${this.props.edgeId}"] .value`)
        let {left, top, width} = valueElement.getBoundingClientRect()
        let {width: editWidth, height: editHeight} = window.getComputedStyle(this.editElement)

        this.setState({
            editLeft: left + width / 2 - parseFloat(editWidth) / 2,
            editTop: top - parseFloat(editHeight) - 10
        })
    }

    handleButtonClick = id => {
        if (this.buttonClickHandlersCache == null) this.buttonClickHandlersCache = {}

        if (this.buttonClickHandlersCache[id] == null) {
            this.buttonClickHandlersCache[id] = evt => {
                let {data, onChange = () => {}} = this.props
                let change = {}

                if (['tail', 'mapsto', 'twoheads'].includes(id)) {
                    let prop = id === 'twoheads' ? 'head' : 'tail'

                    change = {[prop]: data[prop] === id ? 'none' : id}
                } else if (id === 'head') {
                    change = {head: data.head == null ? 'none' : null}
                } else if (['solid', 'dashed', 'dotted'].includes(id)) {
                    change = {line: id}
                } else if (['labelleft', 'labelright'].includes(id)) {
                    change = {alt: id === 'labelright'}
                } else if (['hook', 'harpoon'].includes(id)) {
                    let prop = id === 'hook' ? 'tail' : 'head'
                    let ids = [id, `${id}alt`, 'none']
                    let index = (ids.indexOf(data[prop]) + 1) % ids.length

                    change = {[prop]: ids[index]}
                } else if (['bendleft', 'bendright'].includes(id)) {
                    let {bend = 0} = data
                    let increase = bend === 0 || (id === 'bendleft' ? bend > 0 : bend < 0)
                    let sign = bend !== 0 ? Math.sign(bend) : id === 'bendleft' ? 1 : -1
                    let steps = [0, 30, 45, 55, 65, 70, 75, 78, 80]

                    let index = steps.reduce((acc, x, i) => x <= Math.abs(bend) ? i : acc, -1)
                    if (index < steps.length - 1 && bend >= (steps[index + 1] + steps[index]) / 2) index++

                    let newBend = sign * steps[Math.min(index + (+increase * 2 - 1), steps.length - 1)]

                    change = {bend: helper.clamp(-80, 80, newBend)}
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
        if (evt.keyCode === 27) {
            // Escape

            evt.stopPropagation()
            this.setState({edit: false})
        }
    }

    render() {
        let data = this.props.data == null ? {} : this.props.data

        return <section
            id="properties"
            class={classNames({
                show: this.props.show,
                edit: this.state.edit
            })}
        >
            <Toolbox>
                <Button
                    checked={!data.alt}
                    icon="./img/properties/labelleft.svg"
                    name="Left Label"
                    onClick={this.handleButtonClick('labelleft')}
                />

                <Button
                    checked={!!data.alt}
                    icon="./img/properties/labelright.svg"
                    name="Right Label"
                    onClick={this.handleButtonClick('labelright')}
                />

                <Separator/>

                <Button
                    checked={data.tail === 'tail'}
                    icon="./img/properties/tail.svg"
                    name="Tail"
                    onClick={this.handleButtonClick('tail')}
                />

                <Button
                    checked={data.tail === 'mapsto'}
                    icon="./img/properties/mapsto.svg"
                    name="Maps To"
                    onClick={this.handleButtonClick('mapsto')}
                />

                <Button
                    checked={['hook', 'hookalt'].includes(data.tail)}
                    icon={`./img/properties/${data.tail === 'hookalt' ? 'hookalt' : 'hook'}.svg`}
                    name="Hook"
                    onClick={this.handleButtonClick('hook')}
                />

                <Separator/>

                <Button
                    icon="./img/properties/bendright.svg"
                    name="Bend Right"
                    onClick={this.handleButtonClick('bendright')}
                />

                <Button
                    checked={data.line && data.line === 'dotted'}
                    icon="./img/properties/dotted.svg"
                    name="Dashed"
                    onClick={this.handleButtonClick('dotted')}
                />

                <Button
                    checked={data.line && data.line === 'dashed'}
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
                    icon="./img/properties/bendleft.svg"
                    name="Bend Left"
                    onClick={this.handleButtonClick('bendleft')}
                />

                <Separator/>

                <Button
                    checked={['harpoon', 'harpoonalt'].includes(data.head)}
                    icon={`./img/properties/${data.head === 'harpoonalt' ? 'harpoonalt' : 'harpoon'}.svg`}
                    name="Harpoon"
                    onClick={this.handleButtonClick('harpoon')}
                />

                <Button
                    checked={data.head == null}
                    icon="./img/properties/head.svg"
                    name="Default Head"
                    onClick={this.handleButtonClick('head')}
                />

                <Button
                    checked={data.head == 'twoheads'}
                    icon="./img/properties/twoheads.svg"
                    name="Two Heads"
                    onClick={this.handleButtonClick('twoheads')}
                />

                <Separator/>

                <Button
                    checked={this.state.edit}
                    icon="./img/properties/edit.svg"
                    name="Edit Label"
                    onClick={this.handleEditButtonClick}
                />

                <Button
                    class="remove"
                    icon="./img/properties/trash.svg"
                    name="Remove Arrow (Del)"
                    onClick={this.props.onRemoveClick}
                />
            </Toolbox>

            <form
                ref={el => this.editElement = el}
                class="edit"
                style={{
                    left: this.state.editLeft,
                    top: this.state.editTop
                }}
                onSubmit={this.handleFormSubmit}
            >
                <input
                    ref={el => this.inputElement = el}
                    type="text"
                    value={data.value}

                    onBlur={this.handleInputBlur}
                    onInput={this.handleInputChange}
                    onKeyDown={this.handleInputKeyDown}
                    onKeyUp={this.handleInputKeyUp}
                />
            </form>
        </section>
    }
}
