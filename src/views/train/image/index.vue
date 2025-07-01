<template>
  <div>
    <div class="toolbar space-between">
      <el-form :inline="true" :model="searchFormData" size="small" ref="refSearchForm" @submit.native.prevent @keyup.enter.native="handleSearch">
        <el-form-item label="名称" prop="name">
          <el-input v-model="searchFormData.name" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="$event=>handleSearch($event)">查询</el-button>
          <el-button type="primary" plain @click="handleSearch($event, true)">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 18px;">
        <el-button type="primary" @click="handCreate">新建镜像</el-button>
      </div>
    </div>
    <a-table
      v-resize
      :columns="columns"
      :data-source="tableData"
      :pagination="pagination.total > 10 ? pagination : false"
      :loading="loading"
      @change="tableDataChange"
      :rowKey="record => record.id"
    >
      <span slot="name" slot-scope="text,record">
        <span
          class="image-name"
          :title="text"
          @click="toImageDetail(record)">{{ text }}</span>
      </span>
      <span slot="createTime" slot-scope="text">
        {{ text | moment }}
      </span>
      <span slot="operate" slot-scope="record,text,index">
        <a v-if="record.createType === 2" @click="downloadDockerfile(record.id)">下载Dockerfile</a>
        <a v-action:image-list-edit @click="() => handleEdit(record)" style="margin-left: 10px">编辑</a>
        <a v-action:image-list-delete @click="handleDelete(record, index)" style="margin-left: 10px">删除</a>
      </span>
    </a-table>
    <add-image ref="addImage" @getDataList="getDataList"></add-image>
  </div>
</template>

<script>
import { mixinHeader } from "@/utils/mixin"
import { newImage } from '@/api/imageManage'
import moment from 'moment'
export default {
  name: "Image",
  mixins: [mixinHeader],
  components: {
    addImage: () => ({ component: import('./addImage') })
  },
  data () {
    return {
      tabActiveKey: '1',
      tabList: [
        { key: "1", name: "镜像列表" }
      ],
      columns: [
        {
          title: '镜像名称',
          dataIndex: "name",
          key: "name",
          ellipsis: true,
          scopedSlots: { customRender: "name" },
          align: 'left',
          width: '20%'
        },
        {
          title: '镜像状态',
          dataIndex: "status",
          key: "status",
          align: 'left',
          width: '15%',
          customRender: (text) => {
            const statusMap = {
              0: '创建中',
              1: '正常',
              2: '创建异常'
            };
            return statusMap[text] || '未知状态';
          }
        },
        {
          title: '上传方式',
          dataIndex: "createType",
          key: "createType",
          align: 'left',
          width: '15%',
          customRender: (text) => {
            const uploadMethodMap = {
              1: '已存在',
              2: '本地上传'
            };
            return uploadMethodMap[text] || '未知方式';
          }
        },
        {
          title: "安装包:版本",
          dataIndex: "installPkg",
          ellipsis: true,
          key: "package",
          align: 'left',
          width: '20%'
        },
        {
          title: "IMAGE:TAG",
          dataIndex: "ckAddress",
          key: "ckAddress",
          ellipsis: true,
          align: 'left',
          width: '20%'
        },{
          title: '说明',
          dataIndex: 'description',
          key: 'description',
          width: 160,
          ellipsis: true,
        },
        {
          title: "创建人",
          dataIndex: "createBy",
          key: "createBy",
          align: 'left',
          ellipsis: true,
          width: 120
        },
        {
          title: "创建时间",
          dataIndex: "createTime",
          key: "createTime",
          scopedSlots: { customRender: "createTime" },
          align: 'left',
          width: 162
        },
        {
          title: "操作",
          dataIndex: "",
          key: "x",
          scopedSlots: { customRender: "operate" },
          align: 'left',
          width: 200
        }
      ],
      tableData: [],
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
      loading: false,
      searchFormData: {
        name: '',
      }
    }
  },
  mounted () {
    this.getDataList()
  },
  methods: {
    tableDataChange (pagination, filters, sorter) {
      this.getDataList({
        limit: pagination.pageSize,
        pageNo: pagination.current,
        keyword: this.searchFormData.name || ''
      })
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
    handleEdit (record) {
      this.$refs.addImage.showModal(record)
    },
    renderTaskList (taskList) {
      const task = taskList.map(item => {
        return <p>
          <span class="taskName">{ item.imageName }</span>
          <span class="taskVersion">{ item.versionLabel }</span>
          <span class="taskTag">{ item.tagType }</span>
          <span class="taskTime">{ moment(item.createTime).format('YYYY-MM-DD HH:mm:ss') }</span>
        </p>
      })
      return <div class="task">
        <h4>当前镜像关联以下算法，请先删除下列算法再删除该镜像：</h4>
        <div class="taskList">
          <p>
            <span class="taskName">算法名称</span>
            <span class="taskVersion">算法版本</span>
            <span class="taskTag">类型</span>
            <span class="taskTime">发布时间</span>
          </p>
          { task }
        </div>
      </div>
    },
    async handleDelete (record, index) {
      let taskList = []
      const res = await newImage.getImageDependList({
        imageId: record.id
      })
      if (res.code === 0) {
        taskList = res.data
      }
      const content = taskList.length === 0 ? "此操作将永久删除，请确认是否删除?" : this.renderTaskList(taskList)
      this.$confirm({
        title: taskList.length === 0 ? `确定要删除 ${record.name} 吗?` : '提示',
        content,
        cancelText: '取消',
        okText: '确定',
        width: 600,
        okButtonProps: {
          props: { disabled: taskList.length !== 0 },
        },
        onOk: async () => {
          const res = await newImage.getImage(record.id, 'delete')
          if (!res.code === 0) return false
          this.$message.success('删除成功')
          if (this.tableData.length === 1 && this.pagination.total !== 1) this.pagination.current--
          this.handReload()
        },
        onCancel () {}
      })
    },
    handleSearch (event, reset) {
      this.pagination.current = 1
      if(reset) {
        this.$refs.refSearchForm.resetFields()
      }
      this.getDataList({
        limit: this.pagination.pageSize,
        pageNo: this.pagination.current,
        keyword: this.searchFormData.name || ''
      })
    },
    handCreate () {
      this.$refs.addImage.showModal()
    },
    toImageDetail (record) {
      this.$router.push({
        path: "/train/image/detail",
        query: { id: record.id }
      })
    },
    async getDataList (params) {
      this.loading = true
      const res = await newImage.getImageList({
        ...params,
        allStatus: true
      });
      this.loading = false
      if (res.code !== 0) return false
      this.tableData = res.data.records
      this.pagination.total = res.data.total
    },
    async downloadDockerfile(id) {
      try {
        const response = await newImage.downloadDockerfile(id);
        const blob = new Blob([response], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Dockerfile_${id}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        this.$message.error('下载失败');
      }
    }
  }
}
</script>

<style lang="less" scoped>
.image-name {
  color: #00f;
}
a {
  color: #00f;
}
.taskList{
  overflow-y: auto;
  max-height: 250px;
  &>p>*{
    display: inline-block;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .taskName{
    width: 42%
  }
  .taskTime{
    width: 26%
  }
  .taskVersion,.taskTag{
    width: 15%;
  }
}
</style>
