import Vue from 'vue'
import VueRouter from 'vue-router'
import nprogress from 'nprogress' // progress bar
import '@/styles/nprogress.less'
import store from '@/store'
import system from '../config/system'
import { firstUpperCase, getViewComponent, getLayoutComponent } from '@/utils'
// import { constantRouterMap } from './router-config'
import { getToken, removeToken } from '@/utils/auth';
import { getSSOInfo } from "@/api/auth";
import { isDomainOrIP } from "@/utils/utils";

// const { getToken } = auth

nprogress.configure({ showSpinner: true }) // nprogress Configuration
Vue.use(VueRouter)
const Unauthorized = () => import(/* webpackChunkName: "unauthorized" */ '@/layouts/Unauthorized.vue')

const routes = [
  {
    path: '/',
    name: 'index',
    component: () => import(/* webpackChunkName: "home" */ '@/layouts/Home.vue'),
    meta: { title: '首页', affix: true },
    redirect: '/home/index',
    children: [
      {
        path: '/train/model/step-form',
        name: 'StepForm',
        component: () => import(/* webpackChunkName: "model" */ '@/views/train/stepForm'),
        meta: { title: '模型训练', newTabOpen: true, componentName: 'StepForm', three: true },
      },
      {
        path: '/train/model/addBusinessSteps',
        name: 'addBusinessSteps',
        component: () => import(/* webpackChunkName: "model" */ '@/views/train/model/components/AddBusinessSteps'),
        meta: { title: '新建业务模型', newTabOpen: true, componentName: 'AddBusinessSteps', three: true },
      },
      {
        path: '/train/offline/step-offline',
        name: 'StepOffLine',
        component: () => import(/* webpackChunkName: "offline" */ '@/views/train/stepOffLine'),
        meta: { title: '新建离线评估', newTabOpen: true, componentName: 'StepOffLine' },
      },
      {
        path: '/train/model/detail/', // 模型管理详情页
        name: 'ModelDetail',
        component: () => import(/* webpackChunkName: "model" */ '@/views/train/model/ModelDetail'),
        meta: { title: '查看模型', newTabOpen: true, componentName: 'ModelDetail', three: true },
      },
      {
        path: '/train/model/offline/detail/', // 模型管理详情页-离线预测查看报告
        name: 'ModelOfflineDetail',
        component: () => import(/* webpackChunkName: "model" */ '@/views/train/model/modelOfflineDetail'),
        meta: { title: '查看报告', newTabOpen: true, componentName: 'ModelOfflineDetail' },
      },
      {
        path: '/train/offline/detail/', // 离线预测详情页
        name: 'OfflineDetail',
        component: () => import(/* webpackChunkName: "offline" */ '@/views/train/offline/OfflineDetail'),
        meta: { title: '查看预测', newTabOpen: true, componentName: 'OfflineDetail', three: true },
      },
      {
        path: '/train/mirror/detail', // 镜像管理详情页
        name: 'MirrorDetail',
        component: () => import(/* webpackChunkName: "mirror" */ '@/views/train/mirror/MirrorDetail'),
        meta: { title: '算法详情', newTabOpen: true, componentName: 'MirrorDetail', three: true },
      },
      {
        path: '/dataCenter/dataMrg/detail', // 数据集详情页
        name: 'DataListDetail',
        component: () => import(/* webpackChunkName: "dataMrg" */ '@/views/dataCenter/dataMrg/components/DataListDetail'),
        meta: { title: '数据集详情', newTabOpen: true, three: true },
      },
      {
        path: '/dataCenter/dataTools/templateMake', // 数据集详情页
        name: 'templateMake',
        component: () => import(/* webpackChunkName: "dataMrg" */ '@/views/dataCenter/dataTools/tempMake/index.vue'),
        meta: { title: '模板制作', newTabOpen: true, three: true },
      },
      {
        path: '/dataCenter/dataTools/atsMap', // atsmap 调优
        name: 'atsMap',
        component: () => import(/* webpackChunkName: "dataMrg" */ '@/views/dataCenter/dataTools/atsMap/index.vue'),
        meta: { title: 'ATS MAP参数调优工具', newTabOpen: true, three: true },
      },
      {
        path: '/dataCenter/dataTools/ocrCharLib', // ocr 字符集制作
        name: 'ocrTempMake',
        component: () => import(/* webpackChunkName: "dataMrg" */ '@/views/dataCenter/dataTools/ocrCharLib/index.vue'),
        meta: { title: '模板制作-OCR字符集', newTabOpen: true, three: true },
      },
      {
        path: '/pipelineCenter/preview/:id', // UI编排预览
        name: 'VFormPreview',
        component: () => import(/* webpackChunkName: "dataMrg" */ '@/views/pipelineCenter/vFormPreview'),
        meta: { title: 'UI编排预览', newTabOpen: true, three: true },
      },
      {
        path: '/pipelineCenter/viewer/:id', // 方案详情 查看态
        name: 'PipelineViewer',
        component: () => import(/* webpackChunkName: "dataMrg" */ '@/views/pipelineCenter/Viewer'),
        meta: { title: '方案详情', newTabOpen: true, three: true, parentPath: '/pipelineCenter/view' },
      },
      // {
      //   path: '/pipelineCenter/editor/:id(\\d+)', // 方案编辑
      //   name: 'PipelineEditor',
      //   component: () => import(/* webpackChunkName: "dataMrg" */ '@/views/pipelineCenter/Editor'),
      //   meta: { title: '方案编辑', newTabOpen: true, three: true, parentPath: '/pipelineCenter/editor' },
      // },
      {
        path: '/pipelineCenter/editor', // 方案编辑
        name: 'PipelineEditor',
        component: () => import(/* webpackChunkName: "dataMrg" */ '@/views/pipelineCenter/Editor'),
        meta: { title: '方案编辑', newTabOpen: true, three: true, parentPath: '/pipelineCenter/editor', },
      },
      {
        path: '/pipelineCenter/operatorManage/opDetail/:id(\\d+)', // 算子详情
        name: 'OperatorDetail',
        component: () => import(/* webpackChunkName: "dataMrg" */ '@/views/pipelineCenter/operatorManage/operatorDetail'),
        meta: { title: '算子详情', newTabOpen: true, three: true, parentPath: '/pipelineCenter/operatorManage' },
      },
      {
        path: '/pipelineCenter/operatorManage/opGroupDetail/:id(\\d+)', // 算子组详情
        name: 'OperatorDetail',
        component: () => import(/* webpackChunkName: "dataMrg" */ '@/views/pipelineCenter/operatorManage/operatorGroupDetail'),
        meta: { title: '算子组详情', newTabOpen: true, three: true, parentPath: '/pipelineCenter/operatorManage' },
      },
      { //新增图片复判应用配置
        path: '/application/picReview/add',
        name: 'picReviewAdd',
        component: () => import(/* webpackChunkName: "model" */ '@/views/application/picReview/add'),
        meta: { title: '创建复判应用', newTabOpen: true, keepAlive: 1, componentName: 'StepForm', three: true },
      },
      { //编辑/查看图片复判应用配置
        path: '/application/picReview/view/:id',
        name: 'picReviewConfig',
        component: () => import(/* webpackChunkName: "model" */ '@/views/application/picReview/view'),
        meta: { title: '图片复判配置', newTabOpen: true, keepAlive: 1, componentName: 'StepForm', three: true },
      },
      {
        path: '/application/catalog/detail',
        name: 'CatalogDetail',
        component: () => import(/* webpackChunkName: "catlog" */ '@/views/application/catalog/catalogDetail'),
        meta: { title: '任务详情', newTabOpen: true },
      },
      {
        path: '/application/catalog/middleResult',
        name: 'CatalogMiddleResult',
        component: () => import(/* webpackChunkName: "catlog" */ '@/views/application/catalog/middleResult'),
        meta: { title: '任务-中间结果分析', newTabOpen: true, componentName: 'CatalogMiddleResult' },
      },
      {
        path: '/application/offlineBack/detail',
        name: 'offlineBackDetail',
        component: () => import(/* webpackChunkName: "offlineBack" */ '@/views/application/offlineBack/offlineBackDetail'),
        meta: { title: '离线回放详情', newTabOpen: true },
      },
      {
        path: '/application/billing/detail',
        name: 'billingDetail',
        component: () => import(/* webpackChunkName: "billing" */ '@/views/application/billing/billingDetail'),
        meta: { title: '开单详情', newTabOpen: true },
      },
      {
        path: '/application/billing/middleResult',
        name: 'billingDetailMiddleResult',
        component: () => import(/* webpackChunkName: "billing" */ '@/views/application/billing/middleResult'),
        meta: { title: '开单-中间结果分析', newTabOpen: true, componentName: 'billingDetailMiddleResult' },
      },
      {
        path: '/application/billing/middleResult',
        name: 'billingDetailMiddleResult',
        component: () => import(/* webpackChunkName: "billing" */ '@/views/application/billing/middleResult'),
        meta: { title: '开单-中间结果分析' },
      },
      {
        path: '/application/deviceInfo/monitor',
        name: 'monitorResult',
        component: () => import(/* webpackChunkName: "billing" */ '@/views/application/deviceInfo/components/monitorDataList'),
        meta: { title: '设备监控详情', newTabOpen: true, three: true },
      },
      {
        path: '/application/applicationManagement/detail',
        name: 'ApplicationDetail',
        component: () => import(/* webpackChunkName: "image" */ '@/views/application/applicationManagement/applicationDetail'),
        meta: { title: '应用详情', newTabOpen: true, three: true },
      },
      // {
      //   path: '/pipelineCenter/index/schemeConfigList',
      //   name: 'schemeConfigList',
      //   component: () => import (/* webpackChunkName: "image" */ '@/views/pipelineCenter/components/schemeConfigList.vue'),
      //   meta: { title: '方案配置', newTabOpen: true, three: true },
      // },
      {
        path: '/train/image/detail',
        name: 'ImageDetail',
        component: () => import(/* webpackChunkName: "image" */ '@/views/train/image/imageDetail'),
        meta: { title: '查看镜像详情', newTabOpen: true, three: true },
      },
      {
        path: '/train/model/middleResult',
        name: 'middleResult',
        component: () => import(/* webpackChunkName: "model" */ '@/views/train/model/components/middleResult'),
        meta: { title: '中间结果分析', newTabOpen: true, componentName: 'middleResult', three: true },
      },
      {
        path: '/system/monitor/info',
        name: 'monitorInfo',
        component: () => import(/* webpackChunkName: "system" */ '@/views/system/monitor/components/systemInfo'),
        meta: { title: '主机详情', newTabOpen: true, three: true },
      },
      {
        path: '/train/modelGroup/detail',
        name: 'modelGroupInfo',
        component: () => import(/* webpackChunkName: "model" */ '@/views/train/modelGroup/modelGroupDetail'),
        meta: { title: '模型组详情', newTabOpen: true },
      },
      {
        path: '/application/opCode/detail',
        name: 'opCodeTaskDetail',
        component: () => import(/* webpackChunkName: "opCode" */ '@/views/application/opCode/opCodeTaskDetail'),
        meta: { title: '复判任务详情', newTabOpen: true, three: true },
      },
      {
        path: '/experience/industry/panelDefect',
        name: 'panelDefect',
        component: () => import(/* webpackChunkName: "experience" */ '@/views/experience/industry/panelDefect'),
        meta: { title: '液晶面板行业缺陷检测', newTabOpen: true },
      },
      {
        path: '/experience/experienceManage/info',
        name: 'experienceManageInfo',
        component: () => import(/* webpackChunkName: "experience" */ '@/views/experience/experienceManage/taskInfo'),
        meta: { title: '体验任务详情页', newTabOpen: true },
      },
      {
        path: '/hello',
        name: 'hello',
        component: () => import(/* webpackChunkName: "Hello" */ '@/views/Hello.vue'),
        meta: { auth: false, title: '欢迎' },
      },
      {
        path: '/404',
        name: '404',
        meta: { auth: false, newTabOpen: true, },
        component: () => import(/* webpackChunkName: "404" */ '@/views/exception/404.vue')
      },
      {
        path: 'user/center',
        component: () => import('@/views/user/center'),
        name: 'UserCenter',
        meta: { title: '个人中心' },
      },
      {
        path: '/application/deviceManagement/configureDelivery',
        name: 'configureDelivery',
        component: () => import(/* webpackChunkName: "model" */ '@/views/application/deviceManagement/configureDelivery'),
        meta: { title: '配置下发', newTabOpen: true, componentName: 'configureDelivery', three: true },
      },
      {
        path: '/platformResource/host',
        name: 'host',
        component: () => import(/* webpackChunkName: "model" */ '@/views/platformResource/host'),
        meta: { title: '主机管理', newTabOpen: true, componentName: 'configureDelivery', three: true },
      },
      {
        path: '/platformResource/resourcePool',
        name: 'resourcePool',
        component: () => import(/* webpackChunkName: "model" */ '@/views/platformResource/resourcePool'),
        meta: { title: '资源池管理', newTabOpen: true, componentName: 'configureDelivery', three: true },
      },
    ]
  },
  {
    path: '/',
    component: Unauthorized,
    children: [
      {
        path: 'login',
        name: 'Login',
        meta: { auth: false },
        component: () => import(/* webpackChunkName: "login" */ '@/views/login.vue')
      },
      {
        path: '/ts/login',
        name: 'TsLogin',
        meta: { auth: false },
        component: () => import(/* webpackChunkName: "login" */ '@/views/tslogin.vue')
      },
      {
        path: '/local/login',
        name: 'LocalLogin',
        meta: { auth: false },
        component: () => import(/* webpackChunkName: "login" */ '@/views/locallogin.vue')
      },
      {
        name: 'Register',
        path: '/register',
        meta: { auth: false, title: '注册' },
        component: () => import('@/views/register'),
      },
      {
        name: 'Resetpassword',
        path: '/resetpassword',
        meta: { auth: false, title: '找回密码' },
        component: () => import('@/views/resetpassword'),
      },
      {
        path: '/application/alarm/record/detail',
        name: 'AlarmRecordDetail',
        component: () => import(/* webpackChunkName: "image" */ '@/views/application/catalog/alarmRecordDetail'),
        meta: { title: '待办通知详情', newTabOpen: true },
      },
    ]
  },
  // 个人中心
  // {
  //   path: '/',
  //   hidden: true,
  //   component: () => import (/* webpackChunkName: "home" */ '@/layouts/BaseLayout.vue'),
  //   children: [
  //     {
  //       path: 'user/center',
  //       component: () => import('@/views/user/center'),
  //       name: 'UserCenter',
  //       meta: { title: '个人中心' },
  //     },
  //   ],
  // },
  // {
  //   path: '/404',
  //   name: '404',
  //   meta: { auth: false },
  //   component: () => import(/* webpackChunkName: "404" */ '@/views/404.vue')
  // }
  {
    path: '/callback',
    name: 'Callback',
    component: () => import('@/views/Callback.vue')
  }
]

