/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import {PinModel} from '../pin/PinModel';
import {ToplComModel} from '../com/ToplComModel';
import {ConModel} from '../con/ConModel';
import {Arrays, getPosition, randomNum} from '@utils'

import ToplBaseModel from '../ToplBaseModel';

import {E_ItemType} from '@mybricks/compiler-js'
import {BaseModel, ComSeedModel, I_FrameModel, I_PinModel, T_PinSchema} from '@sdk';
import {clone, ignore, Ignore, Serializable} from '@mybricks/rxui';
import {SerializeNS} from '../constants';
import {createConModel} from "../ToplUtil";
import {JointModel} from "../joint/JointModel";
import DiagramModel from "./DiagramModel";

@Serializable(SerializeNS + 'topl.FrameModel')
export default class FrameModel extends ToplBaseModel implements I_FrameModel {
  _type: E_ItemType.FRAME = E_ItemType.FRAME

  id: string

  title: string

  type: 'scope' | undefined

  @Ignore
  schema

  style = {
    left: null as number,
    top: null as number,
    // width: 1000,
    // height: 800
  }

  _rootF: boolean

  editable: boolean = true

  parent: ToplComModel

  isFrame: boolean = true;

  diagramAry: DiagramModel[] = []

  focusedDiagram: DiagramModel

  inputPins: Array<PinModel> = []

  outputPins: Array<PinModel> = []

  inputJoints: Array<JointModel> = []

  outputJoints: Array<JointModel> = []

  comAry: ToplComModel[] = []

  conAry: ConModel[] = []

  @Ignore
  conTemp: ConModel

  @Ignore
  comsAddedInDebug: [ToplComModel] = []

  @Ignore
  private _connections: {
    changed: boolean
    changing: boolean
  } = {changed: true, changing: void 0}

  get connections(): {
    isChanging: () => boolean,
    isChanged: () => boolean,
    changing: () => void,
    changed: () => void,
    refactored: () => void
  } {
    const th = this
    return {
      isChanging() {
        return th._connections.changing
      },
      isChanged() {
        return th._connections.changed
      },
      changing() {
        th._connections.changing = true
      },
      changed() {
        th._connections.changed = true
      },
      refactored() {
        th._connections.changing = void 0
        th._connections.changed = void 0
      }
    }
  }

  focusModelAry: Array<BaseModel | { focus, blur }> = []

  @Ignore
  hintPinModelAry: PinModel[]

  zIndexCur: {
    con: number,
    com: number
  } = {con: 0, com: 100};

  constructor(id?: string, title?: string, rootF?: boolean, type?: 'scope' | undefined) {
    super();
    id && (this.id = id);
    title && (this.title = title);
    if (typeof rootF === 'boolean') {
      this._rootF = rootF
    }
    this.type = type
  }

  addDebugTempCom(com: ToplComModel) {
    ignore(com)
    this.comsAddedInDebug.push(com)
  }

  clearAllTempComs() {
    this.comsAddedInDebug.forEach(com => {
      this.delete(com)
    })
  }

  isDebugMode() {
    return this.parent.isDebugMode()
  }

  addDiagram(startFrom?: ToplComModel) {
    const diagram = new DiagramModel(this, startFrom)
    this.diagramAry.push(diagram)
    return this.diagramAry[this.diagramAry.length - 1]
  }

  addIODiagram() {
    const diagram = new DiagramModel(this)
    diagram.showIO = true

    this.diagramAry.push(diagram)
    return this.diagramAry[this.diagramAry.length - 1]
  }

  searchDiagramByStartCom(startCom: ToplComModel): DiagramModel {
    if (this.diagramAry) {
      return this.diagramAry.find((diagram, idx) => {
        if (diagram.startFrom) {
          if (diagram.startFrom.forkedFrom === startCom) {
            return true
          }
        }
      }) as DiagramModel
    }
  }

  addInputPin(hostId: string, title: string, schema: T_PinSchema, conMax?: number, deletable?: boolean): PinModel {
    const exist = this.inputPins.some(pin => {
      return pin.hostId === hostId
    })
    if (exist) {
      return
    }

    const pin = new PinModel(
      'normal',
      'inner-output',
      hostId,
      title, schema, conMax, deletable
    )

    pin.parent = this
    this.inputPins.push(pin)

    if (this._rootF && this.parent) {//SubModule
      const subModuleModel = this.parent as ToplComModel
      subModuleModel.addInputPin(hostId, title, schema)
    }

    return pin
  }

