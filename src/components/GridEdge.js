import {h, Component} from 'preact'
import classNames from 'classnames'

export default class GridEdge extends Component {
    constructor() {
        super()

        this.state = {
            labelX: '50%',
            labelY: 0
        }
    }

    componentDidMount() {
        this.componentDidUpdate()
    }

    shouldComponentUpdate(prevProps, prevState) {
        for (let key in prevProps) {
            if (prevProps[key] !== this.props[key]) return true
        }

        for (let key in prevState) {
            if (prevState[key] !== this.state[key]) return true
        }

        return false
    }

    componentDidUpdate() {
        for (let span of this.valueElement.querySelectorAll('span[id^="MathJax"]')) {
            span.remove()
        }

        MathJax.Hub.Queue(['Typeset', MathJax.Hub, this.valueElement])

        MathJax.Hub.Queue(() => {
            let bbox = this.edgePath.getBBox()
            let {width, height} = window.getComputedStyle(this.valueElement)

            ;[width, height] = [width, height].map(parseFloat)

            let angle = this.getAngle()
            let newWidth = width * Math.abs(Math.cos(angle)) + height * Math.abs(Math.sin(angle))
            let newHeight = height * Math.abs(Math.cos(angle)) + width * Math.abs(Math.sin(angle))

            this.setState({
                labelX: `calc(50% + ${-newWidth / 2}px)`,
                labelY: (this.props.alt ? bbox.y + bbox.height : bbox.y - height)
                    - (this.props.alt ? -1 : 1) * ((newHeight - height) / 2 + 5)
            })
        })
    }

    getAngle() {
        let {from, to, cellSize} = this.props
        let [dx, dy] = to.map((x, i) => (x - from[i]) * cellSize)

        return Math.atan2(dy, dx)
    }

    render() {
        let {cellSize} = this.props
        let [dx, dy] = this.props.to.map((x, i) => (x - this.props.from[i]) * cellSize)
        let [mx, my] = this.props.to.map((x, i) => (x + this.props.from[i] + 1) * cellSize / 2)

        let length = Math.sqrt(dx * dx + dy * dy) - Math.sqrt(2 * cellSize * cellSize) / 3
        let angle = this.getAngle() * 180 / Math.PI

        let bend = this.props.bend == null ? 0 : -this.props.bend
        let [cx, cy] = [length / 2, length * Math.tan(bend * Math.PI / 180) / 2]
        let height = Math.max(2 * Math.abs(cy), 13)

        return <li
            class="grid-edge"
            style={{
                height,
                width: length,
                left: mx - length / 2,
                top: my - height / 2,
                transform: `rotate(${angle}deg)`
            }}
        >
            <svg
                ref={el => this.svgElement = el}
                width={length}
                height={height}
                style={{marginTop: bend * 0.7}}
            >
                <path
                    ref={el => this.edgePath = el}
                    fill="none"
                    stroke-width="1"
                    stroke="black"
                    stroke-dasharray={this.props.dashed ? '7, 3' : null}
                    d={`M 9.764 ${height / 2} Q ${9.764 + cx} ${height / 2 + cy} ${length} ${height / 2}`}
                />

                <image
                    x="0" y={height / 2 - 13 / 2}
                    width="9.764" height="13"
                    style="background: white;"
                    transform={`rotate(${bend} ${9.764} ${height / 2})`}
                    href={`./img/arrow/${this.props.tail || 'none'}.svg`}
                />

                <image
                    x={length - 9.764} y={height / 2 - 13 / 2}
                    width="9.764" height="13"
                    transform={`rotate(${-bend} ${length} ${height / 2})`}
                    href={`./img/arrow/${this.props.head || 'default'}.svg`}
                />
            </svg>

            <div
                ref={el => this.valueElement = el}
                class={classNames({alt: this.props.alt}, 'value')}
                style={{
                    left: this.state.labelX,
                    top: this.state.labelY + bend * 0.7,
                    transform: `rotate(${-angle}deg)`
                }}
            >
                {this.props.value && `\\(${this.props.value}\\)`}
            </div>
        </li>
    }
}
