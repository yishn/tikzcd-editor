import {h, Component} from 'preact'
import classNames from 'classnames'

export const Button = ({checked, icon, name, onClick}) => (
    <li class={classNames({checked})} title={name} onClick={onClick}>
        <img
            style={{backgroundImage: `url(./img/tools/${icon}.svg)`}}
            src="./img/tools/blank.svg"
            alt={name}
        />
    </li>
)

export const Separator = () => <li class="separator">Separator</li>

export default class Toolbox extends Component {
    render() {
        return <section class="toolbox" id={this.props.id}>
            <ul>{this.props.children}</ul>
        </section>
    }
}
