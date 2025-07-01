<template>
  <a-modal
    :visible="visible"
    :title="createForm.id ? '修改模型组' : '新增模型组'"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    @ok="createData"
    width="800px"
    @cancel="cancelCreateData"
    :maskClosable="false"
  >
    <a-form-model
      :model="createForm"
      ref="ruleForm"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :rules="rules"
      layout="horizontal"
    >
      <a-form-model-item label="名称" prop="groupName">
        <a-input v-model="createForm.groupName" />
      </a-form-model-item>
      <a-form-model-item class="form-model-item-title" label="子模型">
        <template v-if="createForm.modelList && createForm.modelList.length > 0">
          <span class="title">类型</span>
          <span class="title">模型</span>
          <span class="title">版本</span>
        </template>
        <span @click="addModel" style="cursor: pointer;font-size: 18px" v-if="createForm.modelList && createForm.modelList.length === 0">
          <a-icon type="plus-circle" theme="twoTone" two-tone-color="#52c41a" />
        </span>
      </a-form-model-item>
      <a-form-model-item
        v-for="(item, index) in createForm.modelList"
        :key="index"
        :label="item.name"
        :prop="'modelList.' + index + '.version'"
        :rules="{
          required: true,
          message: '请选择子模型信息',
          trigger: 'change',
        }"
        class="code"
        >
        <a-select v-model="item.type" @change="changeModelType(index)" :disabled="createForm.id && createForm.isPublish === 2">
          <a-select-option :value="1">通用模型</a-select-option>
          <a-select-option :value="2">业务模型</a-select-option>
        </a-select>
        <a-select
          v-model="item.model"
          show-search
          :filter-option="filterOption"
          @change="getChildren($event, item.type, index, 'active')"
          :disabled="createForm.id && createForm.isPublish === 2">
          <a-select-option
            v-for="model in modelList[item.type]"
            :key="model.id"
            :value="model.id"
            :title="model.modelName"
            :disabled="!model.atLeastOneAvl">
            {{ model.modelName }}
          </a-select-option>
        </a-select>
        <a-select v-model="item.version" :disabled="createForm.id && createForm.isPublish === 2">
          <a-select-option v-for="version in item.modelVersionList" :key="version.id" :value="version.id" :disabled="!version.modelTrainAvl">
            {{ version.versionLabel }}
          </a-select-option>
        </a-select>
        <span class="action" v-if="!(createForm.id && createForm.isPublish === 2) && index === createForm.modelList.length - 1">
          <span @click="deleteModel(index)">
            <a-icon type="minus-circle" theme="twoTone" two-tone-color="red" />
          </span>
          <span @click="addModel">
            <a-icon type="plus-circle" theme="twoTone" two-tone-color="#52c41a" />
          </span>
        </span>
      </a-form-model-item>
      <a-form-model-item label="说明">
        <a-input type="textarea" v-model="createForm.remark" />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import { getModelTableList, modelVersion, modelGroup } from '@/api/modelManage'
