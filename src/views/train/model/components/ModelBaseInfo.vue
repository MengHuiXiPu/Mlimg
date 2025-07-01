<template>
  <div>
    <a-form-model :model="form"
                  ref="ruleForm"
                  :label-col="{ span: 6 }"
                  :wrapper-col="{ span: 18 }"
                  :rules="rules"
                  layout="horizontal"
                  style="max-width: 700px; margin: 20px auto 0;">
      <a-form-model-item label="模型名称" prop="modelName">
        <!--            :disabled="modelInfo"-->
        <a-input
            :disabled="currentModel"
            v-model="form.modelName"
            :maxLength="50"
            placeholder="请输入模型名称"
        />
      </a-form-model-item>

      <a-form-model-item label="存放目录" prop="storedDirName" style="vertical-align: middle">
        <a-tree-select
            v-model="form.storedDirName"
            showSearch
            allowClear
            :filterTreeNode="fillterFUN"
            style="width: calc(100% - 70px)"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
            :tree-data="treeData"
            :load-data="onLoadData"
            placeholder="请选择存放目录"
            @select="onSelect"
            :disabled="currentModel"
        />
        <a-button
            :disabled="currentModel"
            size="small"
            @click="() => this.$refs.createTree.showModal()"
            class="addNode"
            type="primary">
          新增目录
        </a-button>
      </a-form-model-item>
      <a-form-model-item label="描述信息">
        <a-textarea v-model="form.modelDescription" :disabled="currentModel"/>
      </a-form-model-item>
    </a-form-model>
    <create-tree ref="createTree"
                 @getTree="getTree"
                 :urlObject="{
      get: 'getModelTreeList',
      post: 'savaModelTreeList'
    }" />
  </div>
</template>

<script>
import {mapState} from "vuex";
import createTree from '@/components/tree/createTree'
import {getModelTreeList, savaModelTreeList} from "@/api/dataCenter";
import {checkModelNameAvl} from "@/api/modelManage";

export default {
  name: "ModelBaseInfo",
  components: {
    createTree,
  },
  props: ['form'],
  data() {
    const dataSouce = { ...this.$store.state.model.step.dataSouce }
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        callback(new Error('当前值不能为空'))
      } else {
        if (this.modelInfo) return callback()
        const checkData = await checkModelNameAvl({
          modelName: value,
          modelType: this.step.modelType
        })
        console.log("checkData: ", checkData);
        if (checkData.data) {
          callback()
        } else {
          callback(new Error('当前名称已存在，请重新输入'))
        }
      }
    }
    return {
      labelCol: { lg: { span: 5 }, sm: { span: 5 } },
      wrapperCol: { lg: { span: 19 }, sm: { span: 19 } },
      treeData: [],
      storedDirId: dataSouce.storedDirId,
      rules: {
        modelName: [{
          required: true,
          message: '请输入模型名称!',
          trigger: 'blur'
        }, {
          required: true,
          validator: checkName,
          trigger: "blur"
        }],
        storedDirName: [{ required: true, message: '请选择存放目录!', trigger: 'change' }],
      },
      // form: {
      //   modelName: '',
      //   storedDirName: '',
      //   modelDescription: '',
      //   storedDirId: this.storedDirId,
      // },
    }
  },
  computed: {//用计算方法
    ...mapState({//从vuex store中获取分步表单的数据
      step: state => state.model.step,
      dataSouce: state => state.model.step.dataSouce,
      preParam: state => state.model.step.preParam,
      modelInfo: state => state.model.modelInfoToVersion,
      parentId: state => state.model.step.parentId,
    }),
    currentModel() {
      return this.$store.state.model.currentModel;
    },
    modelInfoRecord() {
      return this.$store.state.model.modelInfoRecord;
    },
    storedDirId() {
      console.log("computed!!!!!!")
      if(this.form.storedDirName) {
        let index = this.treeData.findIndex(item => item.storedDirName === this.form.storedDirName);
        // console.log("index: ", index);
        if(index !== -1) {
          // console.log("this.treeData[index].storedDirId: ", this.treeData[index].storedDirId)
          this.form.storedDirId = this.treeData[index].storedDirId;
          console.log('this.form.storedDirId: ', this.form.storedDirId)
          return this.treeData[index].storedDirId;
        }
      }
      return ''
    }
  },
  watch: {
    storedDirId(value){
      console.log("storedDirId++++++: ", value)
      this.form.storedDirId = value;
    }
    // form: {
    //   handler(value) {
    //     console.log("value++++++++++++++: ", value)
    //     if(value.storedDirName) {
    //       let index = this.treeData.findIndex(item => item.storedDirName === value.storedDirName);
    //       // console.log("index: ", index);
    //       if(index !== -1) {
    //         // console.log("this.treeData[index].storedDirId: ", this.treeData[index].storedDirId)
    //         value.storedDirId = this.treeData[index].storedDirId;
    //       }
    //     }
    //     this.$store.commit('setModelInfo', value);
    //     const info = {
    //       modelName: value.modelName,
    //       storedDirName: value.storedDirName,
    //       modelDescription: value.modelDescription,
    //       storedDirId: value.storedDirId
    //     }
    //     localStorage.setItem("info", JSON.stringify(info))
    //   },
    //   deep: true, // 深度观察对象的变化
    // }
  },
  mounted(){
    this.getTree();
    this.$nextTick(() => {
      if(this.modelInfoRecord.taskStatus > 0) {
        this.form.modelName = this.modelInfoRecord.modelName
        this.form.storedDirName = this.modelInfoRecord.storedDirName
        this.form.modelDescription = this.modelInfoRecord.modelDescription
      }
    })
  },
  methods: {
    fillterFUN (searchVal, treeNode) {
      return treeNode.data.props.title.includes(searchVal)
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
    onSelect (checkedKeys, node) {
      this.$nextTick(() => {
        this.form.storedDirName = node.dataRef.storedDirName
        this.storedDirId = node.dataRef.storedDirId
      })
    },
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
          console.log("this.treeData+++++: ", this.treeData);
        }
      })
    },
    genTreeNode (data, storedDirName, storedDirId) {
      return data.map(item => {
        const { nodeName, nodeCode, id, childNodeNum } = item;
        const names = storedDirName ? `${storedDirName} / ${nodeName}` : nodeName;
        const ids = `${nodeCode}${id};`;
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
  }
}
</script>

<style scoped>

</style>