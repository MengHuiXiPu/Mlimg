<template>
  <a-form-model :model="form"
                ref="ruleForm"
                :label-col="{ span: 6 }"
                :wrapper-col="{ span: 18 }"
                :rules="rules"
                layout="horizontal"
                style="max-width: 700px; margin: 20px auto 0;">
<!--    prop="preTrainModelImageId"-->
    <a-form-model-item label="请选择算法" >
      <a-select v-model="form.preTrainImageParentId"
                showSearch
                placeholder="请选择算法"
                @change="getImageChildren"
                :filter-option="filterOption"
                style="width: 50%"
                :disabled="true">
        <a-select-option v-for="item in imageList" :key="item.id" :value="item.id" :disabled="!item.atLeastOneAvl" :title="item.imageName">
          {{ item.imageName }}
        </a-select-option>
      </a-select>
      <a-select v-model="form.preTrainModelImageId"
                showSearch
                :disabled="this.modelInfoRecord.taskStatus === 1"
                placeholder="请选择算法版本"
                @change="getModelList"
                :filter-option="filterOption"
                style="width: 50%">
        <a-select-option v-for="item in imageChildrenList" :key="item.id" :value="item.id" :disabled="item.imageStatus !== 1">
          {{ item.versionLabel }}
        </a-select-option>
      </a-select>
    </a-form-model-item>
<!--    prop="preTrainModelId"-->
    <a-form-model-item label="请选择模型" >
      <a-tree-select
        allowClear
        dropdownClassName="premodel"
        v-model="form.preTrainImageId"
        :dropdown-style="{ maxHeight: '300px', overflow: 'auto' }"
        :disabled="this.modelInfoRecord.taskStatus === 1"
        placeholder="请选择模型"
        @change="getChildren"
        :filter-option="filterOption"
        style="width: 50%"
        :tree-data="treeData"
        >
        <!-- <a-select-option v-for="item in modelList" :key="item.modelId" :value="item.modelId" :disabled="!item.atLeastOneAvl" :title="item.modelName">
          {{ item.modelName }}
        </a-select-option> -->
      </a-tree-select>
      <a-select showSearch
                v-model="form.preTrainModelId"
                :disabled="this.modelInfoRecord.taskStatus === 1"
                placeholder="请选择模型版本"
                @change="getPublicList"
                :filter-option="filterOption"
                style="width: 50%">
        <a-select-option v-for="item in modelChildrenList" :key="item.id" :value="item.id" :disabled="!item.modelTrainAvl">
          {{ item.versionLabel }}
        </a-select-option>
      </a-select>
    </a-form-model-item>
    <a-form-model-item label="训练任务类型" prop="tagType" v-if="false">
      <a-input v-model="form.tagType" disabled />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import {checkImageModel, getImageManageList, imageVersion} from "@/api/imageManage";
import {fetchModelPublicCategory, modelVersion, selectDatasetSeNoAddMinMustAdd} from "@/api/modelManage";
import {mapState} from "vuex";

