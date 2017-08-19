import {h, Component} from 'preact'
import classNames from 'classnames'

const Item = ({current, id, name, onClick}) => (
    <li class={classNames({current})} data-id={id} title={name} onClick={onClick}>
        <img
            style={{backgroundImage: `url(./img/tools/${id}.svg)`}}
            src="./img/tools/blank.svg"
            alt={name}
        />
    </li>
)

const Separator = () => <li class="separator">Separator</li>

export default class Toolbox extends Component {
    constructor() {
        super()

        this.state = {
            codeDone: false
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.tool !== this.props.tool
            || nextState.codeDone !== this.state.codeDone
    }

    handleItemClick = evt => {
        let {id} = evt.currentTarget.dataset
        let {onItemClick = () => {}} = this.props

        if (id === 'tick') return

        if (id === 'code') {
            this.setState({codeDone: true})
            setTimeout(() => this.setState({codeDone: false}), 1000)
        }

        onItemClick({id})
    }

    render() {
        return <section id="toolbox">
            <ul>
                <Item
                    current={this.props.tool === 'pan'}
                    id="pan"
                    name="Pan Tool (Space)"
                    onClick={this.handleItemClick}
                />

                <Item
                    current={this.props.tool === 'arrow'}
                    id="arrow"
                    name="Arrow Tool (Ctrl)"
                    onClick={this.handleItemClick}
                />

                <Separator/>

                <Item
                    id={this.state.codeDone ? 'tick' : 'code'}
                    name="Copy Code"
                    onClick={this.handleItemClick}
                />

                <Item id="about" name="About…" onClick={this.handleItemClick} />
            </ul>
        </section>
    }
}
