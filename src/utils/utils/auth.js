import { setCookie, getCookie, removeCookie } from './cookie'

// 在生产环境时，devops环境变量是异步获取的，再此设置代理
const env = new Proxy({}, {
  get(target, key) {
    const _env_ = window._env_ || {}
    switch(key) {
      case 'ACCESS_TOKEN':
        return _env_['COOKIE_TOKEN_KEY'] || 'access_token'
      case 'TOKEN_TYPE':
        return _env_['COOKIE_TOKENTYPE_KEY'] || 'token_type'
    }
  }
})

/** 获取token */
export function getToken() {
  const accessToken = getCookie(env['ACCESS_TOKEN']),
    tokenType = getCookie(env['TOKEN_TYPE'])
  return accessToken && tokenType ? `${tokenType} ${accessToken}` : ''
}

/** 设置token */
export function setToken(accessToken, tokenType) {
  setCookie(env['ACCESS_TOKEN'], accessToken)
  setCookie(env['TOKEN_TYPE'], tokenType)
}

/** 移除token */
export function removeToken() {
  removeCookie(env['ACCESS_TOKEN'])
  removeCookie(env['TOKEN_TYPE'])
}