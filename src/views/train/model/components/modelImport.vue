<template>
  <a-modal
    :visible="visible"
    title="模型导入"
    @ok="handleOk"
    @cancel="handleCancel"
    :maskClosable="false"
  >
    <a-spin :spinning="loading">
      <template slot="footer">
        <a-button key="back" @click="handleCancel">
          取消
        </a-button>
        <a-button key="submit" type="primary" :loading="loading" @click="handleOk">
          确定
        </a-button>
      </template>
      <a-form-model
        :model="form"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        ref="ruleForm"
        :rules="rules"
        layout="horizontal"
      >
        <p><b>请提前将需要导入的模型文件与xls文件放入后台规定的文件夹目录下</b></p>
        <a-form-model-item label="算法类型" prop="storedDirId">
            <a-tree-select
              showSearch
              allowClear
              :filterTreeNode="fillterFUN"
              v-model="form.storedDirId"
              style="width: 100%"
              :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
              :tree-data="imageTreeData"
              :load-data="onLoadImageData"
              placeholder="请选择算法类型"
              @select="onImageSelect"
            />
          </a-form-model-item>
        <a-form-model-item label="选择算法" prop="imagesId">
            <a-select v-model="form.parentId" style="width: 60%" @change="getChildren" showSearch :filter-option="filterOption">
              <a-select-option v-for="item in imageList" :key="item.id" :value="item.id">
                {{ item.imageName }}
              </a-select-option>
            </a-select>
            <a-select v-model="form.imagesId" style="width: 40%">
              <a-select-option v-for="item in imageVersionList" :key="item.id" :value="item.id">
                {{ item.versionLabel }}
              </a-select-option>
            </a-select>
          </a-form-model-item>
        <a-form-model-item label="选择节点" prop="treeValue">
          <a-tree-select
            showSearch
            allowClear
            :filterTreeNode="fillterFUN"
            v-model="form.treeValue"
            style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
            :tree-data="treeData"
            :load-data="onLoadData"
            placeholder="请选择一个节点t"
            @select="onSelect"
          />
        </a-form-model-item>
      </a-form-model>
    </a-spin>
  </a-modal>
</template>

