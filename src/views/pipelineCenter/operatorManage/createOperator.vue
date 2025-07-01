<template>
  <a-modal title="上传算子" :visible="isShow" :closable="false" :maskClosable="false" :keyboard="false" :destroyOnClose="true"
    @ok="handleOk" @cancel="handleCancel" width="600px" :confirm-loading="loading">
    <a-form-model ref="operatorForm" :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }" layout="horizontal"
      :model="rowData" :rules="rules" class="create-operator-form">
      <a-form-model-item label=" ">
        <!-- 算子更新时，禁用该选项 -->
        <a-radio-group v-model="rowData.uploadType" :disabled="Boolean(rowData.id)">
          <a-radio :value="0"> 单个上传</a-radio>
          <a-radio :value="1">批量上传</a-radio>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item label="算子名称:" prop="listDisplayName" v-if="rowData.uploadType === 0">
        <a-input :maxLength="50" v-model="rowData.listDisplayName" />
      </a-form-model-item>
      <a-form-model-item label="算子文件:" prop="fileName">
        <a-input v-model="rowData.fileName" disabled>
          <a-upload slot="addonAfter" :showUploadList="false" :before-upload="beforeUpload" accept=".zip">
            <a-button type="default"><a-icon type="upload"></a-icon>上传文件</a-button>
          </a-upload>
        </a-input>
        <div>点击
          <a-popover title="文档算子文件说明" destroyTooltipOnHide placement="topLeft">
            <template slot="content">
              <p class="example">说明内容待补充</p>
            </template>
            <el-link type="primary" :underline="false" style="vertical-align: bottom;">查看算子规范</el-link>
          </a-popover>
          文档
        </div>
      </a-form-model-item>
      <a-form-model-item label="算子类型:" prop="typeId">
        <a-select v-model="rowData.typeId">
          <div slot="dropdownRender" slot-scope="menu">
            <v-nodes :vnodes="menu" />
            <a-divider style="margin: 4px 0;" />
            <div style="padding: 4px 8px; cursor: pointer;" @mousedown="e => e.preventDefault()" @click="addTypeItem">
              <a-icon type="plus" style="vertical-align: 3px;" /> 新增类型
            </div>
          </div>
          <a-select-option v-for="item in typeList" :key="item.nodeCode" :value="item.id">
            {{ item.nodeName }}
          </a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item label="备注:" prop="remark">
        <a-textarea v-model="rowData.remark" :auto-size="{ minRows: 2, maxRows: 4 }" />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import Operator from "@/api/operator";
export default {
  components: {
    VNodes: {
      functional: true,
      render: (h, ctx) => ctx.props.vnodes,
    },
  },
  data() {
    return {
      loading: false,
      rowData: {
        id: null, //仅重新上传时会被赋值 存在
        fileName: "",
        operatorFile: null, // 上传文件
        uploadType: 0,
        remark: "",
        listDisplayName: '',
        typeId: '', //算子类型
      },
      rules: {
        listDisplayName: [
          { required: true, message: "请输入算子名称", trigger: "blur" },
          { pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/, message: '名称只能包含字母、数字、下划线和中文' },
          { max: 12, message: '名称不能超过 128 个字符' }
        ],
        typeId: [
          { required: true, message: "请选择算子类型", trigger: "change" }
        ],
        fileName: [
          { required: true, message: "请上传算子压缩包", trigger: "change" }
        ]
      },
      typeList: [], //算子类型列表
    }
  },
  props: {
    isShow: {
      type: Boolean,
      default: false
    },
  },
  methods: {
    beforeUpload(file) {
      this.rowData.fileName = file.name;
      this.rowData.operatorFile = file;
      return false;
    },
    async addTypeItem() {
      const resopnse = await this.$prompt('请输入类型名称', '新增类型', {
        inputPattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/,
        inputErrorMessage: '类别名称只能包含字母、数字、下划线和中文'
      })
      if (!resopnse?.value) return this.$message.warning('未输入名称， 无法创建配置')
      const params = {
        level: 1,
        nodeName: resopnse.value,
        parentCode: "0",
        parentId: 0,
      }
      const res = await Operator.createOperatorType(params)
      if (res.code == 0) {
        this.$message.success("已保存")
        this.queryTypeList()
      }
    },
    handleOk() {
      this.$refs["operatorForm"].validate((valid) => {
        if (valid) {
          const formData = new FormData();
          const { id, uploadType, operatorFile, listDisplayName, typeId, remark } = this.rowData;
          formData.append("file", operatorFile);
          formData.append('param', new Blob([JSON.stringify({
            listDisplayName, remark, typeId
          })], {
            type: 'application/json'
          }))
          const method = id ? "updateOperator" : uploadType == 1 ? "operatorBatchImport" : "operatorImport"; //id存在，说明是单个算子更新， 不存在时根据uploadType判断是批量还是单个上传
          if (id) {
            formData.append("id", new Blob([id], { type: "application/json" }));
          }
          const enctypeOpt = {
            "Content-Type": "multipart/form-data",
          };
          this.loading = true
          Operator[method](formData, enctypeOpt).then((res) => {
            if (res.code == 0) {
              this.$emit("reloadData")
              this.handleCancel()
              if (id) {
                this.$message.success('更新算子成功')
              } else {
                this.$message.success('上传算子成功')
              }
              // 后端要求在批量导入时显示返回的提示信息
              if (method == "operatorBatchImport") {
                this.$message.success(res.data);
              }
            }
          }).finally(() => {
            this.loading = false
          })
        }
      });
    },
    handleCancel() {
      this.$emit("update:isShow", false)
    },
    /**
     * @public, 该组件用于新建算子和重新上传算子(原有的更新算子功能)
     * @param {*} data 
     */
    initState(data) {
      if (data) {
        this.rowData.id = data.id;
        this.rowData.listDisplayName = data.listDisplayName
        this.rowData.remark = data.remark
        this.rowData.typeId = data.typeId
      }
    },
    queryTypeList() {
      Operator.getOperatorTypeList({
        parentId: 0
      }).then((res) => {
        this.typeList = res.data;
      });
    }
  },
  created() {
    this.queryTypeList()
  }
}
</script>

<style lang="less" scoped>
.create-operator-form {
  padding-right: 40px;

  ::v-deep .ant-input-group-addon {
    border: none;
  }

  ::v-deep .ant-input-group-addon {
    border: none;
    background-color: transparent;
  }

  // 去除a-form label给默认加的冒号
  ::v-deep .ant-form-item-label>label::after {
    content: " "
  }
}
</style>