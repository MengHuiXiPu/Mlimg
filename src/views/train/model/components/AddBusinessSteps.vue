<template>
  <div>
    <div class="addBusinessStep" :style="{height: contentHeight + 'px'}">
      <div class="addBusinessStep-header">
        <!-- <back-title title="新建业务模型" ></back-title> -->
        <div class="addBusinessStep-header-steps">
          <a-steps slot="extra" class="steps" :current="currentTab" size="small">
            <a-step title="选择业务算法" />
            <a-step title="设置参数" />
            <a-step title="完成" />
          </a-steps>
        </div>
      </div>
      <div class="addBusinessStep-content" v-if="!$route.query.parentId || ($route.query.parentId && loadVersion)">
        <template v-if="currentTab === 0">
          <!-- 步骤1：选择业务镜像 -->
          <div class="addBusinessStep-content-item start">
            <step1 :postData="postData" :selectImage="selectImage" :active="loadData" @changeSelectImage="changeSelectImage"></step1>
          </div>
        </template>
        <template v-else-if="currentTab === 1">
          <!-- 步骤2：设置参数 -->
          <step2 :selectImage="selectImage" :imageId="imageId" :postData="postData" @changeStep2Data="changeStep2Data"></step2>
        </template>
        <template v-else>
          <!-- 步骤3：完成 -->
          <div class="addBusinessStep-content-item done">
            <div class="done-top">
              <a-card
                  style="width:100%"
                  title="模型名称">
                <a-input :maxLength="50" @blur="checkName" :disabled="loadVersion" v-model="done.modelName" placeholder="请输入模型名称"/>
                <p v-if="showCheckName" style="color: red">当前名称已存在，请重新输入</p>
              </a-card>
            </div>
            <div class="done-bottom">
              <a-card
                  style="width:100%"
                  title="选择目录">
                <a-tree-select
                    v-model="done.storedDirName"
                    showSearch
                    allowClear
                    :filterTreeNode="fillterFUN"
                    style="width: calc(100% - 70px)"
                    :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
                    :tree-data="treeData"
                    :load-data="onLoadData"
                    placeholder="请选择存放目录"
                    @select="onSelect"
                    :disabled="loadVersion"
                />
                <a-button
                    size="small"
                    @click="() => this.$refs.createTree.showModal()"
                    class="addNode"
                    type="primary">
                  新增目录
                </a-button>
              </a-card>
              <div class="done-bottom">
                <a-card
                    style="width:100%"
                    title="描述信息"
                >
                  <a-textarea v-model="done.modelDescription" />
                </a-card>
              </div>
            </div>
          </div>
        </template>
      </div>
      <div class="addBusinessStep-footer">
        <a-button v-if="this.currentTab !== 0" type="text" @click="prevStep">上一步</a-button>
        <a-button v-if="this.currentTab !== 2" :disabled="this.postData.imagesId === 0" type="primary" @click="nextStep">下一步</a-button>
        <a-button
            v-if="this.currentTab === 2"
            type="primary"
            @click="startTraining"
            :disabled="this.done.modelName === '' || this.done.storedDirName === ''"
            :loading="saveLoading">完成</a-button>
      </div>
      <create-tree
          ref="createTree"
          @getTree="getTree"
          :urlObject="{
        get: 'getModelTreeList',
        post: 'savaModelTreeList'
      }" />
    </div>
  </div>

</template>

