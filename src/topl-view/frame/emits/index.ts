/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import {ToplComModel} from "../../com/ToplComModel";
import {PinModel} from "../../pin/PinModel";
import {
  BaseModel,
  ComSeedModel, ModuleSeedModel,
  NS_Emits,
  T_ComDef,
  T_PinSchema
} from "@sdk";
import FrameModel from "./../FrameModel";
import ToplBaseModel from "../../ToplBaseModel";
import {ToplViewContext} from "./../ToplView";
import {deepClone, getPosition} from "@utils";
import {alignToCanvasGrid} from "../../ToplUtil";
import {ConModel} from "../../con/ConModel";
import {COM_EDITOR_KEYS, PinExtInputs} from "../../config";
import {getEditContext} from "../../com/configrable";

import pasteNormal, {doToplProps} from './pasteNormal'
import ToplComModelForked from "../../com/ToplComModelForked";

export function initEmitIOEditor({context, frameModel, emitItem}: ToplViewContext): NS_Emits.IOEditor {
  return {
    getInput(instId) {
      const md: ToplComModel = frameModel.searchCom(instId) as ToplComModel;
      if (md) {
        return md.getInputEditor(emitItem)
      }
    },
    getOutput(instId) {
      const md: ToplComModel = frameModel.searchCom(instId) as ToplComModel;
      if (md) {
        return md.getOutputEditor(emitItem)
      }
    }
  } as NS_Emits.IOEditor
}

