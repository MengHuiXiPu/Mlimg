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
  <div style="width: 100vw; height: 100vh">
    <div id="content">
      <div class="box-style">
        <div class="flex-layout">
          <div class="login-image3"><span style="float: left">星舟启航</span><br><span style="float: right;padding-right: 40px;">智创未来</span></div>
          <div class="form-content">
            <slot />
            <span class="footer-text">Copyright ©
              <img
                src="@/assets/tcl_csot_logo.png"
                height="25px"
                width="auto"
                alt
            /></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LoginPublic",
  data() {
    return {};
  },
  mounted() {},
  methods: {},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "~@/assets/styles/variables.scss";

#content {
  height: 100%;
  background: #60a2ff;
  display: flex;
  justify-content: center;
  align-items: center;
  .box-style {
    display: inline-block;
    height: 602px;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    .flex-layout {
      display: flex;
      height: 100%;
      .login-image3 {
        width: 500px;
        height: 100%;
        padding-top: 136px;
        padding-left: 40px;
        font-weight: 700;
        font-size: 36px;
        background: url("../../assets/images/loginImage3.png") center / cover
          no-repeat;
        color: #027DB4;
      }
      .form-content {
        position: relative;
        padding: 100px 56px 0 56px;
        overflow: auto;
        .footer-text {
          font-size: 12px;
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(20%);
        }
      }
    }
    // padding: 16px;
  }
  // .right {
  //   display: flex;
  //   align-items: center;
  //   justify-content: center;
  //   float: right;
  //   width: 38.2%;
  //   height: 100%;
  //   padding-bottom: 70px;
  //   background: #fff;
  // }
}
</style>