const isDev = process.env.NODE_ENV === 'development'


const router = new VueRouter({
  mode: 'history',//路由模式
  base: isDev ? '/' : system.baseUrl,
  routes
})


router.beforeEach(async function (to, from, next) {
  nprogress.start()//进度条开始加载
  // if(to.meta.hasOwnProperty('auth') && !to.meta.auth) {
  //   console.log("直接跳转");
  //   next()
  //   return false
  // }

  // await store.dispatch('request/requestMenus')
  // return next();
  // console.log("from: ", from);
  // console.log(" permissions getToken() " + getToken());
  if (to.path === '/login'
    || to.path === '/ts/login'
    || to.path === '/local/login'
    || to.path === '/register'
    || to.path === '/resetpassword'
    || to.path === '/callback'
    || to.path === '/application/alarm/record/detail'
    || to.path === '/web') {
    return next();
  } else {
    if (getToken()) {
      if (!store.state.user.user.username) {
        // 登录状态刷新页面，重新拉取用户信息和菜单
        await store.dispatch('GetInfo')
      }
      if (!store.state.request.menus) {
        await store.dispatch('request/requestMenus')
        if (!store.state.request.menus) {
          // if (isDev) {
          //   // next('/login')
          //
          //   navigateLoginUrl(to, from, next)
          // }
          // else {
          //   location.href = `/auth/login?fromUrl=${location.href}`
          // }
          navigateLoginUrl(to, from, next)
        } else {
          router.addRoutes([
            ...createRouteByMenus(to, from, next),
            { path: '*', redirect: '/hello' }
          ])
          return next({ ...to, replace: true })
        }
      } else {
        return next()
      }
    } else {
      navigateLoginUrl(to, from, next)
    }
  }

})

