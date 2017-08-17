import {h, render} from 'preact'
import App from './components/App'

// Configure MathJax

MathJax.Hub.processSectionDelay = 0
MathJax.Hub.processUpdateDelay = 0
MathJax.Hub.Config({messageStyle: 'none', skipStartupTypeset: true})

// Render

render(<App/>, document.body)