<script>
import { getModelTreeList, getImageMrgTreeList } from "@/api/dataCenter"
import {
  getImageManageList,
  imageVersion
} from "@/api/imageManage"
import { modelImport } from "@/api/modelManage"
export default {
  name: "modelImport",
  data () {
    return {
      visible: false,
      loading: false,
      dir: {
        storedDirId: '',
        storedDirName: '',
      },
      form: {
        storedDirId: '',
        parentId: '',
        imagesId: '',
        treeValue: '', // 请求不是这个值，这里只是为了显示再input中并校验
      },
      rules: {
        storedDirId: [{ required: true, message: '请选择算法类型', trigger: 'change' }],
        imagesId: [{ required: true, message: '请选择算法', trigger: 'change' }],
        treeValue: [{ required: true, message: '请选择节点', trigger: 'change' }],
      },
      treeData: [],
      imageTreeData: [],
      imageList: [],
      imageVersionList: []
    }
  },
  methods: {
    showModal () {
      this.visible = true
      this.getTree()
      this.getImageTree()
    },
    getTree () {
      const query = {
        parentId: "0",
        parentCode: "0"
      }
      this.treeData = []
      this.loading = true
      getModelTreeList(query).then(res => {
        const { data = [], code = 0 } = res
        this.loading = false
        if (res.code === 0) {
          this.treeData = this.genTreeNode(data)
        }
      })
    },
    getImageTree () {
      this.imageTreeData = []
      const query = {
        parentId: "0",
        dlType: 1
      }
      this.loading = true
      getImageMrgTreeList(query).then(res => {
        this.loading = false
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          this.imageTreeData = this.genImageTreeNode(data)
        }
      })
    },
    onLoadImageData (treeNode) {
      const { id, nodeCode, titleLink } = treeNode.dataRef
      const query = {
        parentId: id,
        dlType: 1,
        parentCode: nodeCode
      }
      this.loading = true
      return getImageMrgTreeList(query).then(res => {
        this.loading = false
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          treeNode.dataRef.children = this.genImageTreeNode(data, titleLink)
          this.treeData = [...this.treeData]
        }
      })
    },
    onImageSelect (checkedKeys, node) {
      this.$nextTick(() => {
        const { nodeCode, id } = node.dataRef
        this.$set(this.form, 'nodeCode', nodeCode)
        this.$set(this.form, 'nodeId', id)
        this.getImageList()
      })
    },
    onSelect (checkedKeys, node) {
      this.$nextTick(() => {
        const { storedDirId, storedDirName, id } = node.dataRef
        this.form.treeValue = storedDirName
        this.dir = {
          storedDirId, storedDirName
        }
      })
    },
    handleOk () {
      this.$refs.ruleForm.validate(async (valid) => {
        if (!valid) {
          return false
        } else {
          this.loading = true
          const params = {
            imagesId: this.form.imagesId,
            dlId: 1,
            ...this.dir
          }
          const res = await modelImport(params)
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('导入成功')
          this.handleCancel()
          this.$emit('getDataList')
        }
      })
    },
    genImageTreeNode (data, titleLink) {
      return data.map(item => {
        const { nodeName, nodeCode, id, childNodeNum } = item
        return {
          id,
          idLink: `${nodeCode}${id};`,
          titleLink: titleLink ? `${titleLink} / ${nodeName}` : nodeName,
          // value就是idLink
          value: `${nodeCode}${id};`,
          title: nodeName,
          nodeCode,
          disabled: childNodeNum !== 0,
          isLeaf: childNodeNum === 0
        }
      })
    },
    genTreeNode (data, storedDirId, storedDirName) {
      return data.map(item => {
        const { nodeName, nodeCode, id, childNodeNum } = item
        const names = storedDirName ? `${storedDirName} / ${nodeName}` : nodeName
        const ids = `${nodeCode}${id};`
        // const ids = storedDirId ? `${storedDirId}${id};` : `${id};`
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
    onLoadData (treeNode) {
      const { id, nodeCode, storedDirId, storedDirName } = treeNode.dataRef
      const query = {
        parentId: id,
        parentCode: nodeCode
      }
      this.loading = true
      return getModelTreeList(query).then((res) => {
        this.loading = false
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          treeNode.dataRef.children = this.genTreeNode(data, storedDirId, storedDirName)
          this.treeData = [...this.treeData]
        }
      })
    },
    fillterFUN (searchVal, treeNode) {
      return treeNode.data.props.title.includes(searchVal)
    },
    handleCancel () {
      this.form = {
        storedDirId: '',
        parentId: '',
        imagesId: '',
        treeValue: '',
      },
      this.$refs.ruleForm.resetFields()
      this.visible = false
    },
    async getImageList () {
      const { nodeId, nodeCode } = this.form
      const params = {
        nodeId,
        nodeCode,
        limit: 999999
      }
      this.loading = true
      const res = await getImageManageList(params)
      this.loading = false
      if (res.code !== 0) return false
      this.imageList = res.data.records
      if (this.imageList.length === 0) return false
      this.form.parentId = this.imageList[0].id
      this.getChildren(this.imageList[0].id)
    },
    async getChildren (val) {
      const record = this.imageList.filter(item => item.id === val)[0]
      this.loading = true
      const res = await imageVersion.getImageVersionList({ sourceVersionId: record.sourceVersionId })
      this.loading = false
      if (res.code !== 0) return false
      this.imageVersionList = res.data
      if (this.imageVersionList.length === 0) return false
      let i = 0
      while (i < res.data.length) {
        if (res.data[i].imageStatus === 1) {
          this.$set(this.form, 'imagesId', this.imageVersionList[i].id)
          break
        } else {
          i++
        }
      }
      this.$refs.ruleForm.validateField('imagesId')
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
  }
}
</script>

<style scoped>
</style>
