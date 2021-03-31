/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import {I_Node} from 'xgraph.compiler';
import {Serializable} from 'rxui';
import {SerializeNS} from '../../constants';
import {ToplComModel} from "../ToplComModel";
import {PinModel} from "../../pin/PinModel";
import {ComSeedModel, T_XGraphComDef} from "@sdk";
import {assetPinSchema} from "@utils";
import FrameModel from "../../frame/FrameModel";

@Serializable(SerializeNS + 'topl.SubModuleModel')
export class ModuleModel extends ToplComModel implements I_Node {

  constructor(instanceModel?: ComSeedModel, comDef?: T_XGraphComDef) {
    super(instanceModel)
    if (!comDef) return

    if (comDef.inputs) {
      comDef.inputs.forEach(pin => {
        let schema;
        try {
          schema = assetPinSchema(pin)
        } catch (ex) {
          console.warn(ex)
        }
        this.addInputPin(pin.id, pin.title, schema)
      })
    }

    const rtModel = instanceModel.runtime.model
    if (rtModel && rtModel.inputAry) {
      rtModel.inputAry.forEach(pin => {
        this.addInputPinInModel(pin.hostId, pin.title, pin.schema)
      })
    }

    if (comDef.outputs) {
      comDef.outputs.forEach(pin => {
        let schema;
        try {
          schema = assetPinSchema(pin)
        } catch (ex) {
          console.warn(ex)
        }
        this.addOutputPin(pin.id, pin.title, schema)
      })
    }

    if (rtModel && rtModel.outputAry) {
      rtModel.outputAry.forEach(pin => {
        this.addOutputPinInModel(pin.hostId, pin.title, pin.schema)
      })
    }

    if (comDef.slots && comDef.slots.length > 0) {
      let frames = []
      comDef.slots.forEach((def) => {
        if (def.type && def.type === 'scope') {
          let frame = new FrameModel(def.id, def.title,true,'scope')
          frame.parent = this

          frame.addIODiagram()

          if (def.inputs) {
            def.inputs.forEach(({id, title, schema}, idx) => {
              frame.addInputPin(id, title, schema)
            })
          }
          if (def.outputs) {
            def.outputs.forEach(({id, title, schema}, idx) => {
              frame.addOutputPin(id, title, schema)
            })
          }
          frames.push(frame)
        }
      })
      if (frames.length > 0) {
        this.frames = frames
      }
    }
  }

  addInputPin(hostId: string, title: string, schema): PinModel {
    const newPin = super.addInputPin(hostId, title, schema)
    if (newPin) {
      const inInFrame = this.frames[0].inputPins.find(pin => pin.hostId === hostId)
      if (inInFrame) {
        newPin.proxyPin = inInFrame
      }
    }

    return newPin
  }

  removeInputPin(hostId: string) {
    let sidx
    const rtInputAry = this.inputPins
    if (rtInputAry) {
      rtInputAry.find((item, idx) => {
        if (item.hostId === hostId) {
          item.destroy()
          sidx = idx
        }
      })
      rtInputAry.splice(sidx, 1)
    }
  }

  setInputPinTitle(hostId: string, title: string) {
    const rtInputAry = this.inputPins
    if (rtInputAry) {
      rtInputAry.find(pin => {
        if (pin.hostId == hostId) {
          pin.title = title;
        }
      })
    }
  }

  setInputPinSchema(hostId: string, schema: any) {
    const rtOutputAry = this.inputPins
    if (rtOutputAry) {
      rtOutputAry.find(pin => {
        if (pin.hostId == hostId) {
          pin.schema = schema;
        }
      })
    }
  }

  addOutputPin(hostId: string, title: string, schema): PinModel {
    const newPin = super.addOutputPin(hostId, title, schema)
    if (newPin) {
      const inInFrame = this.frames[0].outputPins.find(pin => pin.hostId === hostId)
      if (inInFrame) {
        inInFrame.proxyPin = newPin
      }
    }

    return newPin
  }

  removeOutputPin(hostId: string) {
    let sidx
    const rtOutputAry = this.outputPins
    if (rtOutputAry) {
      rtOutputAry.find((item, idx) => {
        if (item.hostId === hostId) {
          item.destroy()
          sidx = idx
        }
      })
      rtOutputAry.splice(sidx, 1)
    }
  }

  setOutputPinTitle(hostId: string, title: string) {
    const rtOutputAry = this.outputPins
    if (rtOutputAry) {
      rtOutputAry.find(pin => {
        if (pin.hostId == hostId) {
          pin.title = title;
        }
      })
    }
  }

  setOutputPinSchema(hostId: string, schema: any) {
    const rtOutputAry = this.outputPins
    if (rtOutputAry) {
      rtOutputAry.find(pin => {
        if (pin.hostId == hostId) {
          pin.schema = schema;
        }
      })
    }
  }
}