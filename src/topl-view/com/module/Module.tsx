/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import {evt, observe, useComputed} from '@mybricks/rxui';
import {useMemo} from 'react';
import css from './Module.less';
import cssParant from '../ToplCom.less';
import {ComContext, Inputs, mouseDown, Ouputs} from '../ToplCom';
import {get as getConfigurable} from '../configrable'
import {get as getListenable} from './listenable'
import {ToplComModel} from "../ToplComModel";
import {NS_Configurable, NS_Listenable} from "@sdk";
import {ICON_COM_DEFAULT} from "@sdk";
import I_Configurable = NS_Configurable.I_Configurable;
import I_Listenable = NS_Listenable.I_Listenable;

export default function Module() {
  const comContext = observe(ComContext, {from: 'parents'})
  const {model, comDef, context} = comContext
  
  useMemo(() => {
    // if (!model.init) {
    //   debugger
    //   if (!model.frames || model.frames.length <= 0) {
    //     model.addFrame(model.id, '拓扑视图', VIEW_TOPL_NAME, true)
    //   }
    //   model.init = true
    // }

    (model as I_Configurable).getConfigs = function () {
      return getConfigurable(comContext)
    }
    ;(model as I_Listenable).getListeners = function () {
      if (context.isDesnMode()) {
        return getListenable(comContext)
      }
    }

    // if (comDef.icon && comDef.icon.toUpperCase().startsWith('HTTP')) {
    //   return comDef.icon
    // }
  }, [])

  return (
    <div ref={el => el && (model.$el = el)}
         data-topl-com-namespace={model.runtime.def.namespace}
         className={`${css.com} 
                     ${model.runtime.labelType === 'todo' ? `${cssParant.labelTodo}` : ''}
                     ${model.state.isFocused() || model.state.isMoving() ? cssParant.focus : ''}`}
         style={getStyle(model)}
         onClick={evt(click).stop}
         onDoubleClick={evt(dblClick).stop}
         onMouseDown={evt(mouseDown).stop.prevent}
         onMouseEnter={e => model.state.hover()}
         onMouseLeave={e => model.state.hoverRecover()}>
      <div className={css.comIcon}>
        <img src={ICON_COM_DEFAULT}/>
      </div>
      <p className={css.title}>
        {model.runtime.title || comDef.title}
        <br/>
        <span>[模块]</span>
      </p>
      {/*<div className={css.btns}>*/}
      {/*  <button onClick={open}>打开</button>*/}
      {/*</div>*/}
      <Inputs model={model}/>
      <Ouputs model={model}/>
    </div>
  )
}

function getStyle(model: ToplComModel) {
  return useComputed(() => {
    const frame = model.frames[0]
    const inExt = model.inputPinExts, rtInputAry = model.inputPinsInModel
    const outExt = model.outputPinExts, rtOutputAry = model.outputPinsInModel
    const max = Math.max(frame.inputPins.length
      + (inExt ? inExt.length : 0)
      + (rtInputAry ? rtInputAry.length : 0),
      frame.outputPins.length
      + (outExt ? outExt.length : 0)
      + (rtOutputAry ? rtOutputAry.length : 0))

    let pinHeight = max * 17 + 10;
    let sty = model.style;

    return {
      transform: `translate(${sty.left}px,${sty.top}px)`,
      minHeight: pinHeight + 'px'
    }
  })
}

function open() {
  const {comDef, model, context, emitModule} = observe(ComContext)

  const frame = model.frames ? model.frames[0] : void 0

  emitModule.load({
    instId: model.id,
    title: model.runtime.title || comDef.title,
    frame//Emits frame only,slot will found in DBLView
  } as any)
}

function click(evt) {
  const {model, context, emitItem, emitSnap} = observe(ComContext)
  if (model.state.isFocused()) {
    emitItem.blur(model)
    model.blur()
  } else {
    emitItem.focus(model)
  }
}

function dblClick(evt) {
  const {model, comDef, context, emitItem, emitSnap} = observe(ComContext)
  if (context.isDesnMode()) {
    emitItem.focusFork(model)
  }
}

