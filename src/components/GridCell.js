import {h, Component} from 'preact'
import classNames from 'classnames'

export default class GridCell extends Component {
    componentDidMount() {
        this.componentDidUpdate()
    }

    shouldComponentUpdate(nextProps) {
        return nextProps.value !== this.props.value
            || nextProps.edit !== this.props.edit
    }

    componentDidUpdate(prevProps) {
        for (let span of this.valueElement.querySelectorAll('span[id^="MathJax"]')) {
            span.remove()
        }

        MathJax.Hub.Queue(['Typeset', MathJax.Hub, this.valueElement])

        if (this.inputElement != null && prevProps.edit !== this.props.edit) {
            this.inputElement.select()
        }
    }

    handleGrabberMouseDown = evt => {
        let {onGrabberMouseDown = () => {}} = this.props

        evt.position = this.props.position

        onGrabberMouseDown(evt)
    }

    handleEditSubmit = evt => {
        evt.preventDefault()

        let {onSubmit = () => {}} = this.props
        onSubmit(evt)
    }

    handleInputBlur = evt => {
        this.handleEditSubmit(evt)
    }

    handleInputMouseDown = evt => {
        evt.stopPropagation()
    }

    handleInputChange = evt => {
        let {onChange = () => {}} = this.props

        onChange({
            position: this.props.position,
            value: evt.currentTarget.value
        })
    }

    render() {
        return <li
            class={classNames('grid-cell', {edit: this.props.edit})}
            data-position={this.props.position.join(',')}
        >
            <img
                class="grabber"
                src="./img/grabber.svg"
                onMouseDown={this.handleGrabberMouseDown}
            />

            <div class="value" ref={el => this.valueElement = el}>
                {this.props.value && `\\(${this.props.value}\\)`}
            </div>

            {this.props.edit &&
                <form class="edit" onSubmit={this.handleEditSubmit}>
                    <input
                        ref={el => this.inputElement = el}
                        type="text"
                        value={this.props.value}

                        onBlur={this.handleInputBlur}
                        onInput={this.handleInputChange}
                        onMouseDown={this.handleInputMouseDown}
                    />
                </form>
            }
        </li>
    }
}