  addOutputPin(hostId: string, title: string, schema: T_PinSchema, conMax?: number, deletable?: boolean): PinModel {
    const exist = this.outputPins.some(pin => {
      return pin.hostId === hostId
    })
    if (exist) {
      return
    }
    const pin = new PinModel(
      'normal',
      'inner-input',
      hostId,
      title,
      schema,
      conMax,
      deletable
    )
    pin.parent = this
    this.outputPins.push(pin)

    if (this._rootF && this.parent) {//SubModule
      const subModuleModel = this.parent as ToplComModel
      subModuleModel.addOutputPin(hostId, title, schema)
    }

    return pin
  }

  removeInputPin(hostId: string) {
    let sidx
    this.inputPins.find((item, idx) => {
      if (item.hostId === hostId) {
        item.destroy()
        sidx = idx
      }
    })
    this.inputPins.splice(sidx, 1)

    if (this._rootF && this.parent) {//SubModule
      const subModuleModel = this.parent as ToplComModel
      subModuleModel.removeInputPin(hostId)
    }
  }

  renameInputPin(hostId: string, title: string) {
    this.inputPins.find(pin => {
      if (pin.hostId === hostId) {
        pin.title = title;
      }
    })

    if (this._rootF && this.parent) {//SubModule
      const subModuleModel = this.parent as ToplComModel
      subModuleModel.setInputPinTitle(hostId, title)
    }
  }

  setInputPinSchema(hostId: string, schema: T_PinSchema) {
    this.inputPins.find(pin => {
      if (pin.hostId === hostId) {
        pin.schema = schema;
      }
    })

    if (this._rootF && this.parent) {//SubModule
      const subModuleModel = this.parent as ToplComModel
      subModuleModel.setInputPinSchema(hostId, schema)
    }
  }

  removeOutputPin(hostId: string) {
    let sidx
    this.outputPins.find((item, idx) => {
      if (item.hostId === hostId) {
        item.destroy()
        sidx = idx
      }
    })
    this.outputPins.splice(sidx, 1)

    if (this._rootF && this.parent) {//SubModule
      const subModuleModel = this.parent as ToplComModel
      subModuleModel.removeOutputPin(hostId)
    }
  }

  renameOutputPin(hostId: string, title: string) {
    this.outputPins.find(pin => {
      if (pin.hostId === hostId) {
        pin.title = title;
      }
    })

    if (this._rootF && this.parent) {//SubModule
      const subModuleModel = this.parent as ToplComModel
      subModuleModel.setOutputPinTitle(hostId, title)
    }
  }

  setOutputPinSchema(hostId: string, schema: T_PinSchema) {
    this.outputPins.find(pin => {
      if (pin.hostId === hostId) {
        pin.schema = schema;
      }
    })

    if (this._rootF && this.parent) {//SubModule
      const subModuleModel = this.parent as ToplComModel
      subModuleModel.setOutputPinSchema(hostId, schema)
    }
  }

  addComponent(model: ToplComModel): ToplComModel {
    if (!this.comAry.find(com => com.id === model.id)) {
      model.parent = this;
      this.comAry.push(model)
      //this.focusItem(model)

      return this.comAry[this.comAry.length - 1]//Return observable
    }
    return model
  }

  addInputJoint(): JointModel {
    let joint = new JointModel('input', 30 + (this.parent.inputPins.length + this.inputJoints.length) * 18, this.inputJoints.length);
    this.inputJoints.push(joint)
    joint.parent = this;

    return joint
  }

  addOutputJoint(): JointModel {
    let joint = new JointModel('output', 30 + (this.parent.outputPins.length + this.outputJoints.length) * 18, this.inputJoints.length);
    this.outputJoints.push(joint)
    joint.parent = this;

    return joint
  }

  addConnection(from: ConModel, temp?: boolean): ConModel
  addConnection(from: PinModel, to: PinModel, temp?: boolean): ConModel
  addConnection(...args): ConModel {
    let con: ConModel
    if (args[0] instanceof ConModel) {
      con = args[0]
    } else if (args.length >= 2 && args[0] instanceof PinModel && args[0] instanceof PinModel) {
      con = createConModel(args[0], args[1], this.$el)
    }

    con.parent = this

    const isTemp = args.find(arg => typeof arg === 'boolean' && arg)

    if (isTemp) {
      this.conTemp = con
      return this.conTemp
    } else {
      this.conAry.push(con)
      return this.conAry[this.conAry.length - 1]//Return observable
    }
  }

