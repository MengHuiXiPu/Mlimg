<template>
  <div>
    <!-- <a-form-model-item label="算法参数"> -->
      <a-empty v-if="!algorithmParamValue"/>
      <div class="content">
        <div class="mirror-params-list">
          <a-tree
              showLine
              :selected-keys="selectKey"
              :tree-data="parseParamResult"
              :replace-fields="replaceFields"
              @select="selectParamChange"
          ></a-tree>
          <!-- <span v-if="algorithmParamValue" style="color: #0000ff;font-size: 16px; cursor: pointer; padding-left: 6px;" @click="openDialog('open')"><a-icon type="edit" />  参数预览</span> -->
        </div>
        <!-- <EditDataDialog ref="EditDataDialog" @formData="formData" :editForm="editForm"></EditDataDialog> -->
        <param-editor :editForm="editForm" ref="refSdkParamEditor" v-if="isSdkJson"></param-editor>
        <json-editor ref="jsonEditor" :style="{ height: height }" v-model="editForm" class="json-editor scrollbar" v-if="algorithmParam && !isSdkJson"/>
      </div>
      <!-- <a-modal width="740px" class="dataDialog" v-model="visible" @ok="submit" title="超参预览">
        <a-input
            v-if="algorithmParamValue"
            type="textarea"
            :disabled="modelInfoRecord.taskStatus === 1"
            v-model="algorithmParamValue"
            class="text-area algorithmParam"
        ></a-input>
      </a-modal> -->
    <!-- </a-form-model-item> -->
  </div>
</template>

<script>
/**
 * 算法的超参设置，采用json编辑器模式
 */
// import EditDataDialog from './EditDataDialog.vue'
import JsonEditor from '@/components/JsonEditor'
import ParamEditor from '@/components/business/paramSet/ParamEditor.vue';
export default {
  components: {
    // EditDataDialog,
    JsonEditor,
    ParamEditor,
  },
  data() {
    return {
      replaceFields: {
        children: 'childrens',
        title: 'name',
        key:'name'
      },
      editForm: {}, //当前算法参数集表单
      algorithmParamValue: null,
      parseParamResult: [], //解析算法参数结果, 参数在编辑器中有改动时会更新记录到这里，外部可获取该对象进行超参保存
      selectKey: [],  //选中的参数配置集, 其实只有一个元素，单选，某个json配置文件名称
    }
  },
  props: {
    // 算法超参，格式必须为算法详情中的algorithmParam json字符串
    algorithmParam: {
      type: String,
      default: ""
    },
    // 编辑器的高度
    height: {
      type: String,
      default: '55vh'
    }
  },
  computed: {
    /**
     * 新增sdk中json格式，且需要兼容旧的逻辑，两者json格式不一样，且需要前端支持编辑的内容不一样，需要使用不同的组件渲染
     * 标识值， true： sdk， false： 原有算法json格式
     * 使用model_train_params， special_params， model_params这三个字段区分是不是sdk，这三个字段又可能不同时存在
     */
     isSdkJson() {
      if(this.editForm.model_train_params || this.editForm.special_params || this.editForm.model_params) {
        return true
      }else {
        return false
      }
    }
  },
  methods: {
    selectParamChange(selectedKeys, obj = {}) {
      // 先将编辑器里的内容，更新到当前配置的content(content是stringify化的)
      this.parseParamResult.forEach(item => {
        if(item.name === this.selectKey[0]) {
          if(this.isSdkJson) {
            const data = this.$refs.refSdkParamEditor.getValue()
            item.content = JSON.stringify(data, null, 1)
          }else {
            item.content = this.$refs.jsonEditor.getValue()
          }
        }
      })
      // 再更新 this.selectKey
      this.selectKey = selectedKeys
      const selectNode = obj.node?.dataRef || {}
      this.algorithmParamValue = selectNode.content
      this.editForm = JSON.parse(this.algorithmParamValue)
      this.$nextTick(() => {
        if(this.isSdkJson) {
          this.$refs.refSdkParamEditor && this.$refs.refSdkParamEditor.initState()
        }
      })
    },
    /**
     * @public
     */
    getValue() {
      if(this.selectKey) { //不存在的话说明触发过selectParamChange， 编辑器里修改的值已经被记录了，这里只处理存在的情况即可
        this.parseParamResult.forEach(item => {
          if(item.name === this.selectKey[0]) {
            if(this.isSdkJson) {
              const data = this.$refs.refSdkParamEditor.getValue()
              item.content = JSON.stringify(data, null, 1)
            }else {
              item.content = this.$refs.jsonEditor.getValue()
            }
          }
        })
      }
      return this.parseParamResult
    }
  },
  created() {
    if(!this.algorithmParam) return
    try {
      this.parseParamResult = JSON.parse(this.algorithmParam)
      // this.algorithmParam.forEach(item => {
      //   item.key= `${item.name}`
      // })
      this.selectKey = [this.parseParamResult[0].name];
      this.algorithmParamValue = this.parseParamResult[0].content;
      this.editForm = JSON.parse(this.algorithmParamValue)
    }catch (e) {
      this.$message.warning("解析参数异常")
      console.log(e)
    }

  },
  mounted() {
    // this.$nextTick(() => {
    //   if (this.$refs.EditDataDialog) {
    //     this.$refs.EditDataDialog.getRules(this.editForm)
    //   }
    // })
  }
}
</script>

<style lang="less" scoped>
.mirror-params-list{
  // margin-top: 10px;
  // width: 200px;
  // float: left;
  // height: 42vh;
  // margin-right: 10px;
  // overflow-y: auto;
  // border-right: 1px solid #e8e8e8;
}
.content {
  display: flex;
  flex-direction: row;
  .mirror-params-list {
    min-width: 200px;
    overflow-y: auto;
    min-height: 42vh;
  }
  .json-editor {
    flex: 1;
    // height: 50vh;
    overflow-y: auto;
  }
}
</style>