<script>
import step1 from './../addBusinessStep/step1'
import step2 from './../addBusinessStep/step2'
import { getModelTreeList } from '@/api/dataCenter'
import { startTrainIM, checkModelNameAvl, getBusinessModelManageInfo } from '@/api/modelManage'
import createTree from '@/components/tree/createTree'
import bus from '@/utils/bus'
export default {
  name: 'AddBusinessSteps',
  components: {
    step1,
    step2,
    createTree
  },
  data () {
    return {
      currentTab: 0,
      url: "/train/model",
      done: {
        modelName: '',
        storedDirName: '',
        storedDirId: '',
        modelDescription: ''
      },
      treeData: [],
      postData: {
        imagesId: 0
      },
      loadData: false,
      selectImage: null,
      saveLoading: false,
      showCheckName: false,
      loadVersion: false,
      imageId: null,
      contentHeight: 0,
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      if (vm.active !== vm.$route.query.active) {
        vm.currentTab = 0
        vm.active = vm.$route.query.active
        vm.postData = {
          imagesId: null
        }
        vm.selectImage = null
        vm.done = {
          modelName: '',
          storedDirName: '',
          storedDirId: '',
          modelDescription: ''
        }
        vm.loadVersion = false
        vm.$store.commit('setmodelInfoToVersion', null)
        if (vm.$route.query.parentId) {
          vm.getModelInfo(vm.$route.query.parentId)
        } else {
          vm.loadData = true
        }
      }
    })
  },
  beforeRouteLeave (to, from, next) {
    this.loadData = false
    next()
  },
  mounted () {
    this.$store.commit('setmodelType', '2')
    this.getTree()
    this.$nextTick(() => {
      const windowHeight = window.innerHeight;
      // const headerHeight = this.$refs.headerContent.offsetHeight;
      this.contentHeight = windowHeight  - 24 - 87-32; //32是内容区的外边距
    });
  },
  methods: {
    getTree () {
      const query = {
        parentId: 0,
        parentCode: '0;'
      }
      this.treeData = []
      getModelTreeList(query).then(res => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          this.treeData = this.genTreeNode(data)
        }
      })
    },
    async getModelInfo (id) {
      const res = await getBusinessModelManageInfo(id)
      if (res.code !== 0) return false
      this.$store.commit('setmodelInfoToVersion', res.data)
      const { imagesId, modelName, storedDirName, storedDirId, externalDepend,
        algorithmParam, businessParam, modelDepend, parentVersionId } = res.data
      this.postData = {
        imagesId,
        externalDepend,
        algorithmParam,
        businessParam,
        modelDepend,
        parentVersionId
      }
      this.done = {
        modelName,
        storedDirName,
        storedDirId
      }
      this.loadData = true
      this.loadVersion = true
      this.imageId = imagesId
    },
    onSelect (checkedKeys, node) {
      this.$nextTick(() => {
        this.done.storedDirName = node.dataRef.storedDirName
        this.done.storedDirId = node.dataRef.storedDirId
      })
    },
    nextStep () {
      let type = true
      if (this.currentTab === 0) {
        if(this.selectImage === null) {
          this.$message.warning('请选择业务算法')
          return false;
        }
        if (this.postData.imagesId !== this.selectImage.id) {
          this.postData = {
            imagesId: this.selectImage.id
          }
        }
      }
      if (this.currentTab === 1) {
        if (!this.postData.imagesId) {
          this.$message.error('请选择业务算法')
          return false
        }
        JSON.parse(this.postData.modelDepend).some(item => {
          if (item.value === '') {
            type = false
            return item.value === ''
          }
        })
      }
      if (this.postData.businessParam) {
        if (!isNaN(this.postData.businessParam)) {
          this.$message.error('业务参数不符合JSON规范，请重新填写')
          return false
        }
        try {
          const data = JSON.parse(this.postData.businessParam)
        } catch (err) {
          this.$message.error('业务参数不符合JSON规范，请重新填写')
          return false
        }
      }
      if (!type) {
        this.$message.warning('请选择依赖通用模型')
        return false
      }
      this.$forceUpdate()
      if (this.currentTab < 3) {
        this.currentTab += 1
      }
    },
    prevStep () {
      if (this.currentTab > 0) {
        this.currentTab -= 1
      }
    },
    changeSelectImage (params) {
      this.$set(this.postData, 'imagesId', params.id)
      this.postData.imagesId = params.id
      this.selectImage = params.selectImage
    },
    changeStep2Data (params) {
      this.imageId = params.imageId
      this.postData.externalDepend = JSON.stringify(params.externalList)
      this.postData.algorithmParam = params.algorithmParams
      this.postData.traceNo = params.traceNo
      this.postData.businessParam = params.businessParam
      this.postData.modelDepend = JSON.stringify(params.universalMirrorList.map(item => {
        return {
          ...item,
          list: item.list ? item.list.filter(child => {
            return child.id === item.id
          }) : []
        }
      }))
    },
    onLoadData (treeNode) {
      const { id, nodeCode, storedDirName, storedDirId } = treeNode.dataRef
      const query = {
        parentId: id,
        parentCode: nodeCode
      }
      return getModelTreeList(query).then((res) => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          treeNode.dataRef.children = this.genTreeNode(data, storedDirName, storedDirId)
          this.treeData = [...this.treeData]
        }
      })
    },
    fillterFUN (searchVal, treeNode) {
      return treeNode.data.props.title.includes(searchVal)
    },
    genTreeNode (data, storedDirName, storedDirId) {
      return data.map(item => {
        const { nodeName, nodeCode, id, childNodeNum } = item
        const names = storedDirName ? `${storedDirName} / ${nodeName}` : nodeName
          const ids = `${nodeCode}${id};`
        return {
          id,
          storedDirId: ids,
          storedDirName: names,
          value: ids, // value 设置为ids
          title: nodeName,
          nodeCode,
          // disabled: childNodeNum !== 0,
          isLeaf: childNodeNum === 0
        }
      })
    },
    async checkName () {
      if (this.loadVersion) return false
      const name = this.done.modelName
      const checkData = await checkModelNameAvl({
        modelName: name,
        modelType: 2
      })
      if (checkData.code === 0) this.showCheckName = !checkData.data
    },
    startTraining () {
      if (!this.done.modelName) {
        this.$message.warning('模型名称不能为空')
        return false
      }
      if (!this.done.storedDirName) {
        this.$message.warning('请选择一个目录')
        return false
      }
      if (this.showCheckName) {
        this.$message.warning('当前名称已存在，请重新输入')
        return false
      }
      const data = {
        ...this.postData,
        ...this.done,
        modelType: 2,
        isPublish: 1,
        taskStatus: 1,
        tagType: this.selectImage.tagType
      }
      this.saveLoading = true
      startTrainIM(data).then(res => {
        this.saveLoading = false
        if (res.code === 0) {
          bus.$emit('reloadModel', '2')
          this.postData = {}
          this.active = 0
          this.$router.push('/train/model')
        }
      })
    }
  }
}
</script>

