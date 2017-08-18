import {h, Component} from 'preact'

export default class GridCell extends Component {
    componentDidMount() {
        this.componentDidUpdate()
    }

    shouldComponentUpdate(prevProps) {
        return prevProps.value !== this.props.value
    }

    componentDidUpdate() {
        for (let span of this.valueElement.querySelectorAll('span[id^="MathJax"]')) {
            span.remove()
        }

        MathJax.Hub.Queue(['Typeset', MathJax.Hub, this.valueElement])
    }

    handleGrabberMouseDown = evt => {
        let {onGrabberMouseDown = () => {}} = this.props

        evt.position = this.props.position

        onGrabberMouseDown(evt)
    }

    render() {
        return <li class="grid-cell" data-position={this.props.position.join(',')}>
            <img
                class="grabber"
                src="./img/grabber.svg"
                width="16"
                height="16"
                onMouseDown={this.handleGrabberMouseDown}
            />

            <div class="value" ref={el => this.valueElement = el}>
                {this.props.value && `\\(${this.props.value}\\)`}
            </div>
        </li>
    }
}
