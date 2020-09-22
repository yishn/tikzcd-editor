import {h, render} from 'preact'
import App from './components/App'

// Configure MathJax

window.MathJax = {
  // Load noerrors extension to display raw invalid TeX
  loader: {load: ['[tex]/noerrors']},
  startup: {
    // No typeset at startup
    typeset: false,
    // Render main component when MathJax is ready
    ready: () => {
      MathJax.startup.defaultReady()
      render(<App />, document.body)
    }
  },
  tex: {
    // Use noerrors package
    packages: {'[+]': ['noerrors']},
    // Set delimiters for inline math
    inlineMath: [['\\(', '\\)']]
  },
  chtml: {
    // Set mjx-merror elements to use TeX fonts instead of default browser font
    merrorFont: ''
  },
  options: {
    // Disable contextual menu
    enableMenu: false
  }
}

// Load MathJax

let script = document.createElement('script')
script.src =
  'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.1.2/es5/tex-chtml.js'
script.async = true
document.head.appendChild(script)
