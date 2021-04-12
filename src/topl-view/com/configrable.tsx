/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import {NS_Configurable} from "@sdk";
import {ComContext} from "./ToplCom";
import {createEdtAry, createEdtItem} from "../util";
import CfgPin from "./CfgPin";
import {EDITOR_ROOT_SELECTOR} from "../../constants";
import ToplComModelForked from "./ToplComModelForked";

export function get(comContext: ComContext, reFocus?: () => any) {
  const {model, comDef, context, emitMessage, emitModule, emitItem, emitSnap} = comContext
  let rtn = []

  let comCategary = new NS_Configurable.Category(model.runtime.title)
  rtn.push(comCategary)

  const comGroup = new NS_Configurable.Group()

  const edtContext = getEditContext(comContext)

  // comGroup.addItem(createEdtItem(comContext, {
  //   title: 'ID',
  //   type: 'text',
  //   options: {
  //     readonly: true
  //   },
  //   value: {
  //     get() {
  //       return model.id
  //     }
  //   }
  // }))

  comGroup.addItem(createEdtItem(edtContext, {
    title: `标题 (${model.id})`,
    type: 'text',
    value: {
      get() {
        return model.runtime.title || comDef?.title
      }, set(ctx, val) {
        model.runtime.title = val
      }
    }
  }))

  comGroup.addItem(createEdtItem(comContext, {
    title: '版本',
    type: 'text',
    options: {
      readonly: true
    },
    value: {
      get() {
        return model.runtime.def.version
      }
    }
  }))

  // comGroup.addItem(createEdtItem(comContext, {
  //   title: '标记色',
  //   type: 'color',
  //   value: {
  //     get() {
  //       return model.runtime.labelColor
  //     }, set(context, val) {
  //       model.runtime.labelColor = val
  //     }
  //   }
  // }))

  // comGroup.addItem(createEdtItem(edtContext, {
  //   title: '标记',
  //   type: 'select',
  //   options: [
  //     {value: 'none', label: '无'},
  //     {value: 'todo', label: '待完成(Todo)'}
  //   ],
  //   value: {
  //     get() {
  //       return model.runtime.labelType
  //     }, set(context, val) {
  //       model.runtime.labelType = val
  //     }
  //   }
  // }))

  // if (model.runtime.def.namespace !== XGDefinedComLib.coms.subModule &&
  //   model.runtime.def.namespace !== XGDefinedComLib.coms.calculate &&
  //   model.runtime.def.namespace !== XGDefinedComLib.coms.extPoint) {
  //   comGroup.addItem(createEdtItem(edtContext, {
  //     title: 'Mock模式',
  //     type: 'switch',
  //     value: {
  //       get() {
  //         return model.runtime.mocking
  //       }, set(context, val) {
  //         model.runtime.mocking = val
  //       }
  //     }
  //   }))
  // }

  comCategary.addGroup(comGroup)

  if (context.isDesnMode()) {
    const ary = createEdtAry(comContext.comDef, getEditContext(comContext),
      {[EDITOR_ROOT_SELECTOR]: true, '*': true}, reFocus);
    if (ary) {
      const edtGroup = new NS_Configurable.Group()
      edtGroup.addItems(ary)

      comCategary.addGroup(edtGroup)
    }
  }

  const ioGroup = new NS_Configurable.Group()
  ioGroup.addItem(new NS_Configurable.RenderItem('输入项', function () {
    return <CfgPin type={'input'} pins={{
      def: model.inputPins,
      inModel: model.inputPinsInModel,
      ext: model.inputPinExts
    }}/>
  }))

  ioGroup.addItem(new NS_Configurable.RenderItem('输出项', function () {
    return <CfgPin type={'output'} pins={{
      def: model.outputPins,
      inModel: model.outputPinsInModel,
      ext: model.outputPinExts
    }}/>
  }))

  comCategary.addGroup(ioGroup)

  //-------------------------------------------------------------------
  const sysGroup = new NS_Configurable.Group()
  sysGroup.fixedAt = 'bottom'
  comCategary.addGroup(sysGroup)

  if (context.isDesnMode()) {
    if (!(model instanceof ToplComModelForked) || !(model as ToplComModelForked).isStartInDiagram()) {
      sysGroup.addItem(createEdtItem(edtContext, {
        title: '删除',
        type: 'button',
        value: {
          set(context, val) {
            const snap = emitSnap.start('itemDelete')
            emitItem.delete(model)
            emitItem.focus(void 0)
            snap.commit()
          }
        }
      }))
    }
  }

  return rtn;
}

export function getEditContext({context, model, emitItem, emitSnap, emitCanvasView}: ComContext) {
  return {
    emitSnap,
    get data() {
      return model.data
    },
    input: model.getInputEditor(emitItem),
    output: model.getOutputEditor(emitItem),
    // openEditor(opts) {
    //   //th.emitOpen.editor(opts)
    // }
  }
}
