import {getInfo} from "@/api/auth";
import {ADMIN_ROLE_ID} from "@/utils";
import {getSSOInfo} from "@/api/auth";

const options = require('@/options/index').default
const { userMenus } = require('@/api/user')

const request = {
  namespaced: true,
  state: {
    menus: null,
    btnAuth: [],
    sysList: null
  },
  getters: {
    systemName: state => {
      try {
        const currentSystem = state.sysList.find(item => item.sysCode === options.system.code)
        return currentSystem.sysName
      } catch (e) {
        return ''
      }
    }
  },
  mutations: {
    updateMenus(state, menus) {
      menus.forEach(item => {
        if (item.name === 'home') {
          item.path = '/home/index'
        }
        // if (item.name === '控制台') {
        //   item.children.forEach(child => {
        //     if(!child.path.startsWith('/')) {
        //       child.path = '/' + child.path
        //     }
        //   })
        // }
      })
      state.menus = menus
    },
    resetMenus(state) {
      state.menus = null
    },
    updateBtnAuth(state, btnAuth) {
      state.btnAuth = btnAuth
    },
    updateSysList(state, sysList) {
      state.sysList = sysList
    }
  },
  actions: {
    requestMenus({ commit }) {
        return userMenus().then((data) => {
            // console.log("requestMenus code: ", JSON.stringify(obj))
            commit('updateMenus', data || [])
            commit('updateBtnAuth', data["buttonMaks"] || [])
          })
          .catch(err => {
            throw err
          })

      // return getMenus()
      // .then(({ code, data, msg }) => {
      //     alert("kkk" + code)
      //     console.log("requestMenus code: ", code)
      //   if(code === 0) {
      //     commit('updateMenus', data.menus || [])
      //     commit('updateBtnAuth', data.buttonMaks || [])
      //   } else {
      //     throw new Error(msg)
      //   }
      // })
      // .catch(err => {
      //   throw err
      // })
    },
    requestSysUid({ commit }) {
      return getSysUid().then(({ code, data }) => {
        if (code === 0) {
          commit('updateSysList', data)
        }
      })
    },
    // 获取用户信息和权限
    getSSOInfo({ commit }) {
      return new Promise((resolve, reject) => {
        getSSOInfo()
            .then((res) => {
              // commit('SET_USER', res.user);
              resolve(res);
            })
            .catch((error) => {
              reject(error);
            });
      });
    },
  }
}

export default request