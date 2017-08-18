import {h, Component} from 'preact'

export default class GridEdge extends Component {
    render() {
        let {cellSize} = this.props
        let [dx, dy] = this.props.to.map((x, i) => (x - this.props.from[i]) * cellSize)
        let [mx, my] = this.props.to.map((x, i) => (x + this.props.from[i] + 1) * cellSize / 2)

        let length = Math.sqrt(dx * dx + dy * dy) - Math.sqrt(2 * cellSize * cellSize) / 3
        let angle = Math.atan2(dy, dx) * 180 / Math.PI
        let height = 16

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
            <svg width={length} height={height}>
                <path
                    stroke-width="1"
                    stroke="black"
                    stroke-dasharray={this.props.dashed ? '7, 3' : null}
                    d={`M 9.764 ${height / 2} L ${length} ${height / 2}`}
                />

                <image
                    x="0" y="0"
                    width="9.764" height={height}
                    style="background: white;"
                    href={`./img/arrow/${this.props.tail || 'none'}.svg`}
                />

                <image
                    x={length - 9.764} y="0"
                    width="9.764" height={height}
                    href={`./img/arrow/${this.props.tip || 'default'}.svg`}
                />
            </svg>
        </li>
    }
}