  copyIn<T extends BaseModel>(model: ComSeedModel, randomPo: boolean): T {
    let nmodel = new ToplComModel(model)

    let calPo;
    if (this.state.isHovering()) {
      this.state.hoverRecover()
      calPo = true;
    }

    if (calPo) {
      let tmp = getPosition(model.$el), curPo = getPosition(this.$el)
      nmodel.style.left = tmp.x - curPo.x
      nmodel.style.top = tmp.y - curPo.y
    } else if (randomPo) {
      let [v0, v1] = randomNum(20, 80)
      nmodel.style.left = v0
      nmodel.style.top = v1
    } else {
      nmodel.style.left = typeof nmodel.style.left != 'undefined' ? nmodel.style.left : 20
      nmodel.style.top = typeof nmodel.style.top != 'undefined' ? nmodel.style.top : 20
    }

    this.comAry.push(nmodel)
    nmodel.parent = this;

    this.focusItem(nmodel)
    return nmodel as T;
  }

  cutIn<T extends BaseModel>(model: BaseModel, randomPo: boolean): T {
    let calPo;
    if (this.state.isHovering()) {
      this.state.hoverRecover()
      calPo = true;
    }

    if (model && model instanceof ToplComModel) {
      const comModel = model as ToplComModel<any>
      if (comModel.parent !== this) {
        if (calPo) {
          let tmp = getPosition(comModel.$el), curPo = getPosition(this.$el)
          comModel.style.left = tmp.x - curPo.x
          comModel.style.top = tmp.y - curPo.y
        } else if (randomPo) {
          let [v0, v1] = randomNum(20, 50)
          comModel.style.left = v0
          comModel.style.top = v1
        } else {
          comModel.style.left = typeof comModel.style.left != 'undefined' ? comModel.style.left : 20
          comModel.style.top = typeof comModel.style.top != 'undefined' ? comModel.style.top : 20
        }

        comModel.parent.release(comModel)

        this.comAry.push(comModel)
        comModel.parent = this;

        this.focusItem(comModel)
      }
      return model as T;
    }
  }

  searchCom(id: string): ToplComModel {
    let rtn: ToplComModel
    if (this.comAry) {
      this.comAry.find(item => {
        if (item.id == id) {
          rtn = item;
          return true;
        } else {
          if (item.frames) {
            return item.frames.find(frame => {
              rtn = frame.searchCom(id);
              if (rtn) {
                return true;
              }
            })
          }
        }
      })
    }
    return rtn;
  }

  searchFrame(id: string): FrameModel {
    if (this.id === id) {
      return this
    }
    let rtn: FrameModel
    if (this.comAry) {
      this.comAry.find(item => {
        if (item.frames) {
          return item.frames.find(frame => {
            rtn = frame.searchFrame(id);
            if (rtn) {
              return true;
            }
          })
        }
      })
    }
    return rtn;
  }

  findItemByPo({x, y, w, h}: { x: number, y: number, w?: number, h?: number }, except: ToplComModel): FrameModel {
    w = w || 5
    h = h || 5

    let found: FrameModel;
    this.comAry.find(
      item => {
        if (item.id !== except.id && item.frames) {
          item.frames.forEach(fra => {
            if (fra.$el) {
              let po = getPosition(fra.$el), w1 = (<HTMLElement>fra.$el).offsetWidth,
                h1 = (<HTMLElement>fra.$el).offsetHeight;

              if (Math.max(x + w, po.x + w1) - Math.min(x, po.x) < w + w1
                &&
                Math.max(y + h, po.y + h1) - Math.min(y, po.y) < h + h1) {//have intersection
                if (!(found = fra.findItemByPo({x, y, w, h}, except))) {
                  found = fra;
                }
                return true;
              }
            }
          })
        }
      }
    )
    if (found) {
      return found;
    }
  }

  active() {

  }

  inactive() {

  }

  private cleanHintedPinAry() {
    if (this.hintPinModelAry) {
      this.hintPinModelAry.forEach(pin => {
        pin.hint = void 0
      })
    }
  }

  focusItem<T extends (ToplBaseModel | ToplComModel | { focus; blur })>(model: T[] | T): boolean {
    this.cleanHintedPinAry()

    if (typeof model === 'object') {
      if (Array.isArray(model)) {
        this.blur()
        model.forEach(md => md.focus())
        this.focusModelAry = this.focusModelAry.concat(model)
      } else if (model instanceof ToplBaseModel
        || model instanceof ToplComModel
        || (typeof (model.focus) === 'function' && !(model instanceof BaseModel))) {
        this.blur()
        model.focus()
        this.focusModelAry.push(model)
      }
    }
    return
  }

