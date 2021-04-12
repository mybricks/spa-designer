/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import {NS_Configurable} from "@sdk";
import {ComContext} from "./GeoCom";
import {antiShaking} from "@utils";
import RenderItem = NS_Configurable.RenderItem;
import Group = NS_Configurable.Group;
import {EDITOR_ROOT_SELECTOR} from "../../constants";

//Record for current active editor array
let activeEditorAry = []

export function get(comContext: ComContext) {
  activeEditorAry = []

  const {model, comDef, context, emitModule, emitItem, emitSnap} = comContext
  const rtn = []
  const hostEle = model.$el.firstChild as HTMLElement

  const notFoundTitle = `${model.runtime.def.namespace} not found`

  const comCategary = new NS_Configurable.Category(comDef ? comDef.title : notFoundTitle)
  rtn.push(comCategary)

  let comGroup = new NS_Configurable.Group();
  comCategary.addGroup(comGroup)

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
  // }, hostEle))

  comGroup.addItem(createEdtItem(comContext, {
    title: `标题 (${comDef?.title}-${model.runtime.def.version})`,
    type: 'text',
    description: `您可以修改成更有意义的标题，新的标题也会同时出现在导航栏以及逻辑视图中`,
    value: {
      get() {
        return model.runtime.title || comDef.title
      }, set(context, val) {
        model.runtime.title = val
      }
    }
  }, hostEle))

  // comGroup.addItem(createEdtItem(comContext, {
  //   title: '版本',
  //   type: 'text',
  //   options: {
  //     readonly: true
  //   },
  //   value: {
  //     get() {
  //       return model.runtime.def.version
  //     }
  //   }
  // }, hostEle))

  if (comDef) {
    if (model.style.isLayoutAbsolute()) {
      comGroup.addItem(createEdtItem(comContext, {
        type: 'NumInputGroup',
        options: [
          {
            title: 'X'
          }, {
            title: 'Y'
          }
        ],
        value: {
          get() {
            return [model.style.left, model.style.top];
          }, set(context, val) {
            model.style.left = val[0];
            model.style.top = val[1];
          }
        }
      }, hostEle))
    }

    // let resizerEdt = getEdtResizer(comDef, {'*': true}), reEnable;
    // if (resizerEdt && resizerEdt['options']
    //   && (reEnable = resizerEdt['options']['enable'])) {
    //   comGroup.addItem(createEdtItem(comContext, {
    //     type: 'NumInputGroup',
    //     options: [
    //       {
    //         title: 'W',
    //         disabled: reEnable.find(nm => nm.toLowerCase() == 'width') ? false : true
    //       }, {
    //         title: 'H',
    //         disabled: reEnable.find(nm => nm.toLowerCase() == 'height') ? false : true
    //       }
    //     ],
    //     value: {
    //       get() {
    //         return [model.style.width, model.style.height];
    //       },
    //       set(context, val) {
    //         model.style.width = val[0];
    //         model.style.height = val[1];
    //         if (typeof (resizerEdt.onComplete) == 'function') {
    //           resizerEdt.onComplete(context, {width: val[0], height: val[1]})
    //         }
    //       }
    //     }
    //   }, hostEle))
    // }

    // comGroup.addItem(createEdtItem(comContext, {
    //   title: '标签',
    //   description: `灵活使用标记，之后可以快速找到组件`,
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
    // }, hostEle))

    comGroup.addItem(createEdtItem(comContext, {
      title: '显示',
      type: 'switch',
      description: `运行时是否显示该组件`,
      value: {
        get({style}) {
          return style.display !== 'none'
        },
        set({style}, value) {
          style.display = value ? 'block' : 'none'
        }
      }
    }, hostEle))

    // comGroup.addItem(createEdtItem(comContext, {
    //   title: '定位',
    //   type: 'Select',
    //   onLoad({style}) {
    //     return style.display === 'block'
    //   },
    //   options: [
    //     {value: 'auto', label: '默认'},
    //     {value: 'absolute', label: '浮动'},
    //     {value: 'fixed', label: '固定'}
    //   ],
    //   value: {
    //     get({style}) {
    //       return style.position
    //     },
    //     set({style}, value) {
    //       style.position = value
    //       setTimeout(h => emitItem.focus(model))
    //     }
    //   }
    // }, hostEle))

    comGroup.addItem(createEdtItem(comContext, {
      title: '外间距',
      type: 'inputNumber',
      options: [
        {
          title: '上',
          width: 50
        }, {
          title: '下',
          width: 50
        }, {
          title: '左',
          width: 50
        }, {
          title: '右',
          width: 50
        }
      ],
      value: {
        get() {
          return [
            model.style.marginTop,
            model.style.marginBottom,
            model.style.marginLeft,
            model.style.marginRight
          ]
        },
        set({style}, [top, bottom, left, right]) {
          model.style.marginTop = top
          model.style.marginBottom = bottom
          model.style.marginRight = right
          model.style.marginLeft = left
        }
      }
    }, hostEle))

    comGroup = new NS_Configurable.Group();
    comCategary.addGroup(comGroup)

    const edtAry = createEdtAry(comContext, hostEle, hostEle, {[EDITOR_ROOT_SELECTOR]: true, '*': true})
    if (edtAry) {
      const [ary, zoneTitle] = edtAry

      comGroup.addItems(ary)
      let fa = model.focusArea;

      if (fa && fa.isValid()) {//May be removed

        let {ele, selectors} = fa
        if (selectors) {

          const edtAry = createEdtAry(comContext, hostEle, ele, selectors);
          if (edtAry) {
            let [ary, zoneTitle] = edtAry
            if (ary) {
              let areaCategary = new NS_Configurable.Category(zoneTitle || '区域')
              rtn.splice(0, 0, areaCategary)
              let group = new NS_Configurable.Group();
              areaCategary.addGroup(group)
              group.addItems(ary)
            }
          }
        }
      }
    }
  } else {
    comGroup.addItem(new RenderItem(void 0, notFoundTitle))
  }

  //-------------------------------------------------------------------
  const sysGroup = new NS_Configurable.Group()
  sysGroup.fixedAt = 'bottom'

  comCategary.addGroup(sysGroup)

  sysGroup.addItem(createEdtItem(comContext, {
    title: '删除',
    type: 'button',
    value: {
      set(context, val) {
        emitItem.delete(model)
        emitItem.focus(void 0)
      }
    }
  }, hostEle))

  return rtn.map(catelog => {
    catelog.groups && (catelog.groups.forEach(group => {
      group.items && (group.items = group.items.filter(item => item))
    }))
    return catelog
  })
}

