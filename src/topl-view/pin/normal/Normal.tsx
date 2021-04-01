/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import {evt, observe, useComputed} from "@mybricks/rxui";
import css from "./Normal.less";
import {HOVER_PIN, PinContext} from "../Pin";
import {PinModel} from "../PinModel";
import PinModelForked from "../PinModelForked";

export default function Normal({click, mousedown, help}) {
  const {model, context, comContext} = observe(PinContext, {from: 'parents'})

  const style0 = useComputed(() => {
    //const rst = {visibility: model.hover ? 'visible' : 'hidden'}
    const rst = {}
    if (model.direction.match(/^input|inner-input$/gi)) {
      rst['right'] = '12px'
    } else {
      rst['left'] = '12px'
    }
    return rst
  })

  const valueStyle = useComputed(() => {
    return model.direction.match(/^input|inner-output$/gi) ? {right: 12} : {left: 12}
  })

  const classes = useComputed(() => {
    const isRunMode = context.isDebugMode()
    const rtn = [css.pin];
    isRunMode && rtn.push(css.pinDebug)
    model.isTypeOfExt() && rtn.push(css.pinExt)

    if (model.isDirectionOfInput()) {
      rtn.push(css.inputPin)
    } else {
      rtn.push(css.outputPin)
    }

    // if (model.parent.state.isFocused()) {
    //   rtn.push(css.pinHover)
    //   model.direction === 'input' && rtn.push(css.inputPinHover)
    //   model.direction === 'output' && rtn.push(css.outputPinHover)
    // }

    ;(model.state.isFocused() || model.state.isHovering()) && rtn.push(css.pinFocus);
    (model.forkedFrom || model).state.isRunning() && isRunMode && rtn.push(css.pinRunning);
    model.hint && rtn.push(css.hint);
    model.emphasized && rtn.push(css.emphasized);
    !model.state.isFocused() && model.conAry.length && rtn.push(css.connected);

    return rtn.join(' ')
  })

  const exeVal = useComputed(() => {
    const exe = (model.forkedFrom || model).exe

    if (exe) {
      const {val, from} = exe
      let showF: boolean = false
      showF = true
      if (showF && val !== void 0) {
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
      <a className={css.pinLine}>
        <div className={css.hintShow}/>
        <p/>
      </a>
      <div data-xg-topl-type='pin-title' className={css.pinTitle} style={style0}>
        <p style={{float: model.isDirectionOfInput() ? 'right' : null}}>
          <span className={css.title}>{model.title}</span>
          {/* TODO，老逻辑视图不需要帮助 */}
          {showHelp ?
            (<span className={css.help} onClick={evt(help).stop}>帮助</span>)
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