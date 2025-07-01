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
        </h2>
        <el-form-item>
          <el-button
              :loading="loading"
              type="primary"
              size="medium"
              style="width: 100%"
              @click.native.prevent="handleLoginSSO"
          >
            <span v-if="!loading">SSO 登 录</span>
            <span v-else>跳 转 中...</span>
          </el-button>
        </el-form-item>
      </el-form>
    </login-public>
  </div>
</template>

<script>
import Cookies from "js-cookie";
import { getCodeImg } from "@/api/auth";
import LoginPublic from "@/components/LoginPublic";
import { loginConfig } from "@/config/config";
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
        username: "",
        password: "",
        rememberMe: false,
        code: 0,
        uuid: "",
      },
      loginRules: {
        username: [
          { required: true, trigger: "blur", message: "用户名不能为空" },
        ],
        password: [
          { required: true, trigger: "blur", message: "密码不能为空" },
        ],
        // code: [
        //   { required: true, trigger: "change", message: "验证码不能为空" },
        // ],
      },
      loading: false,
    };
  },
  created() {
    this.handleLoginSSO();

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
    handleLoginSSO() {
      this.loading = true
      getSSOInfo().then(res => {
        console.log("res", res)
        let authorizeUrl = `${res.authorizeUrl}?client_id=${res.clientId}&redirect_uri=${res.redirectUri}&response_type=${res.responseType}`

        this.handleFallbackRedirect(authorizeUrl);

      }).catch(err => {
        this.loading = false
        console.log(err);
        const hostname = window.location.hostname;
        if (hostname === "ai.csot.tcl.com" || hostname === "testai.csot.tcl.com") {
          this.$router.push({ path: "/ts/login" }).catch(err => {
            console.log(err);
          });
        } else {
          this.$message.warning("SSO访问失败，已切换至本地登录登录");
          this.$router.push({ path: "/local/login" }).catch(err => {
            console.log(err);
          });
        }
      })
    },

    handleFallbackRedirect(url) {
      // 判断当前路径基地址
      const hostname = window.location.hostname;
      if (hostname === "ai.csot.tcl.com" || hostname === "testai.csot.tcl.com") {
        const path = window.location.pathname
        if (path.startsWith("/login") || path.startsWith("/")) {
          window.location.href = url;
        }else {
          this.$router.push({ path: "/ts/login" }).catch(err => {
            console.log(err);
          });
        }
      } else {
        this.$message.warning("SSO访问失败，已切换至本地登录登录");
        this.$router.push({ path: "/local/login" }).catch(err => {
          console.log(err);
        });
      }
    }
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
