<template>
    <div class="step-content">
      <div v-if="this.$slots.left" class="left content">
        <slot name="left"></slot>
      </div>

      <div v-if="this.$slots.right" class="right">
        <div class="top content">
          <slot name="right"></slot>
        </div>
        <div v-if="this.$slots.bottom" class="bottom">
            <slot name="bottom"></slot>
        </div>
      </div>

      <div v-if="this.$slots.rightSpecial" class="rightSpecial">
        <div class="top content">
          <slot name="rightSpecial"></slot>
        </div>
        <div v-if="this.$slots.bottomSpecial" class="bottomSpecial">
          <slot name="bottomSpecial"></slot>
        </div>
      </div>

      <div class="top">
          <div class="top-content" v-if="this.$slots.top">
              <slot name="top"></slot>
          </div>
      </div>
      <div v-if="this.$slots.bottomTest" class="bottom">
        <slot name="bottomTest"></slot>
      </div>

<!--      离线评估用得布局，左侧20%，右侧百分比80%-->
      <div v-if="this.$slots.leftOffline" class="leftOffline content">
        <slot name="leftOffline"></slot>
      </div>

      <div v-if="this.$slots.rightOffline" class="rightOffline content">
        <slot name="rightOffline"></slot>
      </div>


      <!--      第六步部署用得布局，左侧固定宽度，右侧百分比自适应宽度-->
      <div v-if="this.$slots.leftDeploy" class="deploy">
        <div class="top content">
          <div v-if="this.$slots.leftDeploy" class="leftDeploy content">
            <slot name="leftDeploy"></slot>
          </div>
          <div v-if="this.$slots.rightDeploy" class="rightDeploy content">
            <slot name="rightDeploy"></slot>
          </div>
        </div>
        <div v-if="this.$slots.bottomDeploy" class="bottom">
          <slot name="bottomDeploy"></slot>
        </div>
      </div>
    </div>
</template>

<script>
import splitPane from "vue-splitpane"
export default {
  name: 'StepLayout',
  components: {
    "split-pane": splitPane
  },
  data () {
    return {
      labelCol: { lg: { span: 5 }, sm: { span: 5 } },
      wrapperCol: { lg: { span: 19 }, sm: { span: 19 } },
      form: this.$form.createForm(this)
    }
  },
  methods: {
    nextStep () {
      const { form: { validateFields } } = this
      // 先校验，通过表单校验后，才进入下一步
      validateFields((err, values) => {
        if (!err) {
          this.$emit('nextStep')
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";

.step-content{
  width:100%;
  display: flex;
  //height: 100%;
  height: calc(100vh - 255px);
  //height: auto;
  flex-direction: row;
  padding: 20px;
  .content{
    //height: 100%;
    //overflow: auto;
    //margin: 0 10px;
    overflow-y: auto;
    .scrollbar()
  }
  .left {
    flex: 3;
    //width: 30%;
    box-sizing: border-box;
    height: 100%;
    padding: 10px;
    background-color: @paneBackgroundColor;
    border-radius: @borderRadiusBig;
    margin-right: 16px;
  }
  .right {
    flex: 7;
    //width: 70%;
    box-sizing: border-box;
    height: 100%;
    .top {
      border-radius: @borderRadiusBig;
      padding: 20px;
      padding-bottom: 0px;
      height: 90%;
      background-color: @paneBackgroundColor;
      margin-bottom: 20px;
    }
    .bottom {
      display: flex;
      justify-content: flex-end;
      height: 10%;
      //background-color: pink;
    }
  }
  .rightSpecial {
    flex: 1;
    box-sizing: border-box;
    height: 100%;
    .top {
      //border-radius: @borderRadiusBig;
      //padding: 20px;
      height: 90%;
      background-color: #fff;
      margin-bottom: 20px;
    }
    .bottomSpecial {
      display: flex;
      justify-content: flex-end;
      height: 10%;
      //background-color: pink;
    }
  }
  .leftOffline {
    flex: 2;
    box-sizing: border-box;
    height: 100%;
    padding: 10px;
    background-color: @paneBackgroundColor;
    border-radius: @borderRadiusBig;
    margin-right: 16px;
  }
  .rightOffline {
    flex: 8;
    box-sizing: border-box;
    height: 100%;
    background-color: @paneBackgroundColor;
    // border-radius: @borderRadiusBig;
  }

  .deploy {
    width: 100%;
    .top {
      display: flex;
      width: 100%;
      border-radius: @borderRadiusBig;
      padding: 20px;
      height: 90%;
      //background-color: @paneBackgroundColor;
      margin-bottom: 20px;
      .leftDeploy {
        width: 500px;
        box-sizing: border-box;
        height: 100%;
        padding: 10px;
        background-color: @paneBackgroundColor;
        border-radius: @borderRadiusBig;
        margin-right: 16px;
      }
      .rightDeploy {
        flex: 1;
        box-sizing: border-box;
        height: 100%;
        background-color: @paneBackgroundColor;
        border-radius: @borderRadiusBig;
      }
    }
    .bottom {
      width: 100%;
      display: flex;
      justify-content: flex-end;
      height: 10%;
      //background-color: pink;
    }
  }
  //.top{
  //  flex:1;
  //  display: flex;
  //  border-bottom: 2px solid #e6e7ea;;
  //  overflow: hidden;
  //  .top-content{
  //    height: 100%;
  //    width: 100%;
  //    overflow: auto;
  //  }
  //}
  //.bottom{
  //  height: 52px;
  //  padding-left: 20px;
  //  padding-right: 20px;
  //  display: flex;
  //  align-items: center;
  //  justify-content: flex-end;
  //}
}
</style>
