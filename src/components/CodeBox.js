import {h, Component} from 'preact'
import classNames from 'classnames'
import copyText from 'copy-text-to-clipboard'

export default class CodeBox extends Component {
  constructor(props) {
    super(props)
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.show && this.props.show) {
      this.textareaElement.focus()
      this.textareaElement.select()
    }
  }

  handleOverlayMouseDown = evt => {
    if (evt.target !== evt.currentTarget) return

    let {onClose = () => {}} = this.props
    onClose(evt)
  }

  handleCopyClick = () => {
    copyText(this.props.code)

    this.textareaElement.focus()
    this.textareaElement.select()
  }

  render() {
    let {show, code} = this.props

    return (
      <section
        id="modal-overlay"
        class={classNames({show})}
        onMouseDown={this.handleOverlayMouseDown}
      >
        <section class="modal-box code-box">
          <textarea
            ref={el => (this.textareaElement = el)}
            value={code}
            onInput={this.props.onCodeInput}
          />

          <ul class="buttons">
            <li>
              <button onClick={this.handleCopyClick}>Copy</button>
            </li>
            <li class="separator" />
            <li>
              <button onClick={this.props.onParseButtonClick}>Parse</button>
            </li>
            <li>
              <button onClick={this.props.onClose}>Close</button>
            </li>
          </ul>
        </section>
      </section>
    )
  }
}
