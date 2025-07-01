<template>
  <div class="copilot-container">
    <el-collapse-transition>
      <div class="content" v-show="isShow">
        <header class="title">开发助手</header>
        <a-textarea placeholder="Message Vision Agnet" ref="inputRef"  v-model="iptText" @pressEnter="doEnter"/>
        <i class="el-icon-circle-check" @click="doEnter"></i>
      </div>
    </el-collapse-transition>
    <a-button type="primary" shape="circle" class="btn" @click="toggleShow"></a-button>
  </div>
</template>

<script>
import { ref, nextTick } from "vue";
import eventBus from "@/views/pipelineCenter/pipelineEditor/utils/eventBus";
import { Loading } from 'element-ui';
/**
 * 开发助手
 */
export default {
  setup() {
    const iptText = ref("")
    const inputRef = ref(null);
    const isShow = ref(false)
    const focusInput = () => {
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus();
        }
      });
    };
    const toggleShow = () => {
      isShow.value = !isShow.value
      if(isShow.value) {
        focusInput()
      }
    }
    const doEnter = () => {
      const loading =  Loading.service({
        text: '结果生成中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.4)'
      });
      setTimeout(() => {
        eventBus.$emit('reloadGraph')
        loading.close()
      }, 4000)
      
    }
    return  {
      inputRef,
      iptText,
      isShow,
      doEnter,
      toggleShow,
      focusInput,
    }
  }
}
</script>

<style lang="less" scoped>
.copilot-container {
  position: fixed;
  bottom: 10px;
  right: 330px;
  .content {
    width: 300px;
    height: 350px;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 0 5px 5px #f7f6f6;
    // padding: 10px;
    position: absolute;
    bottom: 40px;
    right: 0;
    box-sizing: border-box;
    overflow: hidden;
    // margin-bottom: 30px;
    // transition: height .5s;
    .title {
      color: #333333;
      font-size: 18px;
      font-weight: 700;
      margin: 10px;
    }
    ::v-deep .ant-input {
      height: 290px;
      outline: none;
      box-shadow: none; /* 去掉聚焦时的阴影 */
      border-color: transparent; /* 去掉聚焦时的边框颜色 */
      resize: none;
      &:focus {
        // border: none!important;
        outline: none;
        box-shadow: none; /* 去掉聚焦时的阴影 */
        border-color: transparent; /* 去掉聚焦时的边框颜色 */
      }
    }
  }
  .el-icon-circle-check{
    font-size: 32px;
    position: absolute;
    bottom: 10px;
    right: 20px;
    cursor: pointer;
  }
  .btn {
    position: absolute;
    bottom: 0;
    right: 10px;
    border-radius: 50%;
  }
}
</style>