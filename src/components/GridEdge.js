import {h, Component} from 'preact'

export default class GridEdge extends Component {
    render() {
        let {cellSize} = this.props
        let [dx, dy] = this.props.to.map((x, i) => (x - this.props.from[i]) * cellSize)
        let [mx, my] = this.props.to.map((x, i) => (x + this.props.from[i] + 1) * cellSize / 2)

        let length = Math.sqrt(dx * dx + dy * dy) - Math.sqrt(2 * cellSize * cellSize) / 3
        let angle = Math.atan2(dy, dx) * 180 / Math.PI

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
            <svg width={length} height={height}>
                <path
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
        </li>
    }
}