  blur(model?: BaseModel) {
    if (this.focusModelAry) {
      if (model) {
        const idx = this.focusModelAry.indexOf(model)
        if (idx >= 0) {
          this.focusModelAry.splice(idx, 1)
        }
      } else {
        this.focusModelAry.forEach((sth: ToplBaseModel) => {
          if (typeof sth.blur === 'function') {
            sth.blur()
          }
        })
        this.focusModelAry = []
      }
    }

    this.cleanHintedPinAry()

    // Arrays.each(sth => {
    //     if (!exceptType || !(sth instanceof exceptType)) {
    //       sth.blur()
    //     }
    //   }, this.itemAry,
    //   this.inputPins,
    //   this.outputPins,
    //   this.inputJoints,
    //   this.outputJoints)
  }

  editDiagram(comId: string, outputHostId?: string) {
    const com: ToplComModel = this.searchCom(comId)
    if (!com) {
      throw new Error(`未找到组件(id=${comId}).`)
    }
    const diagram = this.diagramAry.find(diagram => {
      const sf = diagram.startFrom
      if (sf.id === comId) {
        return true
      }
    })
    if (diagram) {
      this.focusedDiagram = diagram
    } else {
      this.addDiagram(com)
    }
  }

  findPinAryBySchema(one: PinModel): PinModel[] {
    const findOutput = one.isDirectionOfInput()
    const rtn = []
    this.comAry.find(model => {
      if (findOutput) {
        Arrays.each<PinModel>(pin => {
          if (!one.hadConToPin(pin) && canConnectTo(one, pin) === true) {
            rtn.push(pin)
          }
        }, ...model.getOutputsAll())
      } else {
        Arrays.each<PinModel>(pin => {
          if (!one.hadConToPin(pin) && canConnectTo(one, pin) === true) {
            rtn.push(pin)
          }
        }, ...model.getInputsAll())
      }
    })

    this.cleanHintedPinAry()
    this.hintPinModelAry = rtn
    return rtn
  }

  searchPin(id: string): PinModel {
    let rtnPin = this.inputPins.find(pin => pin.id === id)
    rtnPin || (rtnPin = this.outputPins.find(pin => pin.id === id))
    if (!rtnPin) {
      this.comAry.find(model => {
        rtnPin = Arrays.find(pin => pin.id === id, ...model.getInputsAll())

        if (rtnPin) {
          return true
        }

        rtnPin = Arrays.find(pin => pin.id === id, ...model.getOutputsAll())

        if (rtnPin) {
          return true
        }
        // if (model.frames) {//Recursion search
        //   return model.frames.find(frame => {
        //     rtnPin = frame.findHoverPin()
        //     if (rtnPin) {
        //       return true;
        //     }
        //   })
        // }
      })
    }
    return rtnPin as PinModel;
  }

  delete(model: ToplComModel | ConModel | PinModel | DiagramModel): boolean {
    const delInAry = (ary, delCom?) => {
      let fidx
      ary.find((tm, idx) => {
        if (tm.id === model.id) {
          fidx = idx;
          return true
        }
      })
      if (fidx >= 0) {
        ary.splice(fidx, 1)
        return true
      } else if (delCom) {
        return ary.find((com: ToplComModel) => {
          if (com.frames) {
            com.frames.find(frame => {
              if (frame.comAry) {
                return delInAry(frame.comAry, true)
              }
            })
          }
        })
      }
    }

    if (model instanceof ToplComModel) {
      delInAry(this.comAry, true)
    } else if (model instanceof ConModel) {
      if (this.conTemp && this.conTemp.id === model.id) {
        this.conTemp = void 0
      } else {
        delInAry(this.conAry)
      }
    } else if (model instanceof PinModel) {
      if (!delInAry(this.inputPins)) {
        delInAry(this.outputPins)
      }
    } else if (model instanceof DiagramModel) {
      model.destroy()
      delInAry(this.diagramAry)
    }
    return
  }

  release(model: BaseModel) {
    if (model instanceof ToplComModel) {
      let ary = [];
      this.comAry.forEach(md => {
        if (md.id != model.id) {
          ary.push(md)
        }
      })
      this.comAry = ary
    }
  }

  refreshInnerCons(temp?: boolean, whichSide?: 'input' | 'output') {
    let ppo = getPosition(this.$el)
    let refreshOut = pin => {
      let pinDom = pin.$el

      let pinPo = getPosition(pinDom)
      let finishPo = {
        temp,
        x: pinPo.x - ppo.x,
        y: pinPo.y + pinDom.offsetHeight / 2 - ppo.y,
        j: pin.getJoinerWidth()
      }

      pin.conAry.forEach(con => {
        con.finishPo = finishPo
      })
    }, refreshIn = pin => {
      let pinDom = pin.$el

      let pinPo = getPosition(pinDom)
      let startPo = {
        temp,
        x: pinPo.x + pinDom.offsetWidth - ppo.x,
        y: pinPo.y + pinDom.offsetHeight / 2 - ppo.y,
        j: pin.getJoinerWidth()
      }

      pin.conAry.forEach(con => {
        con.startPo = startPo
      })
    }

    (!whichSide || whichSide == 'input') && this.inputPins.forEach(refreshIn);
    (!whichSide || whichSide == 'output') && this.outputPins.forEach(refreshOut)
  }

