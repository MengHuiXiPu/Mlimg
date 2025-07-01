<template>
  <a-form-model
      :model="form"
      ref="ruleForm"
      :label-col="{ span: 3 }"
      :wrapper-col="{ span: 21 }"
      :rules="rules"
      layout="horizontal"
      style="max-width: 85%; margin: 20px auto 0;">
    <a-form-model-item label="算法参数">
      <a-empty v-if="!algorithmParamValue"/>
      <template v-else>
        <div class="mirror-params-list">
          <a-tree
              showLine
              :selected-keys="selectKey"
              :tree-data="algorithmParam"
              :replace-fields="replaceFields"
              @select="selectParamChange"

          ></a-tree>
          <span v-if="algorithmParamValue" style="color: #1890ff;font-size: 16px; cursor: pointer; padding-left: 6px;" @click="openDialog('open')"><a-icon type="edit" /> 参数预览</span>
        </div>
        <!-- sdk的参数编辑 -->
        <param-editor :editForm="editForm" ref="refSdkParamEditor" class="mirror-param-sdk"></param-editor>
        <!-- 老的非sdk的参数编辑，现已不需要兼容 -->
        <!-- <EditDataDialog ref="EditDataDialog" @formData="formData" :editForm="editForm" v-else></EditDataDialog> -->
      </template>
      <a-modal width="740px" class="dataDialog" v-model="visible" @ok="submit" title="超参预览">
        <!-- :disabled="modelInfoRecord.taskStatus === 1 || isSdkJson" -->
        <a-input
            v-if="algorithmParamValue"
            type="textarea"
            v-model="algorithmParamValue"
            class="text-area algorithmParam"
            disabled
        ></a-input>
      </a-modal>
    </a-form-model-item>
    <!-- <a-form-model-item label="业务参数" prop="businessParam">
      <a-input v-model="form.businessParam" type="textarea" :disabled="currentModel" />
    </a-form-model-item> -->
  </a-form-model>
</template>

