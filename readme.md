# @myBricks/spa-designer使用说明

> 点击 [在线体验](https://mybricks.world)  
> [Github] [@mybricks/spa-desinger](https://github.com/mybricks/spa-designer)

## 特性

- 源自实际业务的无代码解决方案，开源、免费
- 随手调试、所见即所得
- 图形化编程语言及扩展支持
- 强大且开放的自定义组件能力

## 安装及体验

```bash
git clone git@github.com:mybricks/spa-designer.git
cd ./designer
npm install
npm run dev
```

## 使用\<Designer\/\>组件

```bash
npm install @mybricks/spa-designer --save
```

**参考Github上的[examples文件夹](https://github.com/mybricks/spa-designer/tree/master/examples)的代码**，
主要文件列表如下:

examples<br/>
&nbsp;&nbsp;&nbsp;&nbsp;|__App.less (样式)<br/>
&nbsp;&nbsp;&nbsp;&nbsp;|__App.tsx (主应用)<br/>
&nbsp;&nbsp;&nbsp;&nbsp;|__config.tsx (设计器配置)<br/>
&nbsp;&nbsp;&nbsp;&nbsp;|__constants.ts<br/>
&nbsp;&nbsp;&nbsp;&nbsp;|__index.html<br/>
&nbsp;&nbsp;&nbsp;&nbsp;|__main.js<br/>
&nbsp;&nbsp;&nbsp;&nbsp;|__utils.ts

App.tsx：

```tsx
import Designer from '@mybricks/spa-designer';
import {useComputed, useObservable} from '@mybricks/rxui';
import designerCfg from './config'

export default function App() {
  //定义响应式对象，用于保存设计器onload返回的内容
  const loaded = useObservable(class {
    handlers//按钮
    dump//保存时获取当前设计内容的函数
  })

  return (
    <div className={css.mainView}>
      <TitleBar loaded={loaded}/>
      {/*设计器*/}
      <Designer config={designerCfg}
                onLoad={({handlers, dump}) => {
                  //赋值到响应式对象
                  loaded.handlers = handlers
                  loaded.dump = dump
                }}
                onMessage={(type, msg) => {
                  //对设计过程中产生的消息进行处理
                  message.destroy()
                  message[type](msg)
                }}/>
    </div>
  )
}
```

## config配置项
使用方法

```tsx
<Designer config={{
  //配置对象
}}/>
```

|  属性   | 说明  | 类型  | 默认值  |
|  ----  | ----  | ----  | :----:  |
| comlibLoader  | 组件库loader | ()=>Promise\<ComLib[]\> |- |
| comlibAdder  | 添加组件库（配置此项则在设计器的组件库面板中显示添加按钮） | ()=>Promise\<ComLib\> | - |
| pageLoader  | 页面内容loader |()=>Promise\<DumpObject\> | undefined |
| stage  | 舞台配置 |{type:'pc'\|'mobile', style?:{height:number, width:number, backgroundImage:string, backgroundColor:string}} |{type:'pc'} |
| defaultCfgPanel  | 默认（点击舞台空白位置触发）的配置项 |{title: string, items: {id: string, title: string, type: string, options?, value: {get: () => any, set: (v: any) => any}}[]} | - |

>ComLib类型参照《MyBricks组件开发规范》  
>DumpObject是设计器导出的对象格式

## onLoad

使用方法
```tsx
<Designer onLoad={({handlers, dump})=>{
  //处理内容
}}/>
```

|  参数   | 说明  | 类型   |
|  ----  | ----  | ----  |
| handlers  | 设计器的可操作项数组 | {id:'toggleNavView'\|'toggleCfgView'\|'toggleDebug', title:string, exe:Function, disabled:boolean}[] |
| dump  | 导出当前设计内容 | ()=>DumpObject |

>DumpObject是设计器导出的对象格式


## onMessage

使用方法
```tsx
<Designer onMessage={({type, msg})=>{
  //处理内容
}}/>
```

|  参数   | 说明  | 类型   |
|  ----  | ----  | ----  |
| type  | 消息的类型 | 'info'\|'warn'\|'error' |
| msg  | 消息内容 | string |

## 关于

> 微信 ALJZJZ

<img src="https://raw.githubusercontent.com/mybricks/spa-designer/master/QRCode.jpg"/>

> 邮箱 mybricks@126.com  
> 权利所有：@MyBricks团队