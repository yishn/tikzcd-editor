import {h, Component} from 'preact'
import classNames from 'classnames'
import {arrSubtract, arrEquals, arrScale, arrAdd} from '../helper'
import {
  norm,
  normalize,
  getPerpendicularLeftVector,
  getRectCenteredAround,
  getRectSegmentIntersections
} from '../geometry'

export default class GridArrow extends Component {
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
    this.componentWillReceiveProps()
  }

  shouldComponentUpdate(nextProps, nextState) {
    for (let key in nextProps) {
      if (nextProps[key] !== this.props[key]) return true
    }

    for (let key in nextState) {
      if (
        (nextState[key] instanceof Array &&
          !arrEquals(nextState[key], this.state[key])) ||
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
      let m = arrScale(0.5, arrAdd(fromCenter, toCenter))
      let d = arrSubtract(toCenter, fromCenter)
      let {length} = this.getLengthAngle()

      let controlPoint = arrAdd(
        m,
        arrScale(
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
    if (this.valueElement == null) return

    let {onTypesetFinish = () => {}} = this.props

    for (let el of this.valueElement.querySelectorAll(
      ['span[id^="MathJax"]', '.MathJax_Preview', 'script'].join(', ')
    )) {
      el.remove()
    }

    if (this.props.value) {
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, this.valueElement])
      MathJax.Hub.Queue(() => {
        onTypesetFinish({
          id: this.props.id,
          element: this.valueElement.querySelector('.MathJax_Preview + span')
        })
      })
    } else {
      onTypesetFinish({
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

      let bbox = this.pathElement.getBBox()
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
    let [dx, dy] = arrSubtract(endPoint, startPoint)

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

    let tailHeadWidth = 9.764
    let tailHeadHeight = 13

    if (!this.props.loop) {
      // Arrows

      let {startPoint, endPoint} = this.state
      ;[mx, my] = arrScale(0.5, arrAdd(startPoint, endPoint))

      let {length, angle} = this.getLengthAngle()
      degree = (angle * 180) / Math.PI

      let bend = this.props.bend || 0
      let bendAngle = (bend * Math.PI) / 180

      shift = this.props.shift || 0
      ;[leftOffset, topOffset] = [-(length + tailHeadHeight) / 2, 0]

      let [cx, cy] = [length / 2, -(length * Math.tan(bendAngle)) / 2]
      ;[width, height] = [
        length + tailHeadHeight,
        Math.max(Math.abs(cy) + tailHeadHeight, tailHeadHeight)
      ]

      let leftPoint = [tailHeadWidth, height / 2]
      let rightPoint = [length - tailHeadWidth, height / 2]
      let controlPoint = arrAdd(leftPoint, [cx, cy])

      path = [
        `M ${leftPoint.join(' ')}`,
        `Q ${controlPoint.join(' ')}`,
        rightPoint.join(' ')
      ].join(' ')

      tail = {
        x: 0,
        y: height / 2 - 13 / 2,
        transform: `rotate(${-bend} ${tailHeadWidth} ${height / 2})`
      }

      head = {
        x: length - tailHeadWidth,
        y: height / 2 - 13 / 2,
        transform: `rotate(${bend} ${length - tailHeadWidth} ${height / 2})`
      }
    } else {
      // Loops

      if (this.props.phantom) return
      ;[mx, my] = this.state.startPoint

      let [angle, clockwise] = this.props.loop || [0, false]
      let flip = clockwise ? -1 : 1
      let [radius, labelRadius] = [24, 14]

      width = height = radius * 4 + tailHeadHeight
      degree = 360 - angle
      shift = 0
      path = `M ${width / 2 - labelRadius} ${height / 2} a ${radius} ${radius *
        0.8} 0 1 0 ${labelRadius * 2} 0`

      let offset = 16

      leftOffset = -width / 2 - offset * Math.sin((degree * Math.PI) / 180)
      topOffset = offset * Math.cos((degree * Math.PI) / 180)

      let multiplier = (flip * 180) / Math.PI
      let baseDegree = Math.PI * clockwise * multiplier
      let rotate = (Math.asin(labelRadius / radius) - Math.PI) * multiplier
      let offsetLabel = labelRadius * flip
      let tailRotateAnchor = [width / 2 - offsetLabel, height / 2]
      let headRotateAnchor = [width / 2 + offsetLabel, height / 2]

      tail = {
        x: width / 2 - offsetLabel,
        y: height / 2,
        transform: `
          rotate(${baseDegree - rotate} ${tailRotateAnchor.join(' ')})
          translate(${-tailHeadWidth} ${-tailHeadHeight / 2})
        `
      }

      head = {
        x: width / 2 + offsetLabel,
        y: height / 2,
        transform: `
          rotate(${baseDegree + rotate} ${headRotateAnchor.join(' ')})
          translate(0 ${-tailHeadHeight / 2})
        `
      }
    }

    return (
      <li
        data-id={this.props.id}
        class={classNames('grid-arrow', {
          selected: this.props.selected,
          phantom: this.props.phantom
        })}
        style={{
          height,
          width,
          left: mx + leftOffset,
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

          <g
            ref={el => (this.pathElement = el)}
            fill="none"
            mask={
              this.props.line === 'double'
                ? `url(#hollowPath${this.props.id})`
                : null
            }
          >
            <path
              d={path}
              stroke="black"
              stroke-width={this.props.line === 'double' ? 6 : 1}
              stroke-dasharray={
                {
                  dashed: '7, 3',
                  dotted: '2, 4'
                }[this.props.line]
              }
            />
            {this.props.line === 'double' && (
              <mask
                id={`hollowPath${this.props.id}`}
                maskUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <path
                  d={path}
                  stroke="black"
                  stroke-width="4"
                  stroke-linecap="square"
                />
              </mask>
            )}
          </g>

          <image
            x={tail.x}
            y={tail.y}
            width={tailHeadWidth}
            height={tailHeadHeight}
            transform={tail.transform}
            xlinkHref={`./img/arrow/${[
              this.props.line === 'double' ? 'double-' : '',
              this.props.tail || 'none'
            ].join('')}.svg`}
          />

          <image
            x={head.x}
            y={head.y}
            width={tailHeadWidth}
            height={tailHeadHeight}
            transform={head.transform}
            xlinkHref={`./img/arrow/${[
              this.props.line === 'double' ? 'double-' : '',
              this.props.head || 'default'
            ].join('')}.svg`}
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