function createEdtItem(comContext: ComContext, editor: any, ele) {
  activeEditorAry.push(editor)

  const {model, context, emitSnap, emitCanvasView} = comContext
  const edtContext = getEditContext(comContext)
  if (typeof editor === 'function') {
    return new NS_Configurable.FunctionItem(function () {
      editor(edtContext)
    })
  } else if (typeof editor === 'object') {
    let options = editor.options
    if (typeof options === 'function') {
      options = editor.options(edtContext)
    }

    let ifVisible
    if (typeof editor.ifVisible === 'function') {
      ifVisible = () => {
        const activeF = activeEditorAry.indexOf(editor) >= 0//To avoid triger observable in disactive editor
        if (activeF) {
          if (!model.focusArea || model.focusArea.isValid()) {
            const rtn = editor.ifVisible(edtContext)
            return typeof (rtn) === 'boolean' ? rtn : false
          }
        }
      }
    }

    const describer = {
      title: editor.title,
      type: editor.type,
      selector: editor.selector,
      description: editor.description,
      value: (function () {
        let initVal, waittingForSet = false;//Prevent for invoke value.get many times before set invoked

        return {
          get() {
            if (!model.focusArea || model.focusArea.isValid()) {
              initVal = (editor.value && editor.value.get || (() => undefined))(edtContext)
              initVal = initVal == void 0 ? null : initVal
              return initVal
            }
          }, set(v, opt?: { ele, state: 'ing' | 'finish' }) {
            if (context.isDebugMode()) {
              return
            }
            antiShaking().push(() => {
              waittingForSet = false;
              if (initVal !== v) {
                initVal = initVal == void 0 ? null : initVal
                const snap = emitSnap.start('Change value')
                const fn = (editor.value && editor.value.set || (() => undefined))

                if (editor.selector && opt?.ele) {
                  edtContext.focusArea = {//Append focusArea
                    ele: opt.ele,
                    dataset: opt.ele.dataset
                  } as any
                }

                fn(edtContext, v)

                if (model.focusArea) {
                  model.focusArea.notifyEleChanged()
                  setTimeout(v => {
                    if (!model.focusArea.isValid()) {
                      model.focusArea = void 0//Clear it
                    }
                  })
                } else {
                  model.notifyEleChanged()
                }

                if (!opt || !opt.state || opt.state === 'finish') {
                  model.notifyEleChanged()
                  snap.commit()
                } else {
                  snap.wait()
                }
              }
            })
          }
        }
      })(),
      options,
      ifVisible,
      ele,
      containerEle: comContext.model.root.$el
    }

    const titleFn = editor.title
    if (typeof titleFn === 'function') {
      Object.defineProperty(describer, 'title', {
        get() {
          return titleFn(edtContext)
        }
      })
    }

    return new NS_Configurable.EditItem(describer)
  } else {
    throw new Error(`Invalid typeof editor(function or object expect)`)
  }
}

