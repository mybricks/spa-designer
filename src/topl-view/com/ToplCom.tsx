/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import css from "./ToplCom.less";
import cssParant from "./ToplCom.less";

import {dragable, observe, useComputed, useObservable} from '@mybricks/rxui';
import {ToplComModel} from './ToplComModel';
import {DesignerContext, NS_Emits, T_XGraphComDef} from '@sdk';
import Normal from './normal/Normal';
import ExceptionCom from "./exception/ExceptionCom";
import {useEffect} from "react";
import {ToplViewContext} from "../frame/ToplView";
import {getPosition} from "@utils";
import {canCutInFrame, refactorCons} from "./util";
import {alignToCanvasGrid} from "../ToplUtil";
import {PinModel} from "../pin/PinModel";
import Pin from "../pin/Pin";
import FrameModel from "../frame/FrameModel";
import DiagramModel from '../frame/DiagramModel'
import Block from "./block/Block";
import ToplComModelForked from "./ToplComModelForked";
import Start from "./start/Start";

export class ComContext {
  context: DesignerContext
  viewContext: ToplViewContext
  comDef: T_XGraphComDef
  model: ToplComModel
  emitLogs: NS_Emits.Logs
  emitMessage: NS_Emits.Message
  emitItem: NS_Emits.Component
  emitModule: NS_Emits.Module
  emitSnap: NS_Emits.Snap
}

export default function ToplCom({model}: { model: ToplComModel }) {
  const emitLogs = useObservable(NS_Emits.Logs, {expectTo: 'parents'})
  const emitMessage = useObservable(NS_Emits.Message, {expectTo: 'parents'})
  const emitSnap = useObservable(NS_Emits.Snap, {expectTo: 'parents'})
  const emitItem = useObservable(NS_Emits.Component, {expectTo: 'parents'})
  const emitModule = useObservable(NS_Emits.Module, {expectTo: "parents"})

  const context = observe(DesignerContext, {from: 'parents'})
  const viewContext = observe(ToplViewContext, {from: 'parents'})

  const comDef = context.getComDef(model.runtime.def)

  useObservable(ComContext,
    next => {
      if (comDef && !model.runtime.upgrade) {
        if (!model.runtime.def.version) {
          model.runtime.def.version = comDef.version
        }
        if (model.runtime.def.version !== comDef.version) {
          //const info = `"${comDef.title}" 版本号发生变更(${model.runtime.def.version} -> ${comDef.version}).`
          const info = `${model.runtime.def.version} > ${comDef.version}`
          model.runtime.upgrade = {
            info
          }
        }
      }
      next({model, comDef, context, viewContext, emitLogs, emitMessage, emitSnap, emitItem, emitModule})
    },
    {to: 'children'})

  if (!comDef) {
    emitLogs.error('组件库错误', `未找到组件(${model.runtime.def.namespace}@${model.runtime.def.version})定义.`)
    return <ExceptionCom model={model} type='error'
                         msg={`未找到组件(${model.runtime.def.namespace}@${model.runtime.def.version})定义.`}/>
  }

  // useWatcher(model.forkedFrom, 'inputPinsInModel', (prop, pinAry: PinModel[]) => {
  //   (model as ToplComModelForked).refreshForkedFromInputs()
  // })
  //
  // console.log((model.forkedFrom as ToplComModelForked).outputPinsInModel)
  //
  // useWatcher(model.forkedFrom, 'outputPinsInModel', (prop, pinAry: PinModel[]) => {
  //   debugger
  //   (model as ToplComModelForked).refreshForkedFromOutputs()
  // })

  useEffect(() => {
    model.runtime.topl = model.forkedFrom || model

    if (!model.runtime.title) {
      model.runtime.title = comDef.title
    }

    // const promptInfo = getUpdater(model, comDef)
    // if (promptInfo.length > 0) {
    //   model.runtime.updateInfo = {content: promptInfo}
    //   //comContext.promptToUpdate = {content: promptInfo}
    // }
  }, [model.runtime])

  useEffect(() => {//Validate
    //if duplicate ID
    const rt = model.runtime
    // const exist: GeoComModel = COM_IDS[model.id]
    // if (exist) {
    //   emitLogs.error('数据错误', `逻辑视图中的重复组件ID:(${exist.runtime.title},namespace=${exist.runtime.def.namespace},id=${model.id}) 与 (${rt.title},namespace=${rt.def.namespace},id=${model.id})`)
    // }
    // COM_IDS[model.id] = model

    //If it's not exist
    if (model.runtime.hasUI()) {
      const ary = emitItem.exist(rt.def, model.id)
      if (Array.isArray(ary)) {
        ary.forEach(item => {
          if (!(item.result)) {
            console.error(item.info)
            model.error = {message: `${item.info}`}
          }
        })
      }
    }
  }, [])

  if (model instanceof ToplComModelForked && model.isStartInDiagram()) {
    return <Start/>
  }else if (model.frames?.length > 0) {
    return <Block/>
  } else {
    return <Normal/>
  }
}

