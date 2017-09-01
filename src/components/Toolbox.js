import {h, Component} from 'preact'
import classNames from 'classnames'

export const Button = ({class: c, checked, disabled, icon, name, onClick}) => (
    <li class={classNames('button', c, {checked, disabled})} title={name}>
        <a href="#" onClick={onClick}>
            <img
                style={{backgroundImage: `url('${icon}')`}}
                src="./img/tools/blank.svg"
                alt={name}
            />
        </a>
    </li>
)

export const Separator = () => <li class="separator">Separator</li>

export default class Toolbox extends Component {
    render() {
        return <section class={classNames('toolbox', this.props.class)} id={this.props.id}>
            <ul>{this.props.children}</ul>
        </section>
    }
}
