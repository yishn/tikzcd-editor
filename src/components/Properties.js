import {h, Component} from 'preact'
import classNames from 'classnames'
import Toolbox, {Button, Separator} from './toolbox'

export default class Properties extends Component {
    shouldComponentUpdate(nextProps) {
        return nextProps.show !== this.props.show
            || nextProps.data !== this.props.data
    }

    handleButtonClick = id => {
        if (this.buttonClickHandlersCache == null) this.buttonClickHandlersCache = {}

        if (this.buttonClickHandlersCache[id] == null) {
            this.buttonClickHandlersCache[id] = evt => {
                console.log(id)
            }
        }

        return this.buttonClickHandlersCache[id]
    }

    render() {
        let data = this.props.data == null ? {} : this.props.data

        return <Toolbox id="properties" class={classNames({show: this.props.show})}>
            <Button
                checked={data.tail === 'tail'}
                icon="./img/properties/tail.svg"
                name="Tail"
                onClick={this.handleButtonClick('tail')}
            />

            <Button
                checked={data.tail === 'mapsto'}
                icon="./img/properties/mapsto.svg"
                name="Maps To"
                onClick={this.handleButtonClick('mapsto')}
            />

            <Button
                checked={['hook', 'hookalt'].includes(data.tail)}
                icon="./img/properties/hook.svg"
                name="Hook"
                onClick={this.handleButtonClick('hook')}
            />

            <Separator/>

            <Button
                icon="./img/properties/bendright.svg"
                name="Bend Right"
                onClick={this.handleButtonClick('bendright')}
            />

            <Button
                checked={!data.dashed}
                icon="./img/properties/solid.svg"
                name="Solid"
                onClick={this.handleButtonClick('solid')}
            />

            <Button
                checked={!!data.dashed}
                icon="./img/properties/dashed.svg"
                name="Dashed"
                onClick={this.handleButtonClick('dashed')}
            />

            <Button
                icon="./img/properties/bendleft.svg"
                name="Bend Left"
                onClick={this.handleButtonClick('bendleft')}
            />

            <Separator/>

            <Button
                checked={data.head == null}
                icon="./img/properties/head.svg"
                name="Default Head"
                onClick={this.handleButtonClick('head')}
            />

            <Button
                checked={data.head == 'twoheads'}
                icon="./img/properties/twoheads.svg"
                name="Two Heads"
                onClick={this.handleButtonClick('twoheads')}
            />

            <Button
                checked={['harpoon', 'harpoonalt'].includes(data.head)}
                icon="./img/properties/harpoon.svg"
                name="Harpoon"
                onClick={this.handleButtonClick('harpoon')}
            />

            <Separator/>

            <Button
                class="remove"
                icon="./img/properties/trash.svg"
                name="Remove Arrow"
                onClick={this.props.onRemoveClick}
            />
        </Toolbox>
    }
}
