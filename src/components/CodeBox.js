import {h, Component} from 'preact'
import classNames from 'classnames'

export default class CodeBox extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        let {show, code} = this.props

        return <section class={classNames('code-box', {show})}>
            <textarea>{code}</textarea>
        </section>
    }
}
