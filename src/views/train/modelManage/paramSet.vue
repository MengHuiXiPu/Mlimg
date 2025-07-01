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
        <json-editor ref="jsonEditor" v-model="editForm" class="json-editor scrollbar" v-if="algorithmParam"/>
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
import EditDataDialog from './EditDataDialog.vue'
import JsonEditor from '@/components/JsonEditor'
export default {
  components: {
    EditDataDialog,
    JsonEditor
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
      selectKey: [],  //默认选中的参数配置集, 其实只有一个元素，单选，某个json配置文件名称
    }
  },
  props: {
    algorithmParam: {
      type: String,
      default: ""
    },
  },
  methods: {
    selectParamChange(selectedKeys, obj = {}) {
      // 先将编辑器里的内容，更新到当前配置的content(content是stringify化的)
      this.parseParamResult.forEach(item => {
        if(item.name === this.selectKey[0]) {
          item.content = this.$refs.jsonEditor.getValue()
        }
      })


      // 再更新 this.selectKey
      this.selectKey = selectedKeys
      const selectNode = obj.node?.dataRef || {}
      this.algorithmParamValue = selectNode.content
      this.editForm = JSON.parse(this.algorithmParamValue)
      // this.$refs.EditDataDialog.getRules(this.editForm)
    },
    /**
     * @public
     */
    getValue() {
      if(this.selectKey) { //不存在的话说明触发过selectParamChange， 编辑器里修改的值已经被记录了，这里只处理存在的情况即可
        this.parseParamResult.forEach(item => {
          if(item.name === this.selectKey[0]) {
            item.content = this.$refs.jsonEditor.getValue()
          }
        })
      }
      return this.parseParamResult
    }
  },
  created() {
    if(!this.algorithmParam) return
    this.parseParamResult = JSON.parse(this.algorithmParam)
    // this.algorithmParam.forEach(item => {
    //   item.key= `${item.name}`
    // })
    this.selectKey = [this.parseParamResult[0].name];
    this.algorithmParamValue = this.parseParamResult[0].content;
    this.editForm = JSON.parse(this.algorithmParamValue)
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
    width: 200px;
    overflow-y: auto;
    height: 42vh;
  }
  .json-editor {
    flex: 1;
    height: 50vh;
    overflow-y: auto;
  }
}
</style>