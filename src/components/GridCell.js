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

    render() {
        return <li class="grid-cell" data-position={this.props.position.join(',')}>
            <div class="value" ref={el => this.valueElement = el}>
                {this.props.value && `\\(${this.props.value}\\)`}
            </div>
        </li>
    }
}
