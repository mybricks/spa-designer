/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import {NS_Listenable} from "@sdk";
import {ComContext} from "../ToplCom";
import {copy} from "@utils";

export function get(comContext: ComContext): Array<NS_Listenable.T_Listener> {
  const {model, comDef, emitSnap, emitItem,emitMessage} = comContext

  let btns = [
    {
      title: '复制',
      keys: ['ctrl+c'],
      exe: () => {
        const json = model.runtime.toJSON()

        //json.fromId = model.id
        if (copy(JSON.stringify(json))) {
          emitMessage.info(`已复制到剪切板.`)
        }
      }
    },
    {
      title: '删除',
      keys: ['Backspace'],
      exe: () => {
        let snap = emitSnap.start('itemDelete')
        if (emitItem.delete(model)) {
          emitItem.focus(void 0)
          snap.commit()
        } else {
          snap.cancel();
        }
      }
    }]

  return btns
}