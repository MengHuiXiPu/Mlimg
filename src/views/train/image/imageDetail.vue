<template>
  <div class="page-content">
    <a-spin :spinning="loading">
      <a-card>
        <h1 style="margin-bottom: 20px">名称: {{ imageData.name }}</h1>
        <p>创建用户： {{ imageData.createBy }}</p>
        <p>创建时间： {{ imageData.createTime | moment }}</p>
        <p>镜像说明：{{ imageData.description }}</p>
      </a-card>
      <h3 class="h3">依赖包列表
          <span class="image-name" style="cursor: pointer;float: right;" @click="showAddPackage = true">添加</span></h3>
      <a-table
          :columns="columns"
          :data-source="tableData"
          :pagination="pagination"
          @change="tableDataChange"
          :rowKey="(record, index) => index"
        >
        </a-table>
    </a-spin>
    <a-modal
      :visible="showAddPackage"
      title="新增安装包"
      :ok-button-props="{ props: {
        disabled: saveLoading,
        loading: saveLoading
      }}"
      @ok="savePackage"
      width="570px"
      @cancel="cancelCreateData"
      :maskClosable="false"
    >
      <div class="packageList">
        <a-form-model
          :model="packageForm"
          ref="ruleForm"
          :col="1"
          :row="20"
          layout="horizontal"
        >
          <a-form-model-item
            v-for="(item, index) in packageForm.packList"
            :key="item.name"
            :label="item.name">
            <a-input :maxLength="50" v-model="item.value">
              <span slot="addonAfter" @click="deletePackage(index)">
                <a-icon type="close" />
              </span>
            </a-input>
          </a-form-model-item>
          <a-form-model-item hidden></a-form-model-item>
        </a-form-model>
      </div>
      <a-form-model
        :model="packageForm"
        ref="createPackage"
        :rules="packageRule"
        layout="inline"
        :label-col="{ span: 9 }"
        :wrapper-col="{ span: 15 }"
        >
        <a-row>
          <a-col :span="12">
            <a-form-model-item label="安装包" prop="name">
              <a-input v-model="packageForm.name" placeholder="请输入安装包名">
              </a-input>
            </a-form-model-item>
          </a-col>
          <a-col :span="8">
            <a-form-model-item label="版本号" prop="value">
              <a-input v-model="packageForm.value" placeholder="请输入版本号" />
            </a-form-model-item>
          </a-col>
          <a-col :span="4">
            <a-form-model-item :label-col="{ span: 0 }">
              <a-button type="dashed" icon="plus" @click="addPackage">添加</a-button>
            </a-form-model-item>
          </a-col>
        </a-row>
      </a-form-model>
    </a-modal>
  </div>
</template>

<script>
import { newImage } from '@/api/imageManage'
export default {
  name: "ImageDetail",
  data () {
    const check = (rule, value, callback) => {
      const regex = /[,\,:]/
      if (regex.test(value)) {
        return callback(new Error('不能输入","和":"'))
      }
      callback()
    }
    return {
      loading: false,
      showAddPackage: false,
      saveLoading: false,
      packageForm: {
        packList: [],
        name: '',
        value: ''
      },
      packageRule: {
        name: [{ required: true, message: '当前值不能为空', trigger: 'blur' },
        { required: true, validator: check, trigger: 'blur' }],
        value: [{ required: true, message: '当前值不能为空', trigger: 'blur' },
        { required: true, validator: check, trigger: 'blur' }]
      },
      rules: [],
      imageData: {
        name: '',
        createBy: '',
        createTime: '',
        description: ''
      },
      tableData: [
        // {
        //   id: 1,
        //   pkgName: 'opencv',
        //   pkgVersion: '1.1.0'
        // },
        // {
        //   id: 1,
        //   pkgName: 'opencv',
        //   pkgVersion: '1.2.0'
        // }
      ],
      columns: [
        {
          title: "安装包",
          dataIndex: "pkgName",
          key: "pkgName",
          ellipsis: true,
          align: 'center'
        },
        {
          title: "版本号",
          dataIndex: "pkgVersion",
          ellipsis: true,
          key: "pkgVersion",
          align: 'center'
        },
      ],
      pagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`
        }
      },
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.loading = true
      vm.getImage(to.query.id)
      vm.getPackageList({
        id: to.query.id,
        pageSize: 10,
        pageNo: 1
      })
    })
  },
  mounted () {
  },
  methods: {
    tableDataChange (pagination, filters, sorter) {
      this.getPackageList({
        id: this.imageData.id,
        pageSize: pagination.pageSize,
        pageNo: pagination.current
      })
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
    async getImage (params) {
      const res = await newImage.getImage(params)
      if (!res.code === 0) return false
      this.imageData = res.data
      this.loading = false
    },
    async getPackageList (params) {
      const res = await newImage.getPackageList(params)
      if (!res.code === 0) return false
      this.tableData = res.data.pkgData || []
      this.pagination.total = res.data.total
      this.loading = false
    },
    async savePackage () {
      if (this.packageForm.packList.length === 0) {
        this.$message.warning('当前新增安装包列表为空')
        this.cancelCreateData()
        return false
      }
      const params = {
        id: this.imageData.id,
        pkgInfo: this.packageForm.packList.map(item => {
          return item.name + ':' + item.value
        }).join()
      }
      const res = await newImage.addPackage(params)
      if (!res.code === 0) return false
      this.$message.success('新增成功')
      this.cancelCreateData()
      this.getPackageList({
        id: this.imageData.id,
        pageSize: 10,
        pageNo: 1
      })
    },
    cancelCreateData () {
      this.saveLoading = false
      this.showAddPackage = false
      this.packageForm = {
        packList: [],
        name: '',
        value: ''
      }
      this.$refs.createPackage.resetFields()
    },
    deletePackage (index) {
      this.packageForm.packList.splice(index, 1)
      // this.$forceUpdate()
    },
    addPackage () {
      this.$refs.createPackage.validate(valid => {
        if (!valid) {
          return false
        } else {
          this.packageForm.packList.push(JSON.parse(JSON.stringify({
            name: this.packageForm.name,
            value: this.packageForm.value
          })))
          this.$forceUpdate()
          this.$refs.createPackage.resetFields()
        }
      })
    },
  }
}
</script>

<style scoped lang="less">
.page-content {
  .h3 {
    font-size: 18px;
  }
  .image-name {
    font-size: 14px;
    display: inline-block;
    background: #1990ff;
    border-radius: 8px;
    height: 38px;
    line-height: 38px;
    text-align: center;
    width: 96px;
    color: #fff;
    margin-bottom: 12px;
  }
  /deep/ .ant-card {
    padding: 16px;
    margin: 16px 0;
    margin-bottom: 24px;
    border-radius: 16px;
    .ant-card-body {
      padding: 0;
    }
  }
}
</style>
