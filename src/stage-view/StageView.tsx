/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import css from './StageView.less'
import React, {useCallback, useEffect, useMemo} from 'react';

import {dump as dumpView, evt, load as loadView, observe, useComputed, useObservable} from '@mybricks/rxui'

import {ComSeedModel, DesignerContext, NS_Emits, T_Module} from '@sdk'
import {uuid} from '@utils';

import {GeoComModel, GeoView, GeoViewModel} from '../geo-view'
import {ToplComModel, ToplView, ToplViewModel} from '../topl-view'

//import {PinModel} from "./topl-view/pin/PinModel";
import StageViewModel from "./StageViewModel";

import ComlibView from "./comlib-view/ComlibView";

import {getConfigs} from './configrable'
import StageViewContext from "./StageViewContext";

const MAIN_MODULE_ID = '_main_'

const VIEW_NAV_NAMES = {
  'geo': '布局',
  'topl': '逻辑'
}

const PERSIST_NAME = 'xg.desn.stageview'

let blankContent

let myContext: StageViewContext

export function dump() {
  const datas = dumpView()
  for (let name in datas) {
    if (name === PERSIST_NAME) {
      return {[PERSIST_NAME]: datas[name]}
    }
  }
}

export default function StageView({content}: { content: {} }) {
  const desnContext = observe(DesignerContext, {from: 'parents'})
  const emitSnap = useObservable(NS_Emits.Snap, {expectTo: 'parents'})
  const emitItem = useObservable(NS_Emits.Component, {expectTo: 'parents'})
  const emitMessage = useObservable(NS_Emits.Message, {expectTo: 'parents'})
  const emitLogs = useObservable(NS_Emits.Logs, {expectTo: 'parents'})

  const model = useObservable(StageViewModel, {
    init(md) {
      if (md.mainModule === void 0) {
        md.designerVersion = DesignerContext.DESIGNER_VERSION

        const mainModule = {
          instId: MAIN_MODULE_ID,
          title: '主模块',
          slot: void 0,
          frame: void 0
        }

        const stageType = desnContext.configs.stage.type

        if (stageType === void 0 || stageType !== 'onlyLogic') {
          mainModule.slot = new GeoViewModel()
          mainModule.slot.state.enable()
        }

        mainModule.frame = new ToplViewModel()

        if (!mainModule.slot) {
          mainModule.frame.state.enable()
        } else {
          mainModule.frame.state.disable()
        }

        md.mainModule = mainModule
      }
      if (md.moduleNav.length === 0) {
        md.moduleNav = [md.mainModule]
      }

      //Proxy
      desnContext.envVars.debug = {
        get envType() {
          return md.envVars.envType
        },
        set envType(val) {
          md.envVars.envType = val
        },
        get userToken() {
          return md.envVars.userToken
        },
        set userToken(val) {
          md.envVars.userToken = val
        },
        get envParams() {
          return md.envVars.envParams
        },
        set envParams(val) {
          md.envVars.envParams = val
        }
      } as any

    }
  }, PERSIST_NAME)

  myContext = useObservable(StageViewContext, {
    init(ctx) {
      ctx.context = desnContext
      ctx.model = model
      ctx.emitSnap = emitSnap
      ctx.emitItem = emitItem
      ctx.emitMessage = emitMessage
      ctx.emitLogs = emitLogs

      const stageType = desnContext.configs.stage.type

      if (stageType === void 0 || stageType !== 'onlyLogic') {
        ctx.hasGeo = true
      }
      ctx.hasTopl = true
    }
  })

  useMemo(() => {
    if (!blankContent) {
      blankContent = dumpView(PERSIST_NAME)
    }
  }, [])

  useEffect(() => {
    myContext.loaded = false///Triger

    if (content) {
      loadView(content as any)
    } else {//blank
      loadBlank()
    }

    desnContext._designerVersion = model.designerVersion

    desnContext.focusDefault = {
      getConfigs() {
        return getConfigs(myContext)
      }
    } as any

    setTimeout(() => {
      myContext.loaded = true
    })
  }, [content])

  observe(NS_Emits.Debug, {from: 'children', expectTo: 'children'})
  observe(NS_Emits.IOEditor, {from: 'children', expectTo: 'children'})

  observe(NS_Emits.Views, next => next({
    pushInStage(view: Function) {
      myContext.routerViewAry.push(view)
      desnContext.setShowModelFullScreen()
      //desnContext.setDebugDisable()
    },
    popInStage() {
      myContext.routerViewAry.pop()
      desnContext.setShowModelNormal()
    },
    getCurRootFrame() {
      return model.getCurModule().frame
    }
  }), {from: 'parents'})

  //Upgrade for components
  observe(NS_Emits.Component, next => {
    next({
      upgrade
    })
  }, {from: 'children'})

  observe(NS_Emits.Module, next => next({
    load(module: T_Module) {
      loadModule(module)
    }
  }), {from: 'children'})

  const routeView = useComputed(() => {
    const rViewAry = myContext.routerViewAry
    if (rViewAry.length > 0) {
      const LastView = rViewAry[rViewAry.length - 1]
      return <LastView/>
    }
  })

  const views = useComputed(() => {
    const rtn = []
    const curModule = model.getCurModule()

    if (curModule) {
      if (curModule.slot.state.isEnabled() || !desnContext.configs.extPoints?.['toplView']) {
        rtn.push(
          <div key={'adder'} className={css.operators} style={{display: desnContext.isDebugMode() ? 'none' : ''}}>
            <div className={`${css.adderCom}`}
                 onClick={evt(myContext.showComLibsPanel).stop}>+
            </div>
          </div>
        )
      }
      if (curModule.slot) {
        rtn.push(<GeoView viewModel={curModule.slot} key={curModule.instId + 'slot'}/>)
      }
      if (curModule.frame) {
        rtn.push(<ToplView frameModel={curModule.frame} key={curModule.instId + 'frame'}/>)
      }
    }
    return rtn
  })

  const trigerPanelComLib = useCallback(triger => myContext.showComLibsPanel = triger, [])

  const viewsNav = useComputed(() => {
      if (myContext.loaded) {//Listener
        const jsx = []

        const curModule = model.getCurModule()
        if (curModule) {
          if (curModule.slot) {
            jsx.push(
              <button key='slot'
                      className={curModule.slot.state.isEnabled() ? css.activeBtn : ''}
                      onClick={() => {
                        curModule.frame?.state.disable()
                        curModule.slot.state.enable()
                      }}>
                {VIEW_NAV_NAMES.geo}
              </button>
            )
          }

          if (curModule.frame) {
            jsx.push(
              <button key='frame'
                      className={curModule.frame.state.isEnabled() ? css.activeBtn : ''}
                      onClick={() => {
                        curModule.slot?.state.disable()
                        curModule.frame.state.enable()
                      }}>
                {VIEW_NAV_NAMES.topl}
              </button>
            )
          }
        }

        return (
          <div className={`${css.floatBtns}`}>
            {jsx}
          </div>
        )
      }
    }
  )

  return (
    <div className={css.dblView} ref={el => el && (model.$el = el)} tabIndex={1}
         onClick={evt(click).stop}>
      {viewsNav}
      {
        myContext.loaded ? views : null
      }
      <ComlibView load={trigerPanelComLib} stageModel={model}/>
      {routeView}
    </div>
  )
}