export function getStyle(model: ToplComModel) {
  return useComputed(() => {
    const inExt = model.inputPinExts, rtInputAry = model.inputPinsInModel
    const outExt = model.outputPinExts, rtOutputAry = model.outputPinsInModel
    const max = Math.max(model.inputPins.length
      + (inExt ? inExt.length : 0)
      + (rtInputAry ? rtInputAry.length : 0),
      model.outputPins.length
      + (outExt ? outExt.length : 0)
      + (rtOutputAry ? rtOutputAry.length : 0))

    let pinHeight = Math.max(max * 17 + 10, 27)
    let sty = model.style;

    return {
      transform: `translate(${sty.left}px,${sty.top}px)`,
      minHeight: pinHeight + 'px'
    }
  })
}

export function Info({model, className}) {
  observe(ComContext, {from: 'parents'})
  return model.error || model.runtime.upgrade ? (
    <div className={className || cssParant.info}>
      {model.error ? model.error.message : ''}
      {model.runtime.upgrade ?
        <>
          <ul>
            <li>{model.runtime.upgrade.info}</li>
          </ul>
          <p onClick={upgrade}>更新</p>
        </> :
        ''}
    </div>
  ) : null
}

function upgrade() {
  const {model, comDef, emitItem, emitSnap} = observe(ComContext)
  emitItem.upgrade(model)
}

export function Inputs({model, inputPinAry, readOnly}:
                         { model: ToplComModel, inputPinAry?: PinModel[] }) {
  useComputed(() => {
    if (model instanceof ToplComModelForked) {
      model.synchronizeInputs()
    }
  })

  const rtn = []

  if (model.inputPins) {
    model.inputPins.forEach(pin => {
      //const pinWrapper = wrapper.inputAry.find(wrapper=>pin===wrapper.pinModel)
      rtn.push(
        <Pin model={pin} key={pin.id}/>
      )
    })
  }

  let definedInAry = model.inputPinsInModel
  if (definedInAry) {
    definedInAry.forEach(pin => {
      rtn.push(
        <Pin model={pin} key={pin.id}/>
      )
    })
  }

  if (inputPinAry) {
    inputPinAry.forEach(pin => {
      rtn.push(
        <Pin model={pin} key={pin.id}/>
      )
    })
  }

  if (model.inputPinExts) {
    model.inputPinExts.forEach(pin => {
      rtn.push(
        <Pin model={pin} key={pin.id}/>
      )
    })
  }

  return (
    <div className={css.inputPins}>
      {rtn}
    </div>
  )
}

export function Outputs({model, outputPinAry, type, className}:
                         { model: ToplComModel, outputPinAry?: PinModel[] }) {
  useComputed(() => {
    if (model instanceof ToplComModelForked) {
      model.synchronizeOutputs()
    }
  })

  const rtn = []

  if (model.outputPins) {
    model.outputPins.forEach(pin => {
      rtn.push(
        <Pin model={pin} key={pin.id} type={type}/>
      )
    })
  }

  if (model.outputPinsInModel) {
    model.outputPinsInModel.forEach(pin => {
      rtn.push(
        <Pin model={pin} key={pin.id} type={type}/>
      )
    })
  }

  if (outputPinAry) {
    outputPinAry.forEach(pin => {
      rtn.push(
        <Pin model={pin} key={pin.id} type={type}/>
      )
    })
  }

  if (model.outputPinExts) {
    model.outputPinExts.forEach(pin => {
      rtn.push(
        <Pin model={pin} key={pin.id} type={type}/>
      )
    })
  }

  return (
    <div className={className || css.outputPins}>
      {rtn}
    </div>
  )
}

