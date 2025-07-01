
// 这个文件应该没有被使用，动态鉴权在router/index.js中
import Vue from 'vue'
import router from './router'
import store from './store'
import Cookie from 'js-cookie'
import NProgress from 'nprogress' // progress bar
import '@/assets/less/nprogress.less' // progress bar custom style
import notification from 'ant-design-vue/es/notification'
import { setDocumentTitle, rootDomain } from '@/utils/util'
import { getToken, removeToken } from '@/utils/auth';

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['login'] // no redirect whitelist
const defaultRoutePath = '/home/index'

//这里的路由守卫是不生效的，路由守卫见router/index.js
router.beforeEach((to, from, next) => {
  NProgress.start() // start progress bar
  if (to.path === '/process-tpl') {
    setDocumentTitle(`审批信息`)
  } else if (to.path === '/process-opinion') {
    setDocumentTitle(`处理意见`)
  } else if (to.path === '/process-assign') {
    setDocumentTitle(`转办`)
  } else {
    setDocumentTitle(`${store.state.app.sysInfo.name || ' '}`)
  }
  // window._env_.COOKIE_TOKENTYPE_KEY || 'access_token'
  // window._env_.COOKIE_TOKEN_KEY || 'token_type'
  window._env_ = window._env_ || {}
  const COOKIE_TOKENTYPE_KEY = window._env_.COOKIE_TOKENTYPE_KEY || 'token_type'
  const COOKIE_TOKEN_KEY = window._env_.COOKIE_TOKEN_KEY || 'access_token'

  const accessToken = Cookie.get(COOKIE_TOKEN_KEY, { domain: rootDomain() })
  const tokenType = Cookie.get(COOKIE_TOKENTYPE_KEY, { domain: rootDomain() })

  console.log(" permissions getToken() " + getToken());
  if (getToken()){
    /* has token */
    if (to.path === '/user/login') {
      next({ path: defaultRoutePath })
      NProgress.done()
    } else {
      if (JSON.stringify(store.getters.userInfo) === '{}') {
        store.dispatch('GetInfo').then(res => {
            // const roles = res.result && res.result.role
            store.dispatch('GenerateRoutes', { }).then(() => {
              // 根据roles权限生成可访问的路由表
              // 动态添加可访问路由表
              // console.log(store.getters.addRouters)
              router.addRoutes(store.getters.addRouters)
              // 请求带有 redirect 重定向时，登录自动重定向到该地址
              const redirect = decodeURIComponent(from.query.redirect || to.path)
              if (to.path === redirect) {
                // hack方法 确保addRoutes已完成 ,set the replace: true so the navigation will not leave a history record
                next({ ...to, replace: true })
              } else {
                // 跳转到目的路由
                next({ path: redirect })
              }
            })
          })
          .catch(() => {
            notification.error({
              message: '错误',
              description: '请求用户信息失败，请重试'
            })
            store.dispatch('Logout').then(() => {
              next({ path: '/user/login', query: { redirect: to.fullPath } })
            })
            NProgress.done()
          })
      } else {
        next()
      }
    }
  } else {
    if (whiteList && whiteList?.includes(to.name)) {
      // 在免登录白名单，直接进入
      next()
    } else {
      const fromUrl = location.href
      const isDev = process.env.NODE_ENV === 'development'
      const url = '/user/login'
      if (!isDev) {
        const httpUrl = location.protocol + '//' + location.host
        window.location.href = `${httpUrl}/auth/login?fromUrl=${fromUrl}`
      } else {
        next({ path: url })
      }
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done() // finish progress bar
})
