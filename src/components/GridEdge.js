import {h, Component} from 'preact'
import classNames from 'classnames'
import {getRectCenteredAround, getRectSegmentIntersections} from '../geometry'

export default class GridEdge extends Component {
    constructor(props) {
        super()

        this.state = {
            labelX: '50%',
            labelY: 0,
            startPoint: props.from.map(x => x * props.cellSize + props.cellSize / 2),
            endPoint: props.to.map(x => x * props.cellSize + props.cellSize / 2)
        }
    }

    componentDidMount() {
        this.componentDidUpdate()
    }

    shouldComponentUpdate(nextProps, nextState) {
        for (let key in nextProps) {
            if (nextProps[key] instanceof Array
                && nextProps[key].some((x, i) => x !== this.props[key][i])
                || !(nextProps[key] instanceof Array)
                && nextProps[key] !== this.props[key]) return true
        }

        for (let key in nextState) {
            if (nextState[key] instanceof Array
                && nextState[key].some((x, i) => x !== this.state[key][i])
                || !(nextState[key] instanceof Array)
                && nextState[key] !== this.state[key]) return true
        }

        return false
    }

    componentDidUpdate(prevProps) {
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
                labelX: `calc(50% + ${-width / 2}px)`,
                labelY: (this.props.alt ? bbox.y + bbox.height : bbox.y - height)
                    + (+!!this.props.alt * 2 - 1) * ((newHeight - height) / 2 + 5)
            })

            let {cellSize} = this.props
            let query = position => `.grid-cell[data-position="${position.join(',')}"] .value`

            let fromLatexElement = document.querySelector(query(this.props.from))
            let toLatexElement = document.querySelector(query(this.props.to))

            let {width: fromWidth, height: fromHeight} = fromLatexElement.getBoundingClientRect()
            let {width: toWidth, height: toHeight} = toLatexElement.getBoundingClientRect()

            let [fromCenter, toCenter] = [this.props.from, this.props.to]
                .map(x => x.map(y => y * cellSize + cellSize / 2))

            let fromRect = getRectCenteredAround(fromCenter, fromWidth, fromHeight)
            let toRect = getRectCenteredAround(toCenter, toWidth, toHeight)
            let fromIntersection = getRectSegmentIntersections(fromRect, fromCenter, toCenter)[0]
            let toIntersection = getRectSegmentIntersections(toRect, fromCenter, toCenter)[0]

            this.setState({
                startPoint: fromIntersection,
                endPoint: toIntersection
            })
        })
    }

    getAngle() {
        let {startPoint, endPoint} = this.state
        let [dx, dy] = endPoint.map((x, i) => x - startPoint[i])

        return Math.atan2(dy, dx)
    }

    render() {
        let {startPoint, endPoint} = this.state
        let [dx, dy] = endPoint.map((x, i) => x - startPoint[i])
        let [mx, my] = endPoint.map((x, i) => (x + startPoint[i]) / 2)

        let length = Math.sqrt(dx * dx + dy * dy) - 20
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
                style={{marginTop: bend * 0.5}}
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
                    top: this.state.labelY + bend * 0.5,
                    transform: `rotate(${-angle}deg)`
                }}
            >
                {this.props.value && `\\(${this.props.value}\\)`}
            </div>
        </li>
    }
}