export function initEmitComponent(tvContext: ToplViewContext): NS_Emits.Component {
  const {context, frameModel, emitLogs, emitItem} = tvContext

  return {
    exist(def: T_ComDef, instId: string): { id: string, result: boolean, info: string } {
      const comModel = frameModel.searchCom(instId)
      // if(comModel.runtime){
      //
      // }
      //console.log(comModel.runtime.title)
      if (comModel !== void 0) {
        return {id: instId, result: true, info: void 0}
      } else {
        emitLogs.error(`组件(${def.namespace},id=${instId})在逻辑视图中未找到,会导致该组件在运行时无法渲染.`)
        return {id: instId, result: false, info: `组件在逻辑视图中未找到,会导致该组件在运行时无法渲染.`}
      }
    },
    add(instanceModel: ComSeedModel, state, opts) {//Add component
      if (state === 'finish') {
        const comDef = context.getComDef(instanceModel.runtime.def)

        const gmodel: ToplComModel = new ToplComModel(instanceModel, comDef)

        if (opts && opts.json) {
          doToplProps(opts.json, gmodel, void 0)//merge json
        }

        gmodel.parent = frameModel

        if (context.isDesnMode() && gmodel.runtime.hasUI()) {
          PinExtInputs.forEach(pin => {
            gmodel.addInputPinExt(pin.hostId, pin.title, pin.schema as T_PinSchema)
          })
        }

        // if (!gmodel.runtime.noRender) {
        //   PinExtInputs.forEach(pin => {
        //     gmodel.addInputPinExt(pin.hostId, pin.title, pin.schema as T_PinSchema)
        //   })
        // }

        const rms = instanceModel.runtime.model.style

        // const [left, top] = randomNum(50, 600)
        //
        // gmodel.style.left = left
        // gmodel.style.top = top

        if (rms && rms.left) {
          gmodel.style.left = alignToCanvasGrid(rms.left)
        } else {
          gmodel.style.left = alignToCanvasGrid(100 + Math.random() * 100)
        }

        if (rms && rms.top) {
          gmodel.style.top = alignToCanvasGrid(rms.top)
        } else {
          gmodel.style.top = alignToCanvasGrid(100 + Math.random() * 100)
        }

        const nmodel = frameModel.addComponent(gmodel)

        if (context.isDesnMode()) {
          if (nmodel.runtime.hasUI()) {
            frameModel.addDiagram(nmodel)
          }

          if (frameModel.state.isEnabled()) {
            setTimeout(v => {
              emitItem.focus(nmodel)
              getLayoutParent(gmodel).connections.changed()
            })
          }
        } else {
          frameModel.addDebugTempCom(gmodel)
        }

        return gmodel.runtime.id
      }
    },
    addSlot(comId: string, slotId: string, slotTitle?: string, type?: 'scope' | undefined): boolean {
      if (type && type === 'scope') {
        const com: ToplComModel = frameModel.searchCom(comId)
        com.addFrame(slotId, slotTitle)
      }
      return true
    },
    setSlotTitle(comId: string, slotId: string, slotTitle: string): boolean {
      const com = frameModel.searchCom(comId)
      const frame = com.getFrame(slotId)
      if (frame) {
        com.getFrame(slotId).title = slotTitle
        return true
      }
    },
    removeSlot(comId: string, slotId: string) {
      const com: ToplComModel = frameModel.searchCom(comId)
      com.removeFrame(slotId)
      return true
    },
    move(comModel: ComSeedModel, state: 'start' | 'ing' | 'finish') {
      if (comModel instanceof ToplComModel) {
        let container = getLayoutParent(comModel)
        if (state === 'ing') {
          container.connections.changing()
        }
        if (state === 'finish') {
          container.connections.changed()
        }
      }
    },
    cutToSlot(fromComId: string, toComId: string, toSlotId: string, order?: number): boolean {
      const model = frameModel.searchCom(fromComId), randomPo = toSlotId !== frameModel.id;
      if (toComId == null) {//Root
        return frameModel.cutIn(model, randomPo)
      } else {
        if (frameModel._rootF && frameModel.parent && frameModel.parent.id === toComId) {
          return frameModel.cutIn(model, randomPo)
        } else {
          const target = frameModel.searchCom(toComId)
          if (target) {
            return target.cutIn(model, toSlotId, randomPo)
          }
        }
      }
    },
    delete(model: BaseModel): boolean {
      if (model) {
        if (model instanceof ComSeedModel || model instanceof ToplComModel) {
          let comModel: ToplComModel
          if (model instanceof ToplComModel) {
            comModel = model
          } else {
            comModel = frameModel.searchCom(model.id);
            if (!comModel) {
              emitLogs.error(`组件(${model?.runtime.def?.namespace},id=${model.id})在逻辑视图中不存在.`)
              return false
            }
          }

          const delInFrame = frame => {
            let count = 0, max = frame.comAry.length * 2

            while (frame.comAry.length) {
              emitItem.delete(frame.comAry[0])
              if (count++ >= max) {
                break
              }
            }
            // slot.comAry.forEach(item => {
            //   emitItem.delete(item)
            // })
          }
          if (comModel.frames) {
            comModel.frames.forEach(slot => delInFrame(slot))
          }

          const lp = getLayoutParent(comModel)

          if (comModel instanceof ToplComModelForked) {//del in diagram
            comModel.destroy()
            lp.connections.changed()
          } else {
            const diagram = frameModel.searchDiagramByStartCom(comModel)
            if (diagram) {
              frameModel.delete(diagram)
            }

            comModel.destroy()
            lp.connections.changed()
          }
        } else {
          model.destroy()
        }
      }
      return true
    },
    focus<T extends (ToplBaseModel | ToplComModel | { focus; blur })>(model: T[] | T): boolean {
      if (tvContext.assitWith) {
        tvContext.assitWith = void 0
      }

      if (frameModel.state.isDisabled()) {
        return false
      }
      if (tvContext.assitWith) {
        tvContext.assitWith = void 0
      }
      if (!model) {
        frameModel.blur()
        return true
      }
      return frameModel.focusItem(model)
    },
    focusFork: (model: BaseModel): boolean => {
      if (!model) return
      if (model instanceof ToplComModel) {
        frameModel.state.disable();//Hide cur view
        return false;
      }
      frameModel.state.enable();//Focus cur view
      let toplModel = frameModel.searchCom(model.id)
      if (toplModel) {
        emitItem.focus(toplModel)
        return true;
      }
    },
    blur(model: ToplBaseModel | ToplComModel | { focus, blur }): boolean {
      if (frameModel.state.isDisabled()) {
        return false
      }
      frameModel.blur(model)
    },
    //--------------------------------------------------------------------------------
    hintPins(model: PinModel): boolean {
      let foundF = false
      if (model.schema) {
        const pinAry = frameModel.findPinAryBySchema(model)
        if (pinAry.length > 0) {
          foundF = true
          pinAry.forEach(pin => {
            pin.hint = true
          })
        }
      }
      return foundF
    },
    assistWithPin(model: PinModel): boolean {
      const viewPo = getPosition(frameModel.$el)
      const po = getPosition(model.$el)
      let x = po.x - viewPo.x - 15,
        y = po.y - viewPo.y + 15
      tvContext.assitWith = {
        type: 'inputs',
        pinModel: model,
        position: {x, y}
      }
    },
    connected(connection: ConModel): boolean {
      const fromPin = connection.startPin as PinModel
      const fromParent = fromPin.parent

      const toPin = connection.finishPin as PinModel
      const toParent = toPin.parent

      function doFn(fn, model: ToplComModel<any>) {
        if (typeof fn === 'function') {
          const comContext = {context, model, emitItem}

          return fn(getEditContext(comContext as any), {
            id: fromPin.hostId,
            title: fromPin.title,
            schema: deepClone(fromPin.schema)
          }, {
            id: toPin.hostId,
            title: toPin.title,
            schema: deepClone(toPin.schema)
          })
        }
      }

      if (fromPin.schema && fromPin.isSchemaRquestOfFollow()) {
        if (toPin.schema && !toPin.isSchemaRquestOfFollow()) {
          fromPin.schema.request = deepClone(toPin.schema.request)
        }
      }

      if (fromPin.schema && fromPin.isSchemaResponseOfFollow()) {
        if (toPin.schema && !toPin.isSchemaResponseOfFollow()) {
          fromPin.schema.response = deepClone(toPin.schema.response)
        }
      }

      if (toPin.schema && toPin.isSchemaRquestOfFollow()) {
        if (fromPin.schema && !fromPin.isSchemaRquestOfFollow()) {
          toPin.schema.request = deepClone(fromPin.schema.request)
        }
      }

      if (toPin.schema && toPin.isSchemaResponseOfFollow()) {
        if (fromPin.schema && !fromPin.isSchemaResponseOfFollow()) {
          toPin.schema.response = deepClone(fromPin.schema.response)
        }
      }

      if (fromParent instanceof ToplComModel) {
        const comDef = context.getComDef(fromParent.runtime.def)
        if (comDef.editors) {
          const fn = comDef.editors[COM_EDITOR_KEYS.OUTPUT_CONNECTED]
          doFn(fn, fromParent)
        }
      }

      if (toParent instanceof ToplComModel) {
        const comDef = context.getComDef(toParent.runtime.def)
        if (comDef.editors) {
          const fn = comDef.editors[COM_EDITOR_KEYS.INPUT_CONNECTED]
          doFn(fn, toParent)
        }
      }
    },
    disConnected(connection: ConModel): boolean {
      const fromPin = connection.startPin as PinModel
      const fromParent = fromPin.parent

      const toPin = connection.finishPin as PinModel
      const toParent = toPin.parent

      function doFn(fn, model: ToplComModel) {
        if (typeof fn === 'function') {
          const comContext = {context, model, emitItem}

          fn(getEditContext(comContext as any), {
            id: fromPin.hostId,
            title: fromPin.title,
            schema: deepClone(fromPin.schema)
          }, {
            id: toPin.hostId,
            title: toPin.title,
            schema: deepClone(toPin.schema)
          })
        }
      }

      if (fromParent instanceof ToplComModel) {
        const comDef = context.getComDef(fromParent.runtime.def)
        if (comDef.editors) {
          const fn = comDef.editors[COM_EDITOR_KEYS.OUTPUT_DIS_CONNECTED]
          doFn(fn, fromParent)
        }
      }

      if (toParent instanceof ToplComModel) {
        const comDef = context.getComDef(toParent.runtime.def)
        if (comDef.editors) {
          const fn = comDef.editors[COM_EDITOR_KEYS.INPUT_DIS_CONNECTED]
          doFn(fn, toParent)
        }
      }
    },
    paste(json) {
      return pasteNormal(json, tvContext)
    }
  } as NS_Emits.Component
}