<style lang="less">
@import "~@/config/theme.less";
.addBusinessStep-header {
  padding: 15px 20px 5px;
}
.addBusinessStep{
  position: relative;
  height: 100%;
  padding: 10px;
  background-color: #fff;
  padding: 10px;
  border-radius: @borderRadiusBig;
  &-header{
    border-bottom: 1px solid #ccc;
    padding-bottom: 0;
    position: relative;
    &-steps{
      .steps{
        width: 80%;
        margin: 0 auto 15px auto;
      }
    }
  }
  &-content{
    .done{
      &-top{
        .tcl-card{
          &-body{
            padding: 10px !important;
          }
        }
      }
      &-bottom{
        .tcl-card{
          &-body{
            padding: 10px 24px !important;
          }
        }
      }
    }
    &-item{
      &:not(.start){
        border-bottom: 1px solid #ccc;
        height: calc(100vh - 265px);
        overflow: auto;
        padding: 15px 15vw 0 15vw;
        .tcl-card{
          width: 100%;
          margin-bottom: 5px;
          &.bottom{
            border-bottom: 1px solid #e8e8e8;
            padding-bottom: 10px;
          }
          &-head{
            min-height: auto;
            padding-left: 15px;
            background: #4064dfcc;
            color: #fff;
            &-title{
              padding: 5px 0;
            }
          }
          &-body{
            padding: 0px 24px;
          }
        }
      }
    }
  }
  &-footer{
    position: absolute;
    left: 50%;
    bottom: 10px;
    transform: translateX(-50%);
    button{
      margin-right: 20px
    }
  }
}
</style>