import {h, Component} from 'preact'
import classNames from 'classnames'

export class Button extends Component {
    handleClick = evt => {
        evt.preventDefault()

        let {onClick = () => {}} = this.props
        onClick(evt)
    }

    render() {
        let {checked, disabled, icon, name} = this.props

        return <li 
            class={classNames('button', this.props.class, {checked, disabled})} 
            title={name}
        >
            <a href="#" onClick={this.handleClick}>
                <img
                    style={{backgroundImage: `url('${icon}')`}}
                    src="./img/tools/blank.svg"
                    alt={name}
                />
            </a>
        </li>
    }
}

export const Separator = () => <li class="separator">Separator</li>

export default class Toolbox extends Component {
    render() {
        return <section class={classNames('toolbox', this.props.class)} id={this.props.id}>
            <ul>{this.props.children}</ul>
        </section>
    }
}