export default {
  name: 'addModelGroup',
  data () {
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        return callback(new Error('当前值不能为空'))
      } else {
        return callback()
        // if (value === this.modelName) return callback()
        // const checkData = await newImage.checkmodelName({
        //   modelName: value
        // })
        // if (checkData.data) {
        //   return callback()
        // } else {
        //   return callback(new Error('当前名称已存在，请重新输入'))
        // }
      }
    }
    return {
      visible: false,
      createForm: {},
      createModel: {},
      modelName: '',
      rowId: null,
      loading: false,
      rules: {
        groupName: [{ required: true, validator: checkName, trigger: 'blur' }]
      },
      modelList: {}
    }
  },
  mounted () {
  },
  methods: {
    async showModal (record) {
      this.visible = true
      await this.getModelList()
      if (record) {
        const { groupName, remark, subModelList, id, isPublish } = record
        this.createForm = {
          id,
          groupName,
          remark,
          isPublish,
          modelList: subModelList.map((item, index) => {
            this.getChildren(item.id, item.modelType, index)
            return {
              model: item.parentVersionId,
              modelVersionList: [],
              type: item.modelType,
              version: item.id
            }
          })
        }
      } else {
        this.createForm = {
          groupName: '',
          modelList: [],
          remark: ''
        }
      }
      this.modelName = record?.groupName
    },
    addModel () {
      if (this.createForm.modelList.length === 5) {
        this.$message.warning('模型组最多包含五个子模型')
        return false
      }
      this.createForm.modelList.push({
        type: '',
        model: '',
        version: ''
      })
    },
    deleteModel (index) {
      this.createForm.modelList.splice(index, 1)
    },
    createData () {
      this.$refs.ruleForm.validate(async valid => {
        if (!valid) return false
        if (this.createForm.modelList.length < 2) {
          this.$message.warning('模型组最少需要两个子模型')
          return false
        }
        this.loading = true
        this.$set(this.createForm, 'subModels', JSON.stringify(this.createForm.modelList.map(item => item.version)))
        const method = this.createForm.id ? 'put' : 'post'
        const res = await modelGroup.addModelGroup(this.createForm, method)
        this.loading = false
        if (res.code !== 0) return false
        this.$message.success(this.createForm.id ? '修改成功' : '新建成功')
        this.$emit('getDataList')
        this.cancelCreateData()
      })
    },
    cancelCreateData () {
      this.createForm = {}
      this.visible = false
    },
    async getModelList () {
      const params = {
        limit: 9999999,
        pageNo: 1,
      }
      this.loading = true
      const defaultData = getModelTableList({
        ...params,
        modelType: 1,
      })
      const businssData = getModelTableList({
        ...params,
        modelType: 2,
      })
      const defaultRes = await defaultData
      const businssRes = await businssData
      this.loading = false
      if (defaultRes.code === 0) {
        this.modelList[1] = defaultRes.data.records
      }
      if (businssRes.code === 0) {
        this.modelList[2] = businssRes.data.records
      }
    },
    changeModelType (index) {
      this.$set(this.createForm.modelList, index, {
        ...this.createForm.modelList[index],
        modelVersionList: [],
        version: '',
        model: ''
      })
      this.$refs.ruleForm.clearValidate('modelList.' + index + '.version')
    },
    async getChildren (id, modelType, index, type) {
      const model = this.modelList[modelType].filter(item => {
        return item.id === id
      })[0]
      this.loading = true
      const res = await modelVersion.getImageVersionList({ sourceVersionId: model.sourceVersionId })
      this.loading = false
      if (res.code !== 0) return false
      this.$set(this.createForm.modelList, index, {
        ...this.createForm.modelList[index],
        modelVersionList: res.data,
        // version: res.data[0].id
      })
      if (type) {
        let i = 0
        while (i < res.data.length) {
          if (res.data[i].modelTrainAvl) {
            this.$set(this.createForm.modelList[index], 'version', res.data[i].id)
            break
          } else {
            i++
          }
        }
      }
      this.$refs.ruleForm.clearValidate('modelList.' + index + '.version')
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
  }
}
</script>

<style lang="less" scoped>
/deep/ .ant-form{
  .form-model-item-title{
    .ant-form-item-label{
      text-align: left;
      padding-left: 10px;
      overflow: inherit;
      label{
        font-weight: bold;
        font-size: 16px;
        &::before{
          content: '';
          position: absolute;
          left: -8px;
          top: 0;
          width: 3px;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
        }
        &::after{
          content: '';
        }
      }
    }
    .ant-form-item-control-wrapper{
      .ant-form-item-children{
        .title{
          width: 30%;
          display: inline-block;
          text-align: center;
        }
      }
    }
  }
  .code{
    padding-left: 120px!important;
    .ant-select{
      width: 30%;
      padding-right: 10px;
      font-size:12px
    }
    .action{
      width: 10%;
      font-size: 18px;
      &>span{
        cursor: pointer;
        margin-right: 5px;
      }
    }
  }
}
</style>