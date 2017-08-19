import {h, Component} from 'preact'
import classNames from 'classnames'
import * as geometry from '../geometry'

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
        this.componentWillReceiveProps()
    }

    shouldComponentUpdate(nextProps, nextState) {
        for (let key in nextProps) {
            if (nextProps[key] !== this.props[key]) return true
        }

        for (let key in nextState) {
            if (nextState[key] instanceof Array
                && nextState[key].some((x, i) => x !== this.state[key][i])
                || !(nextState[key] instanceof Array)
                && nextState[key] !== this.state[key]) return true
        }

        return false
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps != null
            && nextProps.from === this.props.from
            && nextProps.to === this.props.to) return

        if (nextProps == null) nextProps = this.props

        MathJax.Hub.Queue(() => {
            let {cellSize} = nextProps
            let query = position => `.grid-cell[data-position="${position.join(',')}"] .value`

            let fromLatexElement = document.querySelector(query(nextProps.from))
            let toLatexElement = document.querySelector(query(nextProps.to))

            let [fromWidth, fromHeight, toWidth, toHeight] = Array(4).fill(0)

            if (fromLatexElement != null) {
                let {width, height} = fromLatexElement.getBoundingClientRect()
                fromWidth = width
                fromHeight = height
            }

            if (toLatexElement != null) {
                let {width, height} = toLatexElement.getBoundingClientRect()
                toWidth = width
                toHeight = height
            }

            fromWidth += 20
            fromHeight += 20
            toWidth += 20
            toHeight += 20

            let [fromCenter, toCenter] = [nextProps.from, nextProps.to]
                .map(x => x.map(y => y * cellSize + cellSize / 2))
            let m = fromCenter.map((x, i) => (x + toCenter[i]) / 2)
            let d = fromCenter.map((x, i) => toCenter[i] - x)
            let {length} = this.getLengthAngle()
            let controlPoint = geometry.normalize(geometry.getPerpendicularLeftVector(d))
                .map((x, i) => m[i] + length * Math.tan(-(nextProps.bend || 0) * Math.PI / 180) * x / 2)

            let fromRect = geometry.getRectCenteredAround(fromCenter, fromWidth, fromHeight)
            let toRect = geometry.getRectCenteredAround(toCenter, toWidth, toHeight)
            let fromIntersection = geometry.getRectSegmentIntersections(fromRect, fromCenter, controlPoint)[0]
            let toIntersection = geometry.getRectSegmentIntersections(toRect, controlPoint, toCenter)[0]

            this.setState({
                startPoint: fromIntersection || fromCenter,
                endPoint: toIntersection || toCenter
            })
        })
    }

    componentDidUpdate(prevProps) {
        for (let span of this.valueElement.querySelectorAll('span[id^="MathJax"]')) {
            span.remove()
        }

        MathJax.Hub.Queue(['Typeset', MathJax.Hub, this.valueElement])

        MathJax.Hub.Queue(() => {
            if (prevProps != null
                && this.props.value === prevProps.value
                && this.props.alt === prevProps.alt
                && this.props.from === prevProps.from
                && this.props.to === prevProps.to) return

            if (prevProps == null) prevProps = this.props

            let bbox = this.edgePath.getBBox()
            let {width, height} = window.getComputedStyle(this.valueElement)

            ;[width, height] = [width, height].map(parseFloat)

            let {angle} = this.getLengthAngle()
            let newHeight = height * Math.abs(Math.cos(angle)) + width * Math.abs(Math.sin(angle))

            this.setState({
                labelX: `calc(50% + ${-width / 2}px)`,
                labelY: (this.props.alt ? bbox.y + bbox.height : bbox.y - height)
                    + (+!!this.props.alt * 2 - 1) * ((newHeight - height) / 2 + 5)
            })
        })
    }

    getLengthAngle() {
        let {startPoint, endPoint} = this.state
        let [dx, dy] = endPoint.map((x, i) => x - startPoint[i])

        return {
            length: geometry.norm([dx, dy]),
            angle: Math.atan2(dy, dx)
        }
    }

    render() {
        let {startPoint, endPoint} = this.state
        let [mx, my] = endPoint.map((x, i) => (x + startPoint[i]) / 2)

        let {length, angle} = this.getLengthAngle()
        let degree = angle * 180 / Math.PI

        let bend = this.props.bend || 0
        let [cx, cy] = [length / 2, length * Math.tan(-bend * Math.PI / 180) / 2]
        let height = Math.max(Math.abs(cy) + 13, 13)

        return <li
            class="grid-edge"
            style={{
                height,
                width: length,
                left: mx - length / 2,
                top: my - height / 2,
                transform: `rotate(${degree}deg)`
            }}
        >
            <svg
                ref={el => this.svgElement = el}
                width={length}
                height={height}
            >
                <path
                    class="mouse"
                    fill="none"
                    stroke-width="12"
                    stroke="transparent"
                    stroke-linecap="square"
                    d={`M 9.764 ${height / 2} Q ${9.764 + cx} ${height / 2 + cy} ${length} ${height / 2}`}
                />

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
                    transform={`rotate(${-bend} ${9.764} ${height / 2})`}
                    href={`./img/arrow/${this.props.tail || 'none'}.svg`}
                />

                <image
                    x={length - 9.764} y={height / 2 - 13 / 2}
                    width="9.764" height="13"
                    transform={`rotate(${bend} ${length} ${height / 2})`}
                    href={`./img/arrow/${this.props.head || 'default'}.svg`}
                />
            </svg>

            <div
                ref={el => this.valueElement = el}
                class={classNames({alt: this.props.alt}, 'value')}
                style={{
                    left: this.state.labelX,
                    top: this.state.labelY,
                    transform: `rotate(${-degree}deg)`
                }}
            >
                {this.props.value && `\\(${this.props.value}\\)`}
            </div>
        </li>
    }
}
