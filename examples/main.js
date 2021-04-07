import { render } from '@mybricks/rxui'

import App from './App'

const parent = document.createElement('div')
parent.style.height='100%'
document.body.appendChild(parent)
// render(App, parent, () => {
//     document.getElementById('app').replaceWith(...[...parent.childNodes])
//   }
// )

render(<App />, parent)