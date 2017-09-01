import {h, Component} from 'preact'
import classNames from 'classnames'
import * as helper from '../helper'
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
                && !helper.arrEquals(nextState[key], this.state[key])
                || !(nextState[key] instanceof Array)
                && nextState[key] !== this.state[key]) return true
        }

        return false
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps != null
            && nextProps.from === this.props.from
            && nextProps.to === this.props.to
            && nextProps.bend === this.props.bend) return

        if (nextProps == null) nextProps = this.props

        MathJax.Hub.Queue(() => {
            let {cellSize} = nextProps
            let query = position => `.grid-cell[data-position="${position.join(',')}"] .value`

            let fromLatexElement = document.querySelector(query(nextProps.from))
            let toLatexElement = document.querySelector(query(nextProps.to))

            let [fromWidth, fromHeight, toWidth, toHeight] = [0, 0, 0, 0]

            if (fromLatexElement != null) {
                let {width, height} = fromLatexElement.getBoundingClientRect()
                ;[fromWidth, fromHeight] = [width, height]
            }

            if (toLatexElement != null) {
                let {width, height} = toLatexElement.getBoundingClientRect()
                ;[toWidth, toHeight] = [width, height]
            }

            ;[toWidth, toHeight] = [toWidth, toHeight].map(x => Math.min(cellSize, x + 20))
            ;[fromWidth, fromHeight] = [fromWidth, fromHeight].map(x => Math.min(cellSize, x + 40))

            let [fromCenter, toCenter] = [nextProps.from, nextProps.to]
                .map(x => x.map(y => y * cellSize + cellSize / 2))
            let m = helper.arrScale(0.5, helper.arrAdd(fromCenter, toCenter))
            let d = helper.arrSubtract(toCenter, fromCenter)
            let {length} = this.getLengthAngle()

            let controlPoint = helper.arrAdd(m, helper.arrScale(
                length * Math.tan(-(nextProps.bend || 0) * Math.PI / 180) / 2,
                geometry.normalize(geometry.getPerpendicularLeftVector(d))
            ))

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

    componentDidUpdate(prevProps, prevState) {
        if (this.valueElement == null) return

        for (let el of this.valueElement.querySelectorAll([
            'span[id^="MathJax"]',
            '.MathJax_Preview',
            'script',
        ].join(', '))) {
            el.remove()
        }

        if (this.props.value) {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, this.valueElement])
        }

        MathJax.Hub.Queue(() => {
            if (prevProps != null
                && this.props.value === prevProps.value
                && this.props.labelPosition === prevProps.labelPosition
                && this.props.from === prevProps.from
                && this.props.to === prevProps.to
                && this.props.bend === prevProps.bend
                && this.state.startPoint === prevState.startPoint
                && this.state.endPoint === prevState.endPoint) return

            if (prevProps == null) prevProps = this.props

            let bbox = this.edgePath.getBBox()
            let {width, height} = window.getComputedStyle(this.valueElement)

            ;[width, height] = [width, height].map(parseFloat)

            let {angle} = this.getLengthAngle()
            let newHeight = height * Math.abs(Math.cos(angle)) + width * Math.abs(Math.sin(angle))
            let heightDiff = newHeight - height

            this.setState({
                labelX: `calc(50% + ${-width / 2 - 6.5}px)`,
                labelY: ({
                    left: bbox.y - height - heightDiff / 2 - 5,
                    right: bbox.y + bbox.height + heightDiff / 2 + 5,
                    inside: this.props.bend > 0
                        ? bbox.y - height / 2
                        : bbox.y + bbox.height - height / 2
                })[this.props.labelPosition || 'left']
            })
        })
    }

    getLengthAngle() {
        let {startPoint, endPoint} = this.state
        let [dx, dy] = helper.arrSubtract(endPoint, startPoint)

        return {
            length: geometry.norm([dx, dy]),
            angle: Math.atan2(dy, dx)
        }
    }

    render() {
        if (helper.arrEquals(this.props.from, this.props.to)) return

        let {startPoint, endPoint} = this.state
        let [mx, my] = helper.arrScale(0.5, helper.arrAdd(startPoint, endPoint))

        let {length, angle} = this.getLengthAngle()
        let degree = angle * 180 / Math.PI

        let bend = this.props.bend || 0
        let [cx, cy] = [length / 2, length * Math.tan(bend * Math.PI / 180) / 2]
        let height = Math.max(Math.abs(cy) + 13, 13)
        let path = `M 9.764 ${height / 2} Q ${9.764 + cx} ${height / 2 - cy} ${length} ${height / 2}`

        return <li
            data-id={this.props.id}
            class={classNames('grid-edge', {
                selected: this.props.selected,
                phantom: this.props.phantom
            })}
            style={{
                height,
                width: length + 13,
                left: mx - (length + 13) / 2,
                top: my - height / 2,
                transform: `rotate(${degree}deg)`
            }}

            onClick={this.props.onClick}
        >
            <svg
                ref={el => this.svgElement = el}
                width={length + 13}
                height={height}
            >
                <path
                    class="mouse"
                    fill="none"
                    stroke-width="12"
                    stroke="transparent"
                    stroke-linecap="square"
                    d={path}
                />

                <path
                    ref={el => this.edgePath = el}
                    fill="none"
                    stroke-width="1"
                    stroke="black"
                    stroke-dasharray={{
                        solid: null,
                        dashed: '7, 3',
                        dotted: '2, 4'
                    }[this.props.line]}
                    d={path}
                />

                <image
                    x="0" y={height / 2 - 13 / 2}
                    width="9.764" height="13"
                    transform={`rotate(${-bend} ${9.764} ${height / 2})`}
                    xlinkHref={`./img/arrow/${this.props.tail || 'none'}.svg`}
                />

                <image
                    x={length - 9.764} y={height / 2 - 13 / 2}
                    width="9.764" height="13"
                    transform={`rotate(${bend} ${length} ${height / 2})`}
                    xlinkHref={`./img/arrow/${this.props.head || 'default'}.svg`}
                />
            </svg>

            <div
                ref={el => this.valueElement = el}
                class={classNames('value', this.props.labelPosition)}
                style={{
                    left: this.state.labelX,
                    top: this.state.labelY,
                    transform: `rotate(${-degree}deg)`
                }}
            >
                {this.props.value
                    ? `\\(${this.props.value}\\)`
                    : <span class="hide">_</span>
                }
            </div>
        </li>
    }
}