export function mouseDown(evt) {
  const {model, context, emitItem, emitSnap} = observe(ComContext)
  if (context.isDebugMode()) {
    return
  }
  const modelPo = getPosition(model.$el)

  let snap, parentPo, dragToFrame
  dragable(evt,
    ({po: {x, y}, epo: {ex, ey}, dpo: {dx, dy}}, state) => {
      if (state === 'start') {
        snap = emitSnap.start('moveItems')
        if (model.parent instanceof FrameModel) {
          if (model.parent.focusedDiagram) {
            parentPo = getPosition(model.parent.focusedDiagram.$el)
          } else {
            parentPo = getPosition(model.parent.$el)
          }
        } else {
          if (model.parent instanceof DiagramModel) {
            if (model.parent.$el) {
              parentPo = getPosition(model.parent.$el)
            } else {
              parentPo = getPosition(model.parent.parent.$el)
            }
          } else {
            parentPo = getPosition(model.parent.$el)
          }
        }
        return
      }

      const nx = alignToCanvasGrid(x - parentPo.x),
        ny = alignToCanvasGrid(y - parentPo.y)
      const mx = alignToCanvasGrid((parentPo.x + parentPo.w) - (x + modelPo.w)),
        my = alignToCanvasGrid((parentPo.y + parentPo.h) - (y + modelPo.h))

      if (nx <= 0 || ny <= 0 || mx <= 10 || my <= 10) {
        return
      }
      if (nx !== model.style.left || ny !== model.style.top) {
        model.style.left = nx
        model.style.top = ny
      } else if (state === 'moving') {
        return
      }

      if (state == 'moving') {
        model.state.moving()
        refactorCons(model, true)

        if (dragToFrame) {
          dragToFrame.state.hoverRecover()//Revocer
        }
        dragToFrame = model.root.findItemByPo({x: ex, y: ey}, model);
        if (canCutInFrame(model, dragToFrame)) {
          dragToFrame.state.hover()
        } else {
          dragToFrame && (dragToFrame = undefined)
        }
        emitItem.move(model, 'ing')
      }

      if (state == 'finish') {
        if (dragToFrame) {
          model.destroyAllConnections()//Remove all connections
          emitItem.cutToSlot(model.id, dragToFrame.parent ? dragToFrame.parent.id : null, dragToFrame.id)
          dragToFrame.state.hoverRecover()//Revocer
        }
        refactorCons(model)
        snap.commit()

        emitItem.move(model, 'finish')
        // setTimeout(v => {
        //   emitItem.focus(model)
        // })
      }
    }
  )
}

// function getUpdater(model: ToplComModel, comDef: T_XGraphComDef) {
//   const detail = []
//   if (model.runtime.def.namespace !== XGDefinedComLib.coms.calculate &&
//     model.runtime.def.namespace !== XGDefinedComLib.coms.extPoint) {
//     if (model.runtime.def.version !== comDef.version) {
//       detail.push(`"${comDef.title}" 版本号发生变更(${model.runtime.def.version || '1.0.0'} -> ${comDef.version})`)
//       return detail
//     }
//
//     const mInputAry: PinModel[] = model.inputPins
//     const defInPutAry: T_IOPin[] = comDef.inputs || []
//
//     const mOutputAry: PinModel[] = model.outputPins
//     const defOutputAry: T_IOPin[] = comDef.outputs || []
//
//     if (defInPutAry) {
//       defInPutAry.forEach(pin => {
//         if (!pin.schema) {
//           detail.push(`输入项(${pin.title})没有定义请求项(request)描述.`)
//         }
//       })
//     }
//
//     if (mInputAry.length !== defInPutAry.length) {
//       detail.push(`输入项定义数量发生变更(当前:${mInputAry.length} -> 定义:${defInPutAry.length})`)
//     } else {
//       mInputAry.find((pin, idx) => {
//         const defPin = defInPutAry[idx]
//         if (pin.hostId !== defPin.id) {
//           detail.push(`输入项定义(id=${pin.hostId},title=${pin.title})ID发生变更(${pin.hostId} ->  ${defPin.id})`)
//           return true
//         } else if (pin.title !== defPin.title) {
//           detail.push(`输入项定义(id=${pin.hostId},title=${pin.title})标题发生变更(${pin.title} ->  ${defPin.title})`)
//           return true
//         }
//         // else if (pin.schema !== defPin.schema) {
//         //   detail.push(`输入项定义(id=${pin.hostId},title=${pin.title})数据格式发生变更(${pin.schema} ->  ${defPin.schema})`)
//         //   return true
//         // }
//       })
//     }
//
//     if (defOutputAry) {
//       defOutputAry.forEach(pin => {
//         if (!pin.schema) {
//           detail.push(`输出项(${pin.title})没有定义请求项(request)描述.`)
//         }
//       })
//     }
//
//     if (detail.length === 0) {
//       if (mOutputAry.length !== defOutputAry.length) {
//         detail.push(`输出项定义数量发生变更(${mOutputAry.length} -> ${defOutputAry.length})`)
//       } else {
//         mOutputAry.find((pin, idx) => {
//           const defPin = defOutputAry[idx]
//           if (pin.hostId !== defPin.id) {
//             detail.push(`输出项定义(id=${pin.hostId},title=${pin.title})ID发生变更(${pin.hostId} ->  ${defPin.id})`)
//             return true
//           } else if (pin.title !== defPin.title) {
//             detail.push(`输出项定义(id=${pin.hostId},title=${pin.title})标题发生变更(${pin.title} ->  ${defPin.title})`)
//             return true
//           }
//           // else if (pin.schema !== defPin.schema) {
//           //   detail.push(`输出项定义(id=${pin.hostId},title=${pin.title})数据格式发生变更(${pin.schema} ->  ${defPin.schema})`)
//           //   return true
//           // }
//         })
//       }
//     }
//   }
//   return detail
// }
