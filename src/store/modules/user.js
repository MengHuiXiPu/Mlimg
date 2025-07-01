import {login, getInfo, logout, LDAPlogin} from '@/api/auth';
import { userInfo, editUser } from '@/api/user';
import {getToken, setToken, removeToken, setRefreshToken} from '@/utils/auth';
import { bucketHost } from '@/utils/minIO';
import { encrypt } from '@/utils/rsaEncrypt';
import { ADMIN_ROLE_ID, initWebSocket, closeWebSocket } from '@/utils';
// import defaultAvatar from '@/assets/images/avatar.png';
import defaultAvatar from '@/assets/avatar.png';
import bus from "@/utils/bus.js"
import {SSOLogin} from "@/api/auth";
export default {
  state: {
    userInfo: {},
    uid: '',
    name: '',
    avatar: '',
    token: getToken(),
    user: {},
    permissions: [],
    isAdmin: false,
  },
  mutations: {
    setUserInfo(state, userInfo) {
        state.userInfo = userInfo
    },
    setUserId(state, uid) {
        state.uid = uid
    },
    setUserName(state, name) {
        state.name = name
    },
    setUserAvatar(state, avatar) {
        state.avatar = avatar
    },
    SET_TOKEN: (state, token) => {
        state.token = token;
    },
    SET_USER: (state, user) => {
        state.user = user;
        // if (user.userAvatarPath) {
        //     state.user.avatar = `${bucketHost}/${user.userAvatarPath}`;
        // } else {
        // state.user.avatar = defaultAvatar;
        // }
        state.user.avatar = defaultAvatar;
    },
    SET_PERMISSIONS: (state, permissions) => {
        state.permissions = permissions;
    },
    SET_IS_ADMIN: (state, isAdmin) => {
        state.isAdmin = isAdmin;
    },
    RESET_USER(state) {
      state.user = {}
    }
  },
  actions: {
      // 登录
      Login({ commit, dispatch }, userInfo) {
          const { rememberMe } = userInfo;
          const loginData = {
              username: userInfo.username,
              password: encrypt(userInfo.password),
              code: userInfo.code,
              uuid: userInfo.uuid,
          };
          return new Promise((resolve, reject) => {
              login(loginData)
                  .then((res) => {
                      setToken(res.token, rememberMe);
                      // loginData.encrypt = true;
                      // setRefreshToken(JSON.stringify(loginData), rememberMe);
                      initWebSocket();
                      commit('SET_TOKEN', res.token);
                      commit('SET_USER', res.user);
                      commit('SET_IS_ADMIN', res.user.roles.length && res.user.roles[0].id === ADMIN_ROLE_ID);
                      commit('SET_PERMISSIONS', res.permissions);
                      dispatch('GetInfo')
                      resolve();
                  })
                  .catch((error) => {
                      reject(error);
                  });
          });
      },

      // 获取用户信息和权限
      GetInfo({ commit }) {
          return new Promise((resolve, reject) => {
              getInfo()
                  .then((res) => {
                      commit('SET_USER', res.user);
                      commit('SET_IS_ADMIN', res.user.roles.length && res.user.roles[0].id === ADMIN_ROLE_ID);
                      commit('SET_PERMISSIONS', res.permissions);
                      resolve(res);
                  })
                  .catch((error) => {
                      reject(error);
                  });
          });
      },

      // 获取用户信息
      GetUserInfo({ commit }) {
          return new Promise((resolve, reject) => {
              userInfo()
                  .then((res) => {
                      commit('SET_USER', res);
                      resolve(res);
                  })
                  .catch((error) => {
                      reject(error);
                  });
          });
      },

      // 修改用户信息
      UpdateUserInfo({ commit }, userInfo) {
          return new Promise((resolve, reject) => {
              editUser(userInfo)
                  .then((res) => {
                      commit('SET_USER', res);
                      resolve(res);
                  })
                  .catch((error) => {
                      reject(error);
                  });
          });
      },

      // 登出
      LogOut({ commit }) {
          return new Promise((resolve, reject) => {
              logout()
                  .then(() => {
                    bus.$emit('closeUploadBox')
                      commit('SET_TOKEN', '');
                      commit('SET_USER', {});
                      commit('SET_PERMISSIONS', []);
                      closeWebSocket();
                      removeToken();
                      resolve();
                  })
                  .catch((error) => {
                      reject(error);
                  });
          });
      },
    // requestMenu({ commit }) {
       //     commit('updateMenus', data.data.menus || [])
    //     commit('updateBtnAuth', data.data.buttonMaks || [])
    // },
    requireUserInfo({ commit }) {
      // getUserInfo().then(res => {
      //   commit('setUserInfo', res)
      //   commit('setUserId', res.uid)
      //   commit('setUserName', res.name)
      //   commit('setUserAvatar', res.headUrl)
      // })
    },
    requestSysUids({ commit }) {
      // return getSysUid().then((res) => {
      //   commit('updateSysList', res)
      // })
    },
    // login({}, params) {
    //     let { username, password } = params
    //     username = username.trim()
    //     password = password.trim()
    //     return login({ username, password }).then(res => {
    //         if(res.code === 0) {
    //             router.push('/').catch(() => {})
    //         }
    //        return res
    //     })
    // },
    // logout() {
    //     return logout().finally(() => {
    //         const isDev = process.env.NODE_ENV === 'development'
    //         if(isDev) {
    //             router.push('/login')
    //         } else {
    //             // router.push('/auth/login')
    //             window.location.href = '/auth/login'
    //         }
    //     })
    // }

      SSOLogin({ commit, dispatch }, code){
          let rememberMe = false;
          return new Promise((resolve, reject) => {
              SSOLogin(code)
                  .then((res) => {
                      setToken(res.token, rememberMe);
                      // loginData.encrypt = true;
                      // setRefreshToken(JSON.stringify(loginData), rememberMe);
                      initWebSocket();
                      commit('SET_TOKEN', res.token);
                      commit('SET_USER', res.user);
                      commit('SET_IS_ADMIN', res.user.roles.length && res.user.roles[0].id === ADMIN_ROLE_ID);
                      commit('SET_PERMISSIONS', res.permissions);
                      dispatch('GetInfo')
                      resolve();
                  })
                  .catch((error) => {
                      reject(error);
                  });
          });
      },

      LDAPLogin({ commit, dispatch }, userInfo) {
          const { rememberMe } = userInfo;
          const loginData = {
              username: userInfo.username,
              password: encrypt(userInfo.password),
              code: userInfo.code,
              uuid: userInfo.uuid,
          };
          return new Promise((resolve, reject) => {
              LDAPlogin(loginData)
                  .then((res) => {
                      setToken(res.token, rememberMe);
                      // loginData.encrypt = true;
                      // setRefreshToken(JSON.stringify(loginData), rememberMe);
                      initWebSocket();
                      commit('SET_TOKEN', res.token);
                      commit('SET_USER', res.user);
                      commit('SET_IS_ADMIN', res.user.roles.length && res.user.roles[0].id === ADMIN_ROLE_ID);
                      commit('SET_PERMISSIONS', res.permissions);
                      dispatch('GetInfo')
                      resolve();
                  })
                  .catch((error) => {
                      reject(error);
                  });
          });
      },
  }
}