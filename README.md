<center><font size="6">tcl-project</font></center>

### 介绍
​	由tcl-cli创建的项目，在vue项目的基础上，引入了tcl插件，集成主题配置以及登录功能，并提供布局和模板。
### 安装依赖

node版本要求, windows平台可以通过nvm安装指定node版本(使用nvm要设置`$NODE_PATH`环境变量)
```JSON
{
    "node": ">=16 & <19"
}
```
可以选择安装以下版本之一, 尽量保持和jenkins构建node版本一致
* node-v18.14.0
* node-v16.13.0

建议使用`V18.14.0`

执行 npm install 安装依赖时, 如遇错误，可尝试执行以下命令来指定镜像源
```js
npm install --registry=https://registry.npmmirror.com
```
### 快速开始
```js
npm run serve
```
浏览器打开 `http://localhost:8008`


### vue版本及组件库使用说明
- 当前已升级vue至2.7.0， 项目已引入vueuse ，使用文档可参考[vueuse](https://vueuse.org/)，可使用组合式API。

- 历史原因，目前项目中使用了`element-ui`和`ant-design-vue`两套组件库，开发者可灵活选中，以`ant-design-vue`为主，一级菜单下的表单，弹框modal以及modal中的表单尽量与现有系统页面统一，使用`ant-design-vue`组件。

- 图标库可使用`element-ui`和`ant-design-vue`自带的图标，如不能满足需求，可在[icon-font](https://www.iconfont.cn/)网站下载svg图标，放在`src/assets/svgs`目录下，脚本会自动引入，以`<svg-icon type=""/>`的形式使用，参见下面的`svg-icon`组件。

### 新增菜单

请登录管理员账号后在`系统管理` -> `目录管理`菜单下可视化配置路由及url，可参考现有页面

### 注意事项及规范

- 业务需求开发，请在.vue文件的样式中使用scoped限定样式作用域，避免样式污染
  <summary>
    使用scoped限定样式作用域
    
    ❌ <code>&lt;style lang="less"&gt;</code>
    
    ✅ <code>&lt;style lang="less" scoped&gt;</code>
  </summary>
- 开发新功能时，如需添加三方依赖，请先查看是否系统已存在相似功能，避免代码叠加，如代码高亮，文件预览等现已支持

- 除了views,store,router等常用目录外，其他项目配置如`vue.config.js` `webpack.dll.conf.js` 等文件尽量少做改动

- 接口调用请写在src/api目录下，按照功能划分，业务模块通过import导入使用


### 目录

```
root ----------------------------- 根目录
|-- public ----------------------- 静态资源
   |-- favicon.ico --------------- 网站ico
   |-- index,html ---------------- 主页
|-- src -------------------------- 源码目录
    |-- assets ------------------- 资源
    |-- images ------------------- 图片资源
    |-- svgs --------------------- svg资源
    |-- components --------------- 自定义组件库
        |-- svg-icon ------------- svg图标组件
    |-- configs ------------------ 配置文件
        |-- logo.png ------------- 系统logo
        |-- system.js ------------ 系统参数
        |-- theme.js ------------- 主题样式变量配置
    |-- layouts ------------------ 自定义布局组件库
        |-- Home.vue ------------- 主页（已登录）布局
        |-- Unauthorized.vue ----- 未登录布局
    |-- routers ------------------ 路由配置
    |-- store -------------------- 状态管理
        |-- user ----------------- 用户信息
        |-- index.js ------------- 通用
    |-- styles ------------------- 自定义样式表
        |-- common.less ---------- 通用样式表
        |-- nprogress.less ------- nprogress插件样式表
    |-- utils -------------------- 工具函数
        |-- mock ----------------- mock
        |-- api ------------------ api函数
        |-- http ----------------- http配置
        |-- index.js ------------- 未分类的工具函数
    |-- views -------------------- 页面组件库
        |-- example -------------- 示例模板
        |-- 404.vue -------------- 404页
        |-- Hello.vue ------------ 欢迎页
        |-- Login.vue ------------ 登录页
    |-- App.vue------------------- 根组件
    |-- main.js ------------------ 入口文件
|-- .browserslistrc -------------- 目标浏览器配置表
|-- babel.config.js -------------- babel配置
|-- package.json ----------------- package信息
|-- README.md -------------------- 本文件
|-- vue.config.js ---------------- vue配置

```

### 目录解读

#### config

项目配置文件所在，包含系统配置（system.js），系统logo（logo.png），以及主题配置（theme.js）

主题配置方案请看[定制主题](https://www.antdv.com/docs/vue/customize-theme-cn/)。

#### router

静态路由：项目默认提供了3个路由，分别是首页（欢迎页），登录页和404页，开发者可以按照自己的需求改造。

动态路由：路由守卫实现了自动获取系统的菜单进行动态路由添加。在技术中台对菜单配置的地址相对项目的./views去查找组件。例如菜单组件地址的配置是"/template/page1"，则按顺序匹配[ "./views/template/page1/index.js",  "./views/template/page1/index.vue" , "./views/template/page1.js", "./views/template/page1.vue"] 。若没找到，则显示"组件正在开发中"

布局：在开发页面时，加上layout属性，生成动态路由时会按照布局组件的名称，从项目的相对地址./layouts中寻找布局组件。通过tcl-cli生成的项目会默认提供两个布局组件（主页以及登录的布局）。（PS：若页面时嵌入iframe中，则无布局。）

静态路由meta参数解读：

- auth：是否要登录鉴权（叶子组件有效）
- fixed：静态菜单显示位置，目前仅支持显示在左侧菜单组件，值为'sider'（1级模块有效）
- icon：菜单的icon type

在开发模式下，会导入模板示例，开发者可以直接复制模板代码到自己的页面组件。如果不想要模板组件，请删除以下代码和文件

```javascript
import exampleRoutes from '../views/example/routes'

if(process.env.NODE_ENV === 'development') {
  // 开发环境下导入模板示例
  routes.push(...exampleRoutes)
}
```

#### store

项目的store，包含子模块user和tcl

user：用户信息

tcl：tcl组件库的状态，有menus（左侧菜单），btnAuth（用户权限）和sysList（系统列表）等

#### components

项目的自定义组件库，开发者可以自己拓展。

##### svg-icon

svg图标组件，会自动导入/src/assets/svgs中的svg。目前仅提供了一个svg图标，开发者可以自己添加属于自己项目的icon。

```vue
<template>
	<svg-icon type="admin" />
</template>
```

参数解读：

- type：svg文件名

#### layouts

布局组件库

##### Home.vue

集成了SiderMenu（左侧菜单）,SysNav（顶部导航栏）和RouterTabs（路由管理组件）的通用布局。

##### Unauthorized.vue

未登录的布局组件

#### views

页面组件库，tcl会自动获取当前登录用户的菜单权限并添加到动态路由中，菜单配置的组件路径也是以该文件为相对地址找寻组件，例如菜单组件地址的配置是"/template/page1"，则按顺序匹配[ "./views/template/page1/index.js",  "./views/template/page1/index.vue" , "./views/template/page1.js", "./views/template/page1.vue"] 。若没找到，则显示"组件正在开发中"。

在开发组件时，可以添加layout属性，添加动态路由时会自动找到该布局组件作为route的component，为空则默认使用Home。

```vue
<template>
	<div>使用Home布局</div>
</template>

<script>
export default {
    layout: 'Home'
}
</script>
```

#### utils

封装了项目的工具函数以及api请求。请求函数使用了tcl提供的http，这里只是为其添加了拦截器（看http.js），开发者可以自定义拦截器或者封装自己的请求函数。


### 设置代理

开发前需要配置代理。默认的代理是格创的开发环境，开发者可以在vue.config.js中修改为自己的服务。

```javascript
module.exports = {
    devServer: {
    proxy: {
      '/api': {
        target: 'http://kong.tcl-platform.10.74.20.163.nip.io/', // 修改此处代理
        changeOrigin: true,
        pathRewrite: { '^/api': '/api' }
      }
    }
  }
}
```



