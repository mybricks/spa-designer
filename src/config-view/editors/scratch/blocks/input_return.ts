/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import {VAR_OUTPUT} from "../constants";

export default {
  name: 'xg.input_return',
  title: '返回',
  data: {},
  render(renderer, data, {curFn, getOutputAry}) {
    renderer.setColour(70)
    const aaa = renderer.appendValueInput('rtn')
      .appendField('返回')

    // const nullValBlock = renderer.workspace.newBlock('math_number')
    //
    // nullValBlock.setShadow(true);
    // nullValBlock.initSvg();
    // nullValBlock.render();
    //
    // aaa.connection.connect(nullValBlock.outputConnection)

    const allOutPinAry = getOutputAry()
    const rtn = []
    if (curFn.input) {
      rtn.push(['当前输入', `in:${curFn.input}`])
    }
    if (allOutPinAry) {
      allOutPinAry.forEach(pin => {
        rtn.push([pin.title, `out:${pin.id}`])
      })
    }

    if (rtn.length > 0) {
      renderer.appendDummyInput()
        .appendField('到')
        .appendField(new Blockly.FieldDropdown(() => {
          return rtn
        }), 'target')

      renderer.setPreviousStatement(true)
      renderer.setNextStatement(true)
    } else {
      renderer.setEnabled(false)
    }
    renderer.inputsInline = true
  },
  editors: [{
    title: '列表',
    type: 'params',
    value: {
      get({data}) {
        return data.itemAry
      },
      set({data}, val) {
        if (typeof val === 'string') {
          val = JSON.parse(val)
        }
        data.itemAry = val
      }
    }
  }],
  to(type, block, data, {logDebug}) {
    if (type === 'js') {
      const rtn = Blockly.JavaScript.valueToCode(block, 'rtn', Blockly.JavaScript.ORDER_NONE)
      const target = block.getFieldValue('target')
      const matchOut = /^out:(.+)$/.exec(target)
      if (matchOut) {//output
        const outHostId = matchOut[1]
        return `
          ${logDebug}(\`返回到输出项${outHostId}: ${rtn}\`)
          ${outHostId}(${rtn});
        `
      } else {
        return `
          ${logDebug}(\`返回到当前输入项: ${rtn}\`)
          ${VAR_OUTPUT}(${rtn});
        `
      }
    }
  }
}