export function getEditContext({context, model, emitItem, emitSnap, emitIOEditor}: ComContext) {
  let focusArea
  const fa = model.focusArea
  if (fa) {
    const ele = fa.ele
    let pnode = ele.parentNode, selAll;
    if (pnode !== null) {
      focusArea = {
        ele,
        get index() {
          let selectors = Object.keys(fa.selectors).join('')
          try {
            selAll = pnode.querySelectorAll(selectors);
          } catch (ex) {
            selAll = pnode.querySelectorAll(':scope' + selectors);
          }
          return [].indexOf.call(selAll, ele);
        },
        dataset: ele.dataset
      }
    } else {
      // return {
      //   ele: model.focusArea.ele
      // }
    }
  }

  return {
    style: {
      get width() {
        return model.style.width;
      },
      set width(w) {
        if (typeof (w) == 'number') {
          model.style.width = w;
        }
      },
      get height() {
        return model.style.height;
      },
      set height(h) {
        if (typeof (h) == 'number') {
          model.style.height = h;
        }
      },
      get position() {
        return model.style.layout
      },
      set position(po) {
        model.style.layout = po
      },
      get display() {
        return model.style.display
      },
      set display(d) {
        model.style.display = d
      }
    },
    //-----Compatible for previous vc component--------------------------------------------------------------------------
    get data() {
      return model.data
    },
    // get sourceDom() {
    //   return this.focusArea ? this.focusArea.ref : this.containerDom;
    // },
    // get containerDom() {
    //   return model.$el as HTMLElement
    // },
    //-------------------------------------------------------------------------------
    focusArea,
    get slot() {
      return model.getSlotEditor(emitItem)
    },
    get input() {
      return emitIOEditor.getInput(model.id)
    },
    get output() {
      return emitIOEditor.getOutput(model.id)
    },
    get diagram() {
      return {
        edit(outputHostId: string) {
          emitItem.editDiagram(model.id, outputHostId)
        }
      }
    }
    // setLabel(label:string){
    //   // if(typeof isTrue==='boolean'){
    //   //   model.runtime.mockF = isTrue
    //   // }
    // },
    // isModeOfDebug() {
    //   return context.isDebugMode();
    // },
    // openEditor(opts) {
    //   th.emitOpen.editor(opts)
    // }
  }
}

// function getEdtResizer(comDef: T_XGraphComDef, selectors) {
//   let edtAry;
//   if (comDef.editors && comDef.editors.on) {
//     let viewOn = comDef.editors.on.view || comDef.editors.on;
//     let rst;
//     Object.keys(selectors).find(selector => {
//       return viewOn && (edtAry = viewOn[selector]) &&
//         (rst = edtAry.find(edt => edt.type && edt.type.toUpperCase() == EditorsAPI.Reserved.resizer.type))
//     })
//     return rst
//   }
// }

function createEdtAry(comContext: ComContext, hostEle: HTMLElement, ele, selectors)
  : [Array<NS_Configurable.EditItem>, string] {
  const {comDef, model} = comContext
  let edtAry;
  if (comDef.editors) {
    let viewOn = comDef.editors.view || comDef.editors;
    let ary = [], title;
    Object.keys(selectors).forEach(selector => {
      if (viewOn && (edtAry = viewOn[selector])) {
        if (!Array.isArray(edtAry) && typeof edtAry === 'object') {
          if (!Array.isArray(edtAry.items)) {
            throw new Error(`Invalid value type for selector(${selector}) in component(${comDef.namespace}),expect {items:[],title:string}.`)
          }
          title = edtAry.title
          edtAry = edtAry.items
        }
        edtAry.forEach(edt => {
          if (typeof edt === 'function' || edt.type) {
            ary.push(createEdtItem(comContext, edt, ele))
          } else if (typeof (edt) === 'object' && Array.isArray(edt.items)) {//group
            const group = new Group(edt.title, edt.description)
            ary.push(group)

            edt.items.forEach(edt2 => {
              if (typeof edt2 === 'function' || edt2.type) {
                group.addItem(createEdtItem(comContext, edt2, ele))
              }
            })
          }
        })
      }
    })
    return [ary, title]
  }
}
