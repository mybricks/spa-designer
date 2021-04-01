/**
 * XGraph Opensource
 * This source code is licensed under the MIT license.
 * 
 * CheMingjun @2019
 * Mail:chemingjun@126.com Wechat:ALJZJZ
 */

import {evt, observe, useComputed} from "@mybricks/rxui";
import css from "./Start.less";
import {HOVER_PIN, PinContext} from "../Pin";

export default function Start({click, mousedown, help}) {
  const {model, context, comContext} = observe(PinContext, {from: 'parents'})

  const style0 = useComputed(() => {
    //const rst = {visibility: model.hover ? 'visible' : 'hidden'}
    const rst = {}
    if (model.direction.match(/^input|inner-input$/gi)) {
      rst['right'] = '12px'
    } else {
      rst['left'] = '15px'
    }
    return rst
  })

  const valueStyle = useComputed(() => {
    return model.direction.match(/^input|inner-output$/gi) ? {right: 12} : {left: 20}
  })

  const classes = useComputed(() => {
    const isRunMode = context.isDebugMode()
    const rtn = [css.pin];
    isRunMode && rtn.push(css.pinDebug)

    // if (model.parent.state.isFocused()) {
    //   rtn.push(css.pinHover)
    //   model.direction === 'input' && rtn.push(css.inputPinHover)
    //   model.direction === 'output' && rtn.push(css.outputPinHover)
    // }
    model.emphasized && rtn.push(css.emphasized);
    ;(model.state.isFocused() || model.state.isHovering()) && rtn.push(css.pinFocus);
    model.state.isRunning() && isRunMode && rtn.push(css.pinRunning);
    !model.state.isFocused() && model.conAry.length && rtn.push(css.connected);

    return rtn.join(' ')
  })

  const exeVal = useComputed(() => {
    const exe = (model.forkedFrom || model).exe

    if (exe) {
      const {val, from} = exe
      if (val !== void 0) {
        let rtn
        if (typeof val === 'object') {
          if (Array.isArray(val)) {
            rtn = '[...]'
          } else {
            rtn = '{...}'
          }
        } else {
          rtn = JSON.stringify(val)
        }
        return (
          <div className={css.pinValue} style={valueStyle}
               onClick={evt(click).stop}>
            <p style={{float: model.direction.match(/^input|inner-output$/gi) ? 'right' : null}}>
              {rtn}
            </p>
          </div>
        )
      }
    }
  })

  const showHelp = useComputed(() => {
    if (!context.useLatestFeatures) {
      return false
    }
    if (context.isDebugMode()) {
      return false
    }
    if (model.state.isFocused() && !model.isDirectionOfInput() && context.configs.extPoints?.['toplView']) {
      // const ext = getExtension(NS_ExtensionNames.COM_ASSIST)
      // return ext && typeof ext.render === 'function'
      return true
    }
  })

  return (
    <div id={model.id} ref={ele => {
      ele && (model.$el = ele)
    }}
         className={classes}
         onMouseOver={e => HOVER_PIN.set(model, e.target)}
         onMouseOut={e => HOVER_PIN.clear()}
         onClick={evt(click).stop}
         onMouseDown={evt(mousedown).stop.prevent}>
      <div className={css.pinTitle} style={style0}>
        <p>
          <span className={css.title}>{model.title}</span>
          {showHelp ?
            (<span className={css.help} onClick={evt(help).stop}>连接到</span>)
            : null}
        </p>
      </div>
      {/*<div className={css.fixTitle}>*/}
      {/*  {model.title}*/}
      {/*</div>*/}
      {exeVal}
    </div>
  )
}