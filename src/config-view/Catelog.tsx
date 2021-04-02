/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * MyBricks team @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import React from 'react'

import {Tooltip} from 'antd'
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined'

import css from './Catelog.less'

import {observe} from '@mybricks/rxui'
import EditContext from "./EditContext";
import {NS_Configurable} from "@sdk";

import defaultEditos from './editors'

const foldableStyle = {
  height: 18,
  overflow: 'hidden'
}

export default function EditCatelog({catelog}: { catelog: NS_Configurable.Category }) {
  const myContext = observe(EditContext, {from: 'parents'})
  const fixedGroups = []
  return (
    <div key={catelog.id}
         className={css.catelog}
         style={{display: myContext.isActiveCatelog(catelog.id) ? 'flex' : 'none'}}>
      <div className={css.scroll}>
        {
          catelog.groups && catelog.groups.map((group, idx) => {
            if (group.fixedAtBottom && group.fixedAtBottom()) {
              fixedGroups.push(group)
            } else {
              return RenderGroup(group)
            }
          })
        }
      </div>
      {
        fixedGroups.length > 0 ? (
          <div className={css.fixed}>
            {fixedGroups.map((group, idx) => RenderGroup(group))}
          </div>
        ) : null
      }
    </div>
  )
}

function RenderGroup(group: NS_Configurable.Group, isChild: boolean = false) {
  return (
    <div key={group.id} className={`${css.group}
                     ${isChild ? css.child : ''}
                     ${typeof group.fixedAtBottom === 'function' && group.fixedAtBottom() ? css.fixedAtBottom : ''}`}>
      <div className={isChild||group.title ? css.title : ''}>
        <div className={css.titlename}>
          {group.title}
          {(group.description && group.title) && Tip(group.description)}
        </div>
        {isChild && group.items && group.items.length ?
          <div className={css.action}
               onClick={(e) => clickSwitch(e, 38)}>收起</div> : <></>}
      </div>
      <div className={css.groupContent}>
        {
          group.items && group.items.map((item, idx) => {
              if (!item) return
              if (item instanceof NS_Configurable.Group) {
                return RenderGroup(item, isChild = true)
              } else {
                return <EditItem key={`item_${idx}`} item={item}/>
              }
            }
          )
        }
      </div>
    </div>
  )
}

function EditItem({item}: { item: { id, type: string, title, options,ele,containerEle, fn } }) {
  const myContext = observe(EditContext, {from: 'parents'})

  if (item instanceof NS_Configurable.RenderItem) {
    return (
      <div className={css.item}>
        {typeof item.content === 'function' ? (
          <item.content/>
        ) : item.content}
      </div>
    )
  } else if (item instanceof NS_Configurable.FunctionItem) {//IEEF
    setTimeout(item.fn)
  } else {
    const {
      description,
      title,
      type,
      value,
      options,
      ifVisible,
      ele
    } = item
    // const editMap = {
    //   'TEXT': 'EditorText',
    //   'SELECT': 'EditorSelect',
    //   'RANGE': 'EditorRange',
    //   'COLOR': 'EditorColor',
    //   'BUTTON': 'EditorButton',
    //   'CHECKBOX': 'EditorCheckbox'
    // }
    let Editor, showTitle = true

    if (type.toUpperCase() === 'BUTTON') {
      showTitle = false
    }

    // 若type相同，外部传入的编辑器覆盖设计器内置的编辑器。
    if (typeof myContext.context.configs.editorLoader === 'function') {
      Editor = myContext.context.configs.editorLoader({
        type, title, value, options
      })
    }

    if (!Editor) {
      const defaultEditorDesc = defaultEditos(item)

      if (defaultEditorDesc) {
        showTitle = defaultEditorDesc.showTitle
        Editor = defaultEditorDesc.render()
      }
    }

    // const defaultEditorDesc = defaultEditos(item)

    // if (defaultEditorDesc) {
    //   showTitle = defaultEditorDesc.showTitle
    //   Editor = defaultEditorDesc.render()
    // }

    // if (!Editor && typeof myContext.context.configs.editorLoader === 'function') {
    //   Editor = myContext.context.configs.editorLoader({
    //     type, title, value, options
    //   })
    // }

    if (Editor && (!ifVisible || ifVisible())) {
      let foldable: boolean = false
      if (options && options.foldable) {
        foldable = true
      }
      return (
        <div className={css.item} style={foldable ? foldableStyle : {}}>
          {showTitle ?
            <div className={foldable ? css.foldable : ''}>
              <p className={css.foldabletitle}>
                {item.title}
                {(title && showTitle && description) && Tip(description)}
              </p>
              {foldable && <div className={css.foldableaction} onClick={(e) => clickSwitch(e, 18)}>展开</div>}
            </div> : null}
          {Editor}
        </div>
      )
    }
  }
}

function Tip(description: string) {
  return (
    <Tooltip title={
      <span className={css.descriptionTitle}>{description}</span>
    } className={css.description}>
      <QuestionCircleOutlined/>
    </Tooltip>
  )
}

// TODO
function clickSwitch(e: any, height: any = false): void {
  let groupContainer = e.target.parentElement.parentElement
  if (e.target.innerText === '展开') {
    e.target.innerText = '收起'
    // groupContainer.style.height = `${groupContainer.scrollHeight}px`
    groupContainer.style.height = '100%'
    groupContainer.style.overflow = 'initial'
  } else {
    e.target.innerText = '展开'
    groupContainer.style.height = `${height}px`
    groupContainer.style.overflow = 'hidden'
  }
}