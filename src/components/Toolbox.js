import {h, Component} from 'preact'

const Item = ({currentTool, id, name, onClick}) => (
    <li class={currentTool === id ? 'current' : null} data-id={id} title={name} onClick={onClick}>
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

    onItemClick = evt => {
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
                    currentTool={this.props.tool}
                    id="pan"
                    name="Pan Tool"
                    onClick={this.onItemClick}
                />
                
                <Item
                    currentTool={this.props.tool}
                    id="arrow"
                    name="Arrow Tool"
                    onClick={this.onItemClick}
                />

                <Separator/>

                <Item
                    id={this.state.codeDone ? 'tick' : 'code'}
                    name="Copy Code"
                    onClick={this.onItemClick}
                />

                <Item id="about" name="About…" onClick={this.onItemClick} />
            </ul>
        </section>
    }
}
