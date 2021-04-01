/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import {NS_Listenable,} from "@sdk";
import {ComContext} from "./ToplCom";
import {copy} from "@utils";
import ToplComModelForked from "./ToplComModelForked";

export function get(comContext: ComContext): Array<NS_Listenable.T_Listener> {
  const {model, comDef, emitSnap, emitItem, emitMessage} = comContext

  let btns = [
    // {
    //   title: '复制',
    //   keys: ['ctrl+c'],
    //   exe: () => {
    //     let snap = emitSnap.start('itemCopy')
    //
    //     const instanceModel = new ComBaseModel(model.runtime.clone())
    //     instanceModel.fromId = model.id
    //
    //     emitItem.copy(instanceModel)
    //
    //     snap.commit()
    //   }
    // },
    {
      title: '复制到剪贴板',
      keys: ['ctrl+c'],
      exe: () => {
        let json
        if (model instanceof ToplComModelForked) {
          json = model.toJSON()

          json['_from_'] = {
            type:'comInDiagram',
            id: model.forkedFrom.id
          }
        } else {
          json = model.runtime.toJSON()

          json['_from_'] = {
            type: 'comInDiagram',
            id: model.id
          }
        }

        if (copy(JSON.stringify(json))) {
          emitMessage.info(`已复制到剪切板.`)
        }
      }
    }
  ]


  if (!(model instanceof ToplComModelForked) || !(model as ToplComModelForked).isStartInDiagram()) {
    btns.push({
      title: '删除',
      keys: ['Backspace'],
      exe: () => {
        const snap = emitSnap.start('itemDelete')
        emitItem.delete(model)
        emitItem.focus(void 0)
        snap.commit()
      }
    })
  }

  return btns
}