router.afterEach(() => {
  nprogress.done()//进度条完成加载
})

/** 根据url获取组件名称 */
function getComponentName(url) {
  return typeof url === 'string' ? url.split('/').map(firstUpperCase).join('') : ''
}

const IframePage = () => import('@/views/iframePage')

/** 根据menus创建动态路由 */
export function createRouteByMenus() {
  const newRoutes = []
  // console.log("store.state.request.menus： ", store.state.request.menus)
  if (!store.state.request.menus?.length) return newRoutes
  const routesMap = new Map()
  let queues = [].concat(store.state.request.menus), item = null
  while (item = queues.shift()) {
    if (item.children && item.children.length) {
      item.children = item.children.map(data => {
        return {
          ...data,
          parentName: item.name
        }
      })
      queues = queues.concat(item.children)
    } else if (item.path /*&& (item.target === 'render' || item.target === 'iframe')*/) {
      let component = null
      // item.hidden = false
      const newRoute = {
        path: item.path,
        // 新增level 表示菜单层级，目前仅2有意义，详情页使用之前的three: true字段表示是三级页面
        meta: { title: item.name, parentName: item.parentName ? item.parentName : item.name, auth: true, icon: item.icon, newTabOpen: true, keepAlive: 0, level: 2 }
      }
      // if(item.target === 'render') {
      newRoute.name = getComponentName(item.path)
      component = getViewComponent(item.component)
      newRoute.meta.componentName = component.name
      // } else {
      //   newRoute.path = `/iframe/${item.id}`
      //   newRoute.meta.url = item.url
      //   component = IframePage
      // }
      newRoute.component = component
      if (self.frameElement && self.frameElement.tagName == "IFRAME") {
        newRoutes.push(newRoute)
      } else {
        const layout = component.layout || 'Home'
        if (routesMap.get(layout)) {
          routesMap.get(layout).children.push(component)
        } else {
          const layoutComponent = getLayoutComponent(layout)
          if (layoutComponent) {
            const layoutRoute = { path: '', component: layoutComponent, children: [newRoute] }
            routesMap.set(component.layout, layoutRoute)
            newRoutes.push(layoutRoute)
          } else {
            newRoutes.push(newRoute)
          }
        }
      }
      // console.log("newRoutes: +++", newRoutes)
    }
  }
  // console.log("newRoutes: +++", newRoutes)
  return newRoutes
}


const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function (location, onComplete, onAbort) {
  if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
    return originalPush.call(this, location, onComplete, onAbort).catch(err => { })
  } else {
    // <router-link>进行路由跳转时，传了一个oncomplate方法
    originalPush.call(this, location, onComplete, onAbort)
  }
}


/*
//取消来自重复路由的报错
const routerPush = VueRouter.prototype.push
VueRouter.prototype.push = function (location, onComplete, onAbort) {
    return routerPush.call(this, location, onComplete, onAbort).catch(err => {
        if (!/^NavigationDuplicated/.test(err)) {
            console.log(err);
        }
    })
}
*/

/** 根据url获取组件名称 */
export function navigateLoginUrl(to, from, next) {
  // 判断当前路径基地址
  const hostname = window.location.hostname;
  if (hostname === "ai.csot.tcl.com" || hostname === "testai.csot.tcl.com") {
    const path = window.location.pathname
    if (path.startsWith("/login") || path.startsWith("/")) {
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存原始URI
      });
    } else {
      next({
        path: '/ts/login',
        query: { redirect: to.fullPath } // 保存原始URI
      });
    }
  } else {
    next({
      path: '/local/login',
      query: { redirect: to.fullPath } // 保存原始URI
    });
  }
}
export default router
