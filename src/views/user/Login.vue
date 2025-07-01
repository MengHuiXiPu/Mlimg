<template>
  <div class="main">
    <a-form
      class="user-layout-login"
      :form="form"
    >

      <a-alert v-if="isLoginError" type="error" showIcon style="margin-bottom: 24px;" :message="loginMsg" />
      <a-form-item>
        <a-input
          size="large"
          type="text"
          placeholder="请输入用户名"
          v-decorator="[
            'username',
            {rules: [{ required: true, message: '请输入用户名' }], validateTrigger: 'change'}
          ]"
        >
          <a-icon slot="prefix" type="user" :style="{ color: 'rgba(0,0,0,.25)' }"/>
        </a-input>
      </a-form-item>

      <a-form-item>
        <a-input
          size="large"
          type="password"
          autocomplete="false"
          placeholder="请输入密码"
          v-decorator="[
            'password',
            {rules: [{ required: true, message: '请输入密码' }], validateTrigger: 'blur'}
          ]"
        >
          <a-icon slot="prefix" type="lock" :style="{ color: 'rgba(0,0,0,.25)' }"/>
        </a-input>
      </a-form-item>

      <a-form-item style="margin-top:24px">
        <a-button
          size="large"
          type="primary"
          class="login-button"
          :loading="state.loginBtn"
          :disabled="state.loginBtn"
          @click="handleSubmit"
        >登 &nbsp;&nbsp; 录</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import qs from 'qs'
import { timeFix, encryptByDES, rootDomain } from '@/utils/util'
import Vue from 'vue'
import Cookie from 'js-cookie'
export default {
  data () {
    return {
      loginMsg: '账号或者密码错误',
      loginBtn: false,
      isLoginError: false,
      form: this.$form.createForm(this),
      state: {
        time: 60,
        loginBtn: false
      }
    }
  },
  created () {

  },
  methods: {
    ...mapActions(['Login']),
    handleSubmit () {
      this.state.loginBtn = true
      this.form.validateFields((err, values) => {
        if (!err) {
          const loginParams = { ...values, grant_type: 'password' }
          getKey(loginParams.username).then(d => {
            if (d.code === 0) {
              loginParams.password = encryptByDES(loginParams.password, d.data)
              login(qs.stringify(loginParams))
              .then((res) => {
                if (res.code === 0) {
                  this.loginSuccess(res.data)
                } else {
                  this.requestFailed(res.msg)
                }
              })
              .catch(err => console.log(err))
              .finally(() => {
                this.state.loginBtn = false
              })
            }
          })
        } else {
          setTimeout(() => {
            this.state.loginBtn = false
          }, 600)
        }
      })
    },
    loginSuccess (res) {
      window._env_ = window._env_ || {}
      Cookie.set(window._env_.COOKIE_TOKENTYPE_KEY || 'token_type', res.tokenType, { domain: rootDomain() })
      Cookie.set(window._env_.COOKIE_TOKEN_KEY || 'access_token', res.accessToken, { domain: rootDomain() })
      this.$router.push({ path: '/' })
      // 延迟 1 秒显示欢迎信息
      setTimeout(() => {
        this.$notification.success({
          message: '欢迎',
          description: `${timeFix()}，欢迎回来`
        })
      }, 1000)
      this.isLoginError = false
    },
    requestFailed (msg) {
      this.isLoginError = true
      this.loginMsg = msg
    }
  }
}
</script>

<style lang="less" scoped>
.user-layout-login {
  label {
    font-size: 14px;
  }

  button.login-button {
    padding: 0 15px;
    font-size: 16px;
    height: 40px;
    width: 100%;
  }
}
</style>