function getLayoutParent(comModel: ComSeedModel): FrameModel {
  return comModel.parent
}

export function getOutliners({frameModel, context, emitItem}: ToplViewContext) {
  let fn = (frameModel: FrameModel) => {
    let rtn = [];
    if (frameModel.comAry) {
      frameModel.comAry.forEach((model) => {
        const def = context.getComDef(model.runtime.def)
        if (def) {
          rtn.push({
            id: model.id,
            get icon() {
              return def.icon
            },
            get title() {
              return model.runtime.title || def.title
            },
            get visible() {
              return true
            },
            get label() {
              const rtn = model.runtime.labelType
              return rtn !== 'none' ? rtn : void 0
            },
            get mocking() {
              //return model.runtime.mocking
            },
            // get curFrame() {
            //   return model.curFrame
            // },
            // get isModule() {
            //   return def.namespace === NS_XGraphComLib.coms.module
            // },
            get hasUI() {
              return model.runtime.hasUI()
            },
            get active() {
              return model.state.isFocused()
            },
            model: model,
            get items() {
              let rtn = [];
              if (model.frames) {
                //const activeId = model.curFrame.id
                model.frames.find((frame: FrameModel) => {
                  //if (frame.id === activeId) {
                  rtn = rtn.concat(fn(frame))
                  //}
                })
              }
              return rtn
            },
            focus() {
              emitItem.focus(model)
            },
            switchView() {
              emitItem.focusFork(model)
            }
          })
        } else {
          rtn.push({
            id: model.id,
            get icon() {
              return null
            },
            get title() {
              return `"${model.runtime.def.namespace}" not found`
            },
            get active() {
              return model.state.isFocused()
            },
            model: model,
            get items() {
              let rtn = [];
              if (model.frames) {
                model.frames.forEach((frame: FrameModel) => {
                  rtn = rtn.concat(fn(frame))
                })
              }
              return rtn
            },
            focus() {
              emitItem.focus(model)
            },
            switchView() {
              emitItem.focusFork(model)
            }
          })
        }
      })
    }
    return rtn
  }
  return fn(frameModel)
}