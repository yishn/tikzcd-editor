import {h, Component} from 'preact'

const Item = ({tool, id, name, onClick}) => (
    <li class={tool === id ? 'current' : null} data-id={id} title={name} onClick={onClick}>
        <img src={`./img/tools/${id}.svg`} alt={name}/>
    </li>
)

const Separator = () => <li class="separator">Separator</li>

export default class Toolbox extends Component {
    onItemClick = evt => {
        let {id} = evt.currentTarget.dataset
        let {onItemClick = () => {}} = this.props

        onItemClick({id})
    }

    render() {
        return <section id="toolbox">
            <ul>
                <Item tool={this.props.tool} id="pan" name="Pan" onClick={this.onItemClick} />
                <Item tool={this.props.tool} id="move" name="Move" onClick={this.onItemClick} />
                <Item tool={this.props.tool} id="arrow" name="Arrow" onClick={this.onItemClick} />

                <Separator/>

                <Item tool={this.props.tool} id="code" name="Copy Code" onClick={this.onItemClick} />
            </ul>
        </section>
    }
}
