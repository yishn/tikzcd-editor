import {h, Component} from 'preact'
import classNames from 'classnames'
import Toolbox, {Button, Separator} from './toolbox'

export default class Properties extends Component {
    render() {
        return <Toolbox id="properties" class={classNames({show: this.props.show})}>
            <Button
                icon="./img/properties/tail.svg"
                name="Tail"
            />

            <Button
                icon="./img/properties/mapsto.svg"
                name="Maps To"
            />

            <Button
                icon="./img/properties/hook.svg"
                name="Hook"
            />

            <Separator/>

            <Button
                icon="./img/properties/solid.svg"
                name="Solid"
            />

            <Button
                icon="./img/properties/dashed.svg"
                name="dashed"
            />

            <Separator/>

            <Button
                icon="./img/properties/head.svg"
                name="Default Head"
            />

            <Button
                icon="./img/properties/twoheads.svg"
                name="Two Heads"
            />

            <Button
                icon="./img/properties/harpoon.svg"
                name="Harpoon"
            />
        </Toolbox>
    }
}