<script>
import EditDataDialog from './EditDataDialog.vue'
import StepLayout from '@/components/StepLayout'
import { mapState, mapMutations } from 'vuex'
import {
  getDataSetList
} from "@/api/dataCenter"
import { getImageManageById } from '@/api/imageManage'
import ParamEditor from '@/components/business/paramSet/ParamEditor.vue'
export default {
  name: 'TrainParamSetting',
  components: {
    StepLayout,
    ParamEditor,
    EditDataDialog
  },
  data () {
    const confirmJSON = (rule, value, callback) => {
      if (!value) {
        // callback(new Error('业务参数不能为空'))
        callback()
      } else {
        if (!isNaN(value)) {
          return callback(new Error('当前参数不符合JSON规范，请重新填写'))
        }
        try {
          const jsonString = JSON.parse(value)
          callback()
        } catch (err) {
          callback(new Error('当前参数不符合JSON规范，请重新填写'))
        }
      }
    }
    return {
      editForm: {},
      visible: false,
      selectKey: [],
      labelCol: { lg: { span: 5 }, sm: { span: 5 } },
      wrapperCol: { lg: { span: 19 }, sm: { span: 19 } },
      form: {},
      algorithmParam: [],
      algorithmParamList: [],
      algorithmParamValue: '',
      rules: {
        verifyWay: { required: true, message: '请选择验证方式!', trigger: 'change' },
        verifyIds: { required: true, message: '请选择验证数据集!', trigger: 'change' },
        splitRatio: [{
          required: true, message: '请输入验证集占比!', trigger: 'blur'
        }],
        algorithmParam: [{
          required: true, message: '在此进行算法参数说明!', trigger: 'blur'
        }],
        // businessParam: [{
        //   validator: confirmJSON,
        //   trigger: 'blur'
        // }],
      },
      selectObj: {},
      replaceFields: {
        children: 'childrens',
        title: 'name'
      },
      dataSetList: [],
      recordImageID: '', // 记录选中的算法ID
    }
  },
  watch: {
    form: {
      handler(value) {
        if(Array.isArray(value.verifyIds)){
          value.verifyIds = value.verifyIds.join()
        }
        value.algorithmParam = JSON.stringify(this.algorithmParam)
        this.$store.commit('setpreParam', value)
      },
      deep: true
    }
  },
  computed: {
    ...mapState({
      preParam: state => state.model.step.preParam,
      modelInfoRecord: state => state.model.modelInfoRecord,
      currentModel: state => state.model.currentModel,
      imagesId: state => state.model.step.imagesId,
    }),
    defaultSelect() {
      return this.modelInfoRecord?.algorithmParam[0].key;
    },
    /**
     * 新增sdk中json格式，且需要兼容旧的逻辑，两者json格式不一样，且需要前端支持编辑的内容不一样，需要使用不同的组件渲染
     * 标识值， true： sdk， false： 原有算法json格式
     * 使用model_train_params， special_params， model_params这三个字段区分是不是sdk，这三个字段又可能不同时存在
     */
    // isSdkJson() {
    //   if(this.editForm.model_train_params || this.editForm.special_params || this.editForm.model_params) {
    //     return true
    //   }else {
    //     return false
    //   }
    // }
  },
  mounted () {
    this.recordImageID = this.imagesId; // 保存之前选中的算法
    console.log("TPS: ", this.recordImageID, '  ', this.imagesId, this.preParam)
    console.log("TPS this.modelInfoRecord: ", this.modelInfoRecord)

    this.form = {
      ...this.preParam,
      verifyIds: this.preParam.verifyIds ? this.preParam.verifyIds.split(',').map(item => Number(item)) : [],
      verifyWay: this.preParam.verifyWay ? Number(this.preParam.verifyWay) : 1
    }
    if (this.form.verifyIds.length === 1 && !this.form.verifyIds[0]) this.form.verifyIds.shift()
    if (this.form.algorithmParam) this.getActiveParams(this.form.algorithmParam)
    this.$nextTick(() => {
      if(this.modelInfoRecord.taskStatus > 0 || this.modelInfoRecord?.algorithmParam) {
        console.log("this.modelInfoRecord.algorithmParam: +++++", typeof this.modelInfoRecord.algorithmParam, Array.isArray(this.modelInfoRecord.algorithmParam));
        this.getActiveParams(this.modelInfoRecord.algorithmParam)
      }
      if (!this.algorithmParam.length) {
        getImageManageById(this.imagesId).then((res) => {
          if (res.code === 0) {
            this.getActiveParams(res.data.algorithmParam)
            // if (!this.form.businessParam) {
            //   this.form.businessParam = res.data.businessParam
            // }
            // this.$store.commit('setbusinessParam', res.data.businessParam)
            this.$store.commit('setStep3AlgorithmParam', res.data.algorithmParam)
          }
        })
      }
    })
  },
  async activated(){
    if(this.modelInfoRecord.taskStatus === 1) { // 模型正在训练，不能更改算法参数
      return ;
    }
    // 选择的算法变化了，更新数据集列表
    if(this.imagesId !== this.recordImageID) {
      this.recordImageID = this.imagesId;
      if (this.preParam.algorithmParam) {
        this.getActiveParams(this.preParam.algorithmParam)
      }
    }
  },
  methods: {
    ...mapMutations(['resetItem']),
    // 预览modal框confirm时，更新对应的json
    submit () {
      this.visible = false
      this.openDialog()
      this.changeAlgorithmParam()
      // if (this.$refs.EditDataDialog) {
      //   this.$refs.EditDataDialog.onSubmit()
      // }
    },
    openDialog (value) {;
      if (!this.algorithmParamValue) return
      if (value === 'open') {
        this.getformdata()
        this.visible = true
        return
      }
      this.editForm = JSON.parse(this.algorithmParamValue)
      this.$nextTick(() => {
        if (this.$refs.EditDataDialog) {
        this.$refs.EditDataDialog.getRules(this.editForm)
      }
        if(this.$refs.refSdkParamEditor) {
          this.$refs.refSdkParamEditor.initState()
        }
      })
      // this.visible = true
    },
    formData (data) {
      Object.keys(data).forEach(item => {
        if ((item == "mean" || item == "std") && Array.isArray(data[item])) {
          data[item] = data[item].map(item => {
            if(Number(item)) {
              return Number(item)
            } else {
              return item
            }
          })
        }
        if (item == "model_params") {
          if (data[item]?.mean) {
            data[item].mean = data[item].mean.map(item => {
              if(Number(item)) {
                return Number(item)
              } else {
                return item
              }
            })
          }
          if (data[item]?.std) {
            data[item].std = data[item].std.map(item => {
              if(Number(item)) {
                return Number(item)
              } else {
                return item
              }
            })
          }
        }
      })
      this.algorithmParamValue = JSON.stringify(data, null, 1)
      this.changeAlgorithmParam()
      // this.visible = false
    },
    deepCopy (obj) {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      let copy = Array.isArray(obj) ? [] : {};

      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          copy[key] = this.deepCopy(obj[key]);
        }
      }

      return copy;
    },
    getformdata () {
      // if(this.isSdkJson) {
        const data = this.$refs.refSdkParamEditor.getValue()
        this.algorithmParamValue = JSON.stringify(data, null, 1)
        this.changeAlgorithmParam()
      // }else { //原有逻辑
      // this.formData(this.deepCopy(this.$refs.EditDataDialog.editForm))
      // }
    },
    nextStep () {
      this.$refs['ruleForm'].validate((valid) => {
        if (!valid) {
          return false
        } else {
          this.form.verifyIds = this.form.verifyIds.join()
          this.form.algorithmParam = JSON.stringify(this.algorithmParam)
          this.$store.commit('setpreParam', this.form)
          this.$emit('nextStep')
        }
      })
    },
    prevStep () {
      this.$emit('prevStep')
    },
    cancel () {
      this.$emit('cancel')
    },
    selectParamChange (selectedKeys, obj) {
      if (!selectedKeys.length) return
      this.getformdata()
      this.selectKey = selectedKeys
      console.log('lwj selectedKeys：', selectedKeys, "obj: ", obj, this.algorithmParam, this.selectKey)
      this.selectObj = { ...obj.node.dataRef }
      if (this.selectObj.type !== 2) return false
      this.algorithmParamValue = this.selectObj.content
      this.openDialog()
    },
    getActiveParams (data) {
      if(typeof data === 'string') {
        data = JSON.parse(data);
      }
      const _data = data.map((item, index) => {
        // console.log("TPS item: ", item)
        if (index === 0) {
          this.selectKey = [`${index}-${item.name}`]
          this.selectObj = item
          this.algorithmParamValue = item.content
          this.openDialog()
        }
        if (item.type) {
          let children = null
          if (item.type === 1) {
            children = item.childrens.map((child, childIndex) => {
              return {
                ...child,
                key: `${index}-${childIndex}-${child.name}`
              }
            })
          }
          return {
            ...item,
            childrens: children,
            key: `${index}-${item.name}`
          }
        } else {
          const child = Object.keys(item)[0]
          return {
            name: child,
            type: 2,
            content: item[child],
            key: `${index}-${child}`
          }
        }
      })
      this.algorithmParam = _data
      console.log("TPS this.algorithmParam", this.algorithmParam)
    },
    changeAlgorithmParam () {
      this.algorithmParam.forEach(item => {
        if (item.key === this.selectKey[0]) {
          item.content = this.algorithmParamValue
        } else if (item.childrens) {
          item.childrens.forEach(child => {
            if (child.key === this.selectObj.key) {
              child.content = this.algorithmParamValue
            }
          })
        }
      })
      this.$store.commit('setStep3AlgorithmParam', JSON.stringify(this.algorithmParam))
    },
    // async getDataSetList () {
    //   const res = await getDataSetList({
    //     pageNo: 1,
    //     limit: 9999999,
    //     dlType: 1,
    //     dlTagType: this.preParam.tagType
    //   })
    //   if (res.code !== 0) return false
    //   this.dataSetList = res.data.records.filter(item => item.status === 2).map(item => {
    //     return {
    //       id: item.id,
    //       dlName: item.dlName,
    //       dlRealDir: item.dlRealDir
    //     }
    //   })
    // },
  }
}
</script>

<style lang="less" scoped>
/deep/ .ant-tree.ant-tree-show-line li span.ant-tree-switcher {
  background-color: transparent;
}
.mirror-params-list{
  margin-top: 10px;
  width: 200px;
  float: left;
  height: 50vh;
  margin-right: 10px;
  overflow-y: auto;
  border-right: 1px solid #e8e8e8;
}
.mirror-param-sdk {
  float: left;
}
/deep/ .ant-tree li .ant-tree-node-content-wrapper {
  text-overflow: ellipsis;
  overflow: hidden;
  width: calc(100% - 24px);
  &.ant-tree-node-selected{
    background: #1890ff;
    color: #fff;
  }
}
.text-area{
  height: 60vh;
  margin: 10px 0px;
  &.algorithmParam{
    // width: calc(100% - 210px);
    width: 100%;
    &.ant-input-disabled {
      color: unset;
      background: unset;
    }
  }
}
</style>
<style lang="less">
.dataDialog {
  .ant-modal {
    top: 40px;
  }
}
</style>
