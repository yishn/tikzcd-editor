import {h, Component} from 'preact'

export default class GridCell extends Component {
    componentDidMount() {
        this.componentDidUpdate()
    }

    shouldComponentUpdate(prevProps) {
        return prevProps.children[0] !== this.props.children[0]
    }

    componentDidUpdate() {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, this.latexElement])
    }

    render() {
        return <li class="grid-cell" data-position={this.props.position.join(',')}>
            <div class="latex" ref={el => this.latexElement = el}>
                {this.props.children[0]
                    ? `\\(${this.props.children[0]}\\)`
                    : null}
            </div>
        </li>
    }
}
