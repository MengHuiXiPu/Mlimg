/** Copyright 2020 Tianshu AI Platform. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* =============================================================
*/

<template>
  <div style="height: 100%">
    <login-public>
      <el-form
          ref="loginForm"
          :model="loginForm"
          :rules="loginRules"
          label-position="left"
          label-width="0px"
          class="login-form"
      >
        <h2 class="title">
          <div class="flex">
            <img
                src="@/assets/ai_logo.png"
                height="50px"
                width="auto"
                alt
            /><span class="first-line">{{ system.name }}</span>
          </div>
          <br>
          <span style="font-size: xx-small">逃生通道</span>
        </h2>

<!--        <el-form-item prop="loginType">-->
<!--          <el-select v-model="loginForm.loginType" placeholder="账号类型" style="width: 100%">-->
<!--            <i slot="prefix" class="el-input__icon el-icon-setting"/>-->
<!--            <el-option value="ldap" label="LDAP账号"></el-option>-->
<!--            <el-option value="account" label="本地账号"></el-option>-->
<!--          </el-select>-->
<!--        </el-form-item>-->
        <el-form-item prop="username">
          <el-input
              v-model="loginForm.username"
              type="text"
              auto-complete="off"
              placeholder="用户名"
          >
            <i slot="prefix" class="el-input__icon el-icon-user"/>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
              v-model="loginForm.password"
              type="password"
              auto-complete="off"
              placeholder="密码"
              @keyup.enter.native="handleLogin"
          >
            <i slot="prefix" class="el-input__icon el-icon-lock"/>
            <el-tooltip class="item" content="重置密码请联系管理员" slot="suffix" placement="top">
              <i class="el-input__icon el-icon-warning-outline" style="font-size: 14px;color: #cdcdcd;"/>
            </el-tooltip>
          </el-input>
        </el-form-item>
        <!--            <el-form-item prop="code">-->
        <!--              <el-input-->
        <!--                  v-model="loginForm.code"-->
        <!--                  auto-complete="off"-->
        <!--                  placeholder="验证码"-->
        <!--                  style="width: 63%"-->
        <!--                  @keyup.enter.native="handleLogin"-->
        <!--              >-->
        <!--                <i slot="prefix" class="el-input__icon el-icon-circle-check"/>-->
        <!--              </el-input>-->
        <!--              <div class="login-code">-->
        <!--                <img-->
        <!--                    v-show="codeUrl"-->
        <!--                    :src="codeUrl"-->
        <!--                    alt="刷新验证码"-->
        <!--                    @click="getCode"-->
        <!--                />-->
        <!--              </div>-->
        <!--            </el-form-item>-->
        <el-form-item>
          <div class="clearfix">
            <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
            <!-- <el-button
              type="text"
              style="float: right"
              @click="$router.replace({ path: '/resetpassword' })"
              >找回密码</el-button
            > -->
            <!-- <el-button
              v-if="loginConfig.allowRegister"
              type="text"
              style="float: right; margin-right: 10px"
              @click="$router.replace({ path: '/register' })"
              >免费注册</el-button
            > -->
          </div>
          <el-button
              :loading="loading"
              type="primary"
              size="medium"
              style="width: 100%"
              @click.native.prevent="handleLogin"
          >
            <span v-if="!loading">登 录</span>
            <span v-else>登 录 中...</span>
          </el-button>
        </el-form-item>
      </el-form>
    </login-public>
  </div>
</template>

<script>
import Cookies from "js-cookie";
import {getCodeImg} from "@/api/auth";
import LoginPublic from "@/components/LoginPublic";
import {loginConfig} from "@/config/config";
import system from '@/config/system.js'

import {SSOLogin, getSSOInfo} from "@/api/auth";

export default {
  name: "Login",
  components: {
    LoginPublic,
  },
  data() {
    return {
      loginConfig,
      codeUrl: "",
      loginForm: {
        loginType: 'ldap',
        username: "",
        password: "",
        rememberMe: false,
        code: 0,
        uuid: "",
      },
      loginRules: {
        username: [
          {required: true, trigger: "blur", message: "用户名不能为空"},
        ],
        password: [
          {required: true, trigger: "blur", message: "密码不能为空"},
        ],
        // code: [
        //   { required: true, trigger: "change", message: "验证码不能为空" },
        // ],
      },
      loading: false,
    };
  },
  created() {
    this.getCode();
    this.getCookie();
  },
  computed: {
    system() {
      return system
    },
  },
  methods: {
    getCode() {
      getCodeImg().then((res) => {
        this.codeUrl = res.img;
        this.loginForm.uuid = res.uuid;
      });
    },
    getCookie() {
      this.loginForm.username = Cookies.get("username") || "";
    },
    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          this.loading = true;
          if (this.loginForm.rememberMe) {
            Cookies.set("username", this.loginForm.username, {expires: 7});
          } else {
            Cookies.remove("username");
          }
          this.$store
              .dispatch("LDAPLogin", this.loginForm)
              .then(() => {
                this.loading = false;
                // this.$router.push({ path: '/' });
                const redirect = this.$route.query.redirect || {path: '/'};
                this.$router.push(redirect);
                // const redirectPath = localStorage.getItem('redirectPath');
                //
                // if (redirectPath){
                //   this.$router.push(redirectPath);
                //   localStorage.removeItem('redirectPath')
                // }else {
                //   this.$router
                //       .push({
                //         path: "/",
                //       })
                //       .catch((err) => {
                //         console.log(err);
                //       });
                // }
              })
              .catch((err) => {
                this.$message.error(err.message);
                this.loading = false;
                this.getCode();
              });

          return true;
        }
        return false;
      });
    },
    handleLoginSSO() {
      getSSOInfo().then(res => {
        console.log("res", res)
        let authorizeUrl = `${res.authorizeUrl}?client_id=${res.clientId}&redirect_uri=${res.redirectUri}&response_type=${res.responseType}`
        // window.open(authorizeUrl,'_self');
        console.log("authorizeUrl", authorizeUrl)
        window.location.href = authorizeUrl;
      }).catch(err => {
      })
    },
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "~@/assets/styles/variables.scss";

.copyright {
  margin-top: 1px;
}

.title {
  margin: 0 auto 30px;
  // color: $primaryColor;
  color: #333333;
  text-align: center;

  div.flex {
    display: flex;
    align-items: center;
    justify-content: center;

    .first-line {
      position: relative;
      //right: 25px;
      font-weight: 700;
      color: #087EB3;
    }
  }

  .second-line {
    font-weight: 700;
  }
}

@media screen and (max-width: 1000px) {
  .title {
    font-size: 1.3em;
  }
}

.login-form {
  width: 360px;

  .el-input {
    height: 38px;

    input {
      height: 38px;
    }
  }

  .input-icon {
    width: 14px;
    height: 39px;
    margin-left: 2px;
  }
}

.login-tip {
  font-size: 13px;
  color: #bfbfbf;
  text-align: center;
}

.login-code {
  float: right;
  width: 33%;
  height: 38px;

  img {
    width: 100%;
    height: 100%;
    vertical-align: middle;
    cursor: pointer;
  }
}
</style>