  refreshJoints(forAll?) {
    this.outputJoints.forEach(joint => {
      let comModel = this.parent,
        frameModel = comModel.parent,
        jtEle = joint.$el as HTMLElement,
        jtPoOuter = getPosition(jtEle, frameModel.$el),
        jtPoInner = getPosition(jtEle, joint.parent.$el)

      if (forAll && joint.from) {
        joint.from.finishPo = {
          x: jtPoInner.x,
          y: jtPoInner.y + jtEle.offsetHeight / 2,
          j: joint.getJoinerWidth()
        }
      }

      if (joint.to) {
        joint.to.startPo = {
          x: jtPoOuter.x + jtEle.offsetWidth,
          y: jtPoOuter.y + jtEle.offsetHeight / 2,
          j: joint.getJoinerWidth()
        }
      }
    })

    this.inputJoints.forEach(joint => {
      let comModel = this.parent,
        frameModel = comModel.parent,
        jtEle = joint.$el as HTMLElement,
        jtPoOuter = getPosition(jtEle, frameModel.$el),
        jtPoInner = getPosition(jtEle, joint.parent.$el)

      if (forAll && joint.to) {
        joint.to.startPo = {
          x: jtPoInner.x + jtEle.offsetWidth - 4,
          y: jtPoInner.y + jtEle.offsetHeight / 2,
          j: joint.getJoinerWidth()
        }
      }

      if (joint.from) {
        joint.from.finishPo = {
          x: jtPoOuter.x,
          y: jtPoOuter.y + jtEle.offsetHeight / 2,
          j: joint.getJoinerWidth()
        }
      }
    })
  }

  applyZIndex(model: ToplComModel | ConModel) {
    if (model instanceof ToplComModel) {
      this.zIndexCur.com++
      return this.zIndexCur.com
    }
    if (model instanceof ConModel) {
      this.zIndexCur.con++
      return this.zIndexCur.con
    }
  }

  toJSON() {
    const rtn: {
      id,
      type,
      title,
      name,
      style,
      _rootF,
      comAry,
      inputPins,
      outputPins,
      conAry,
      diagramAry
    } = {}

    rtn.id = this.id
    rtn.type = this.type
    rtn.title = this.title
    rtn.name = this.name
    rtn._rootF = this._rootF

    rtn.style = clone(this.style)

    if (this.comAry) {
      const comAry = []
      this.comAry.forEach(com => {
        //if (com.runtime.def.namespace !== NS_XGraphComLib.coms.module) {//Ignore module
        comAry.push(com.runtime.toJSON('topl'))
        //}
      })
      rtn.comAry = comAry
    }

    if (this.inputPins) {
      const inPins = []
      this.inputPins.forEach(pin => {
        inPins.push(pin.toJSON())
      })
      rtn.inputPins = inPins
    }

    if (this.outputPins) {
      const outPins = []
      this.outputPins.forEach(pin => {
        outPins.push(pin.toJSON())
      })
      rtn.outputPins = outPins
    }

    if (this.conAry) {
      const cons = []
      this.conAry.forEach(con => {
        cons.push(con.toJSON())
      })
      rtn.conAry = cons
    }

    if (this.diagramAry.length > 0) {
      const diagramAry = []
      this.diagramAry.forEach(diagram => {
        diagramAry.push(diagram.toJSON())
      })
      rtn.diagramAry = diagramAry
    }

    return rtn
  }

  destroy() {
    this.inputPins.forEach(pin => {
      pin.conAry.forEach(con => con.destroy())
    })

    this.outputPins.forEach(pin => {
      pin.conAry.forEach(con => con.destroy())
    })
  }

  clearDebugs() {
    Arrays.each<PinModel>(pin => {
      pin.clearDebugHints()
    }, this.inputPins, this.outputPins)

    this.comAry.forEach(item => {
      item.clearDebug()
    })
  }

  clearDebugHints() {
    Arrays.each<PinModel>(pin => {
      pin.clearDebugHints()
    }, this.inputPins, this.outputPins)

    this.comAry.forEach(item => {
      item.clearDebugHints()
    })
  }

}
