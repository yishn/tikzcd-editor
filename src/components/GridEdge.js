import {h, Component} from 'preact'
import classNames from 'classnames'
import * as helper from '../helper'
import {
  norm,
  normalize,
  getPerpendicularLeftVector,
  getRectCenteredAround,
  getRectSegmentIntersections
} from '../geometry'

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
      if (
        (nextState[key] instanceof Array &&
          !helper.arrEquals(nextState[key], this.state[key])) ||
        (!(nextState[key] instanceof Array) &&
          nextState[key] !== this.state[key])
      )
        return true
    }

    return false
  }

  componentWillReceiveProps(nextProps) {
    if (
      // Conditions on when we don't need to update arrow rendering itself
      nextProps != null &&
      nextProps.from === this.props.from &&
      nextProps.to === this.props.to &&
      nextProps.fromSize === this.props.fromSize &&
      nextProps.toSize === this.props.toSize &&
      nextProps.bend === this.props.bend &&
      nextProps.shift === this.props.shift &&
      nextProps.loop === this.props.loop
    )
      return

    if (nextProps == null) nextProps = this.props

    MathJax.Hub.Queue(() => {
      let {cellSize, fromSize, toSize} = nextProps
      let [fromWidth, fromHeight] = fromSize || [0, 0]
      let [toWidth, toHeight] = toSize || [0, 0]

      ;[toWidth, toHeight] = [toWidth, toHeight].map(x =>
        Math.min(cellSize, x + 20)
      )
      ;[fromWidth, fromHeight] = [fromWidth, fromHeight].map(x =>
        Math.min(cellSize, x + 40)
      )

      let [fromCenter, toCenter] = [nextProps.from, nextProps.to].map(x =>
        x.map(y => y * cellSize + cellSize / 2)
      )
      let m = helper.arrScale(0.5, helper.arrAdd(fromCenter, toCenter))
      let d = helper.arrSubtract(toCenter, fromCenter)
      let {length} = this.getLengthAngle()

      let controlPoint = helper.arrAdd(
        m,
        helper.arrScale(
          (length * Math.tan((-(nextProps.bend || 0) * Math.PI) / 180)) / 2,
          normalize(getPerpendicularLeftVector(d))
        )
      )

      let fromRect = getRectCenteredAround(fromCenter, fromWidth, fromHeight)
      let toRect = getRectCenteredAround(toCenter, toWidth, toHeight)

      let fromIntersection = getRectSegmentIntersections(
        fromRect,
        fromCenter,
        controlPoint
      )[0]
      let toIntersection = getRectSegmentIntersections(
        toRect,
        controlPoint,
        toCenter
      )[0]

      this.setState({
        startPoint: fromIntersection || fromCenter,
        endPoint: toIntersection || toCenter
      })
    })
  }

  componentDidUpdate(prevProps, prevState) {
    let {onTypesetFinished = () => {}} = this.props

    for (let el of this.valueElement.querySelectorAll(
      ['span[id^="MathJax"]', '.MathJax_Preview', 'script'].join(', ')
    )) {
      el.remove()
    }

    if (this.props.value) {
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, this.valueElement])
      MathJax.Hub.Queue(() => {
        onTypesetFinished({
          id: this.props.id,
          element: this.valueElement.querySelector('.MathJax_Preview + span')
        })
      })
    } else {
      onTypesetFinished({
        id: this.props.id,
        element: null
      })
    }

    MathJax.Hub.Queue(() => {
      if (
        // Conditions on when we don't need to update label positioning
        this.props === prevProps &&
        this.state.startPoint === prevState.startPoint &&
        this.state.endPoint === prevState.endPoint
      )
        return

      if (prevProps == null) prevProps = this.props

      let bbox = this.edgePath.getBBox()
      let {width, height} = window.getComputedStyle(this.valueElement)

      ;[width, height] = [width, height].map(parseFloat)

      let labelPosition = this.props.labelPosition || 'left'
      let [loopAngle, clockwise] = this.props.loop || [0, false]
      if (clockwise)
        labelPosition =
          {left: 'right', right: 'left'}[labelPosition] || labelPosition

      let angle = this.getLengthAngle().angle + (loopAngle * Math.PI) / 180
      let newHeight =
        height * Math.abs(Math.cos(angle)) + width * Math.abs(Math.sin(angle))
      let heightDiff = newHeight - height

      this.setState({
        labelX: `calc(50% + ${-width / 2 -
          (this.props.from !== this.props.to ? 6.5 : 0)}px)`,
        labelY: {
          left:
            this.props.bend >= 0
              ? bbox.y - height - heightDiff / 2 - 5
              : bbox.y + bbox.height - height - heightDiff / 2 - 11,
          right:
            this.props.bend > 0
              ? bbox.y + heightDiff / 2 + 11
              : bbox.y + bbox.height + heightDiff / 2 + 5,
          inside:
            this.props.bend > 0
              ? bbox.y - height / 2
              : bbox.y + bbox.height - height / 2
        }[labelPosition]
      })
    })
  }

  getLengthAngle() {
    let {startPoint, endPoint} = this.state
    let [dx, dy] = helper.arrSubtract(endPoint, startPoint)

    return {
      length: norm([dx, dy]),
      angle: Math.atan2(dy, dx)
    }
  }

  render() {
    let width,
      height,
      leftOffset,
      topOffset,
      shift,
      tail,
      head,
      path,
      degree,
      mx,
      my

    if (!helper.arrEquals(this.props.from, this.props.to)) {
      // Arrows
      let {startPoint, endPoint} = this.state
      ;[mx, my] = helper.arrScale(0.5, helper.arrAdd(startPoint, endPoint))

      let {length, angle} = this.getLengthAngle()
      degree = (angle * 180) / Math.PI

      let bend = this.props.bend || 0
      shift = this.props.shift || 0

      let [cx, cy] = [
        length / 2,
        (length * Math.tan((bend * Math.PI) / 180)) / 2
      ]

      ;[width, height] = [length + 13, Math.max(Math.abs(cy) + 13, 13)]
      path = `M 9.764 ${height / 2} Q ${9.764 + cx} ${height / 2 -
        cy} ${length} ${height / 2}`
      leftOffset = (length + 13) / 2
      topOffset = 0

      tail = {
        x: 0,
        y: height / 2 - 13 / 2,
        transform: `rotate(${-bend} ${9.764} ${height / 2})`
      }

      head = {
        x: length - 9.764,
        y: height / 2 - 13 / 2,
        transform: `rotate(${bend} ${length} ${height / 2})`
      }
    } else {
      // Loops

      if (this.props.phantom) return
      ;[mx, my] = this.state.startPoint

      let [angle, clockwise] = this.props.loop || [0, false]
      let flip = clockwise ? -1 : 1
      let [radius, labelRadius] = [24, 14]

      ;[width, height] = [radius * 4 + 13, radius * 4 + 13]
      degree = 360 - angle
      shift = 0
      path = `M ${width / 2 - labelRadius} ${height / 2} a ${radius} ${radius *
        0.8} 0 1 0 ${labelRadius * 2} 0`

      let offset = 16

      leftOffset = width / 2 + offset * Math.sin((degree * Math.PI) / 180)
      topOffset = offset * Math.cos((degree * Math.PI) / 180)

      let multiplier = (flip * 180) / Math.PI
      let baseAngle = Math.PI * clockwise * multiplier
      let rotate = (Math.asin(labelRadius / radius) - Math.PI) * multiplier
      let offsetLabel = labelRadius * flip

      tail = {
        x: width / 2 - offsetLabel,
        y: height / 2,
        transform: `rotate(${baseAngle - rotate} ${width / 2 -
          offsetLabel} ${height / 2}) translate(-9.764, -6.5)`
      }

      head = {
        x: width / 2 + offsetLabel,
        y: height / 2,
        transform: `rotate(${baseAngle + rotate} ${width / 2 +
          offsetLabel} ${height / 2}) translate(-9.764, -6.5)`
      }
    }

    return (
      <li
        data-id={this.props.id}
        class={classNames('grid-edge', {
          selected: this.props.selected,
          phantom: this.props.phantom
        })}
        style={{
          height,
          width,
          left: mx - leftOffset,
          top: my - height / 2 + topOffset,
          transform: `rotate(${degree}deg) translateY(${shift * 7}px)`
        }}
        onClick={this.props.onClick}
      >
        <svg ref={el => (this.svgElement = el)} width={width} height={height}>
          <path
            class="mouse"
            fill="none"
            stroke-width="12"
            stroke="transparent"
            stroke-linecap="square"
            d={path}
          />

          <path
            ref={el => (this.edgePath = el)}
            fill="none"
            stroke-width="1"
            stroke="black"
            stroke-dasharray={
              {
                solid: null,
                dashed: '7, 3',
                dotted: '2, 4'
              }[this.props.line]
            }
            d={path}
          />

          <image
            x={tail.x}
            y={tail.y}
            width="9.764"
            height="13"
            transform={tail.transform}
            xlinkHref={`./img/arrow/${this.props.tail || 'none'}.svg`}
          />

          <image
            x={head.x}
            y={head.y}
            width="9.764"
            height="13"
            transform={head.transform}
            xlinkHref={`./img/arrow/${this.props.head || 'default'}.svg`}
          />
        </svg>

        <div
          ref={el => (this.valueElement = el)}
          class={classNames('value', this.props.labelPosition)}
          style={{
            left: this.state.labelX,
            top: this.state.labelY,
            transform: `rotate(${-degree}deg)`
          }}
        >
          {this.props.value ? (
            `\\(${this.props.value}\\)`
          ) : (
            <span class="hide">_</span>
          )}
        </div>
      </li>
    )
  }
}
