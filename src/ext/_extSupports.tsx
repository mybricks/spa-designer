import Frame from '../topl-view/frame/Frame'
import ConView from "../topl-view/con/ConView";
import Con from "../topl-view/con/Con";
import ToplCom from "../topl-view/com/ToplCom";
import {ConModel} from "../topl-view/con/ConModel";
import DiagramModel from "../topl-view/frame/DiagramModel";
import ToplComModelForked from "../topl-view/com/ToplComModelForked";

import {NS_Configurable} from "../configurable";
import {NS_Listenable} from '../listenable'

import {FrameModel} from "../topl-view";
import {ToplViewContext} from '../topl-view/frame/ToplView'

import {PinExtInputs} from "../topl-view/config";
import {PinModel} from "../topl-view/pin/PinModel";
import {JointModel} from "../topl-view/joint/JointModel";

import {ToplComModel} from '../topl-view/com/ToplComModel'

import {ComContext as ToplComContext} from "../topl-view/com/ToplCom";
import {ComSeedModel, DesignerContext, NS_Emits} from "@sdk";

export const _ExtSupports = {
  NS_Configurable,
  NS_Listenable,
  NS_Emits,
  DesignerContext,
  ToplViewContext,
  FrameModel,
  DiagramModel,
  Frame,
  ToplComContext,
  ToplComModel, ToplCom,
  ToplComModelForked,
  PinExtInputs,
  PinModel,
  JointModel,
  ConModel, ConView, Con,
  ComSeedModel
}

// export namespace _ExtSupports1 {
//   export {NS_Configurable} from "../configurable";
//   export {NS_Listenable} from '../listenable'
//
//   export {FrameModel} from "../topl-view";
//   export {ToplViewContext} from '../topl-view/frame/ToplView'
//   export const DiagramModel = DiagramModel
//   export const Frame = Frame
//
//   export {PinExtInputs} from "../topl-view/config";
//   export {PinModel} from "../topl-view/pin/PinModel";
//   export {JointModel} from "../topl-view/joint/JointModel";
//
//   export {ToplComModel} from '../topl-view/com/ToplComModel'
//
//   export const ConView = ConView
//   export const Con = Con
//   export {ConModel} from "../topl-view/con/ConModel";
//
//   export const ToplCom = ToplCom
//   export {ComContext as ToplComContext} from "../topl-view/com/ToplCom";
//   export const ToplComModelForked = ToplComModelForked
// }