function backToModule(module: T_Module) {
  const dblModel = myContext.model
  const curModule = dblModel.getCurModule()

  if (module !== curModule) {
    const mdAry = myContext.model.moduleNav
    const idx = mdAry.indexOf(module)

    for (let i = 0; i <= mdAry.length - idx; i++) {
      dblModel.popModule()
    }

    loadModule(module)
  }
}

function loadModule(module: T_Module) {
  const dblModel = myContext.model
  const idx = dblModel.moduleNav.indexOf(module)
  if (idx === -1) {
    if (!module.slot && !module.frame) {
      throw new Error(`Invalid module,must have geo or frame at least`)
    }
    const curModule = dblModel.getCurModule()

    let hasEnable
    if (!module.slot && myContext.hasGeo) {
      const getComModel = curModule.slot.searchCom(module.instId)
      module.slot = getComModel.slots[0]
    }
    if (!module.frame && myContext.hasTopl) {
      const toplComModel: ToplComModel = curModule.frame.searchCom(module.instId)
      module.frame = toplComModel.frames[0]
    }

    if (module.slot && module.slot.state.isEnabled()) {
      hasEnable = true
    }
    if (module.frame && module.frame.state.isEnabled()) {
      if (hasEnable) {
        module.frame.state.disable()
      } else {
        hasEnable = true
      }
    }
    if (!hasEnable) {
      if (module.slot) {
        module.slot.state.enable()
      } else if (module.frame) {
        module.frame.state.enable()
      }
    }
    dblModel.pushModule(module)
  }
}

function loadBlank() {
  const refs = blankContent[PERSIST_NAME].refs
  for (let key in refs) {
    if (key.match(new RegExp(`^(${GeoViewModel.name}|${ToplViewModel.name})_`))) {
      refs[key].id = uuid()//Replace id,so refresh component
    }
  }

  loadView(blankContent)
}

function click(event?) {
  myContext.emitItem.focus(void 0)
}

function upgrade(comModel: ComSeedModel) {
  const {model: dblModel, emitItem, emitMessage, emitLogs, context} = myContext
  const comDef = context.getComDef(comModel.runtime.def)
  if (!comDef) {
    throw new Error(`No definition found for component(${comModel.runtime.def.namespace})`)
  }

  let upgradeContinue: boolean = false

  let geoComModel: GeoComModel, toplComModel: ToplComModel

  const id = comModel.id
  const curModule = dblModel.getCurModule()

  if (curModule.frame) {
    toplComModel = curModule.frame.searchCom(id) as ToplComModel
  }
  if (curModule.slot) {
    geoComModel = curModule.slot.searchCom(id) as GeoComModel
  }

  if (typeof comDef.upgrade === 'function') {
    const params: { data, slot, input, output } = {}
    params.data = comModel.runtime.model.data

    if (curModule.frame) {
      params.input = toplComModel.getInputEditor(emitItem)
      params.output = toplComModel.getOutputEditor(emitItem)
    }
    if (curModule.slot) {
      params.slot = geoComModel.getSlotEditor(emitItem)
    }
    try {
      const rtn = comDef.upgrade(params)
      if (typeof rtn === 'boolean' && rtn) {
        upgradeContinue = true
      } else {
        upgradeContinue = false
      }
    } catch (ex) {
      emitMessage.error(`更新失败.\n${ex.message}`)
      return
    }
  } else {
    upgradeContinue = true
  }

  if (upgradeContinue) {
    comModel.runtime.def.version = comDef.version
    comModel.runtime.upgrade = void 0

    emitLogs.warn(`${comDef.title}(${comDef.namespace}) 已更新到 ${comDef.version} 版本.`)
  } else {
    emitLogs.error(`更新${comDef.title}(${comDef.namespace})失败.`)
  }
}