export default {
  name: "PreTrainModel",
  data() {
    return {
      preModelList: [],
      form: {
        needPreTrainModel: 0,
        preTrainImageParentId: '',
        preTrainModelImageId: '',
        preTrainImageId: '',
        preTrainModelId: ''
      },
      rules: {
        tagType: [{
          required: true, message: 'Please input your note!', trigger: 'blur'
        }],
        selectedType: [{
          required: true, message: '请选择类别名称!', trigger: 'change'
        }],
        preTrainModelImageId: [{
          // required: true, message: '请选择算法!', trigger: 'change'
        }],
        preTrainModelId: [{
          // required: true, message: '请选择模型!', trigger: 'change'
        }],
        needPreTrainModel: [{
          required: true, message: '请选择与训练模型!', trigger: 'change'
        }]
      },
      modelList: [],
      imageList: [],//算法列表
      imageChildrenList: [],
      modelChildrenList: [],
      indeterminate: false,
      checkAll: false,
      illegal:false,
      sortType: 2,
      wrongcodelist: [],//不能被选中的code
      wrongcodelistchecked: "",//已被选中的错误code
      mincount: 0,//所有被选中code的数据数量必须达到的最小值
      mustcodelist: [],//必须被选中的code
      mustmincount: 0,//必选code的数据数量必须达到的最小值
    }
  },
  computed: {
    ...mapState({
      step1ImageItem: state => state.model.step.step1ImageItem,
      preParam: state => state.model.step.preParam,
      modelInfo: state => state.model.modelInfoToVersion,
      modelInfoRecord: state => state.model.modelInfoRecord,
      currentModel: state => state.model.currentModel,
      imagesId: state => state.model.step.imagesId,
    }),
    treeData () {
      let modelList = this.modelList
      return [
         {
          title: '基础模型',
          value: '0-0',
          key: '0-0',
          // disabled: true,
          selectable: false,
          children: this.preModelList
         },
         {
          title: '其他模型',
          value: '0-1',
          key: '0-1',
          selectable: false,
          // disabled: true,
          children: modelList
         }
      ]
    },
  },
  watch: {
    form: {
      handler(value) {
        console.log('watch form',value);
        this.$store.commit('setpreParam', value)
      },
      deep: true,
    }
  },
  async mounted () {//挂载完后执行
    this.form.tagType = this.modelInfoRecord.tagType
    await this.getImageList(this.form.tagType) // 获取图像列表
    await this.getModel(this.form.tagType)
    console.log(this.modelInfoRecord)
    let preTrainImageParentId = this.modelInfoRecord.preTrainImageParentId || this.modelInfoRecord.imageId || ''
    let preTrainModelImageId = this.modelInfoRecord.preTrainModelImageId || this.modelInfoRecord.imageId || ''
    let  modelid = this.modelInfoRecord.preTrainModelId || this.modelInfoRecord.preTrainImageId || ''
    await this.getImageChildren(preTrainImageParentId)
    this.form.preTrainImageParentId = preTrainImageParentId
    this.form.preTrainModelImageId = preTrainModelImageId
    this.form.preTrainImageId = modelid ? modelid : ''
    this.form.needPreTrainModel = this.modelInfoRecord.needPreTrainModel
    if (!this.modelChildrenList.length && modelid) {
      this.modelChildrenList.push({
        versionLabel: "v1.0",
        id: modelid,
        modelTrainAvl: true
      })
    }
    this.form.preTrainModelId = modelid ? modelid : ''
  },
  methods: {
      getModel (type) {
      getImageManageList({
        limit: 9999999,
        imageType: 3,
        tagType: type || ''
      }).then(res => {
        if (res.code === 0) {
          this.preModelList = res.data.records.map((item) => {
            return {
              ...item,
              modelId: item.id,
              value: item.id,
              label: item.imageName,
              key: item.id,
              disabled: !item.atLeastOneAvl
            }
          })
        }
      })
    },
    filterOption(input, option) {
      return option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
    },
    async getChildren (id, label, node) {
      // 选择预训练模型选择时触发此事件，清除时id为undefined，并且label为[]
      if(id === undefined || label.length === 0){
        // needPreTrainModel重置为默认值0
        this.form.needPreTrainModel = 0;
        this.$set(this.form, 'preTrainModelId', undefined);
        // 清除模型代表不需要预训练，needPreTrainModel要置为0
        this.$store.commit('setneedPreTrainModel', 0)
        this.modelChildrenList = [];
        return false;
      }
      console.log(id, label, node);
      const res = await modelVersion.getImageVersionList({ sourceVersionId: id })
      if (res.code !== 0) return false
      this.modelChildrenList = res.data
      if (!this.modelChildrenList.length) {
        this.modelChildrenList.push({
          versionLabel: "v1.0",
          id: id,
          modelTrainAvl: true
        })
      }
      this.$refs.ruleForm.clearValidate(['preTrainModelId'])
      this.$set(this.form, 'preTrainModelId', id)
      let parent = this.getParent(this.treeData, id)
      if (parent.key === '0-1') {
        this.$store.commit('setneedPreTrainModel', 1)
        this.form.needPreTrainModel = 1
      } else {
        this.$store.commit('setneedPreTrainModel', 2)
        this.form.needPreTrainModel = 2
      }
    },
    getParent (data, targetValue) {
      for (let node of data) {
        if (node.children) {
          for (let child of node.children) {
            if (child.value === targetValue) {
              return node;
            }
          }
          const parentNode = this.getParent(node.children, targetValue);
          if (parentNode) {
            return parentNode;
          }
        }
      }
    },
    async getPublicList (value) {
      console.log("zi options getPublicList");
      const params = {
        preTrainModelId: value,
        dataListId: this.$store.state.model.step.dlId.join(',')
      }
      // console.log('getPublicList params: ', params);
      const responseData = await fetchModelPublicCategory(params)
      if (responseData.code === 0) {
        this.form.selectedType = responseData.data
      }
    },
    async getImageList (type) {
      const res = await getImageManageList({//调用api获取图片列表
        limit: 9999999,
        imageType: 1,
        tagType: type || ''
      })
      if (res.code !== 0) return false
      this.imageList = res.data.records
      this.$nextTick(() => {
        this.$refs.ruleForm.clearValidate(['preTrainModelId']);
      })
    },
    async getImageChildren (imagesId) {
      const imageArr = this.imageList.filter(item => {
        return item.id === imagesId
      })
      if (imageArr.length === 0) return false
      const sourceVersionId = imageArr[0].sourceVersionId
      const res = await imageVersion.getImageVersionList({ sourceVersionId })
      if (res.code !== 0) return false
      this.imageChildrenList = res.data
      this.form.preTrainModelImageId = this.imageChildrenList[0]?.id || ''
      this.form.preTrainImageId = ''
      this.form.preTrainModelId = ''
      await this.getModelList(imagesId)
      this.$refs.ruleForm.clearValidate(['preTrainModelId']);
    },
    async getModelList (id) {//获取模型列表
      const res = await checkImageModel(id, { filter: 1 })
      if (res.code !== 0) return false
      this.modelList = res.data.map(item => {
        return {
          ...item,
          modelId: item.id,
          value: item.id,
          label: item.modelName,
          key: item.id,
          disabled: !item.atLeastOneAvl
        }
      })
    }
  }
}
</script>

<style lang="less">
.premodel {
  .ant-select-tree {
    &>li {
      position: relative;
      &>.ant-select-tree-switcher {
        position: absolute !important;
        width: 100% !important;
        text-align: left !important;
        padding-left: 10px;
      }
      &>.ant-select-tree-node-content-wrapper {
        margin-left: 24px !important;
      }
    }
  }
}
</style>