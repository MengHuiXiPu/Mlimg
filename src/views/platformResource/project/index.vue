<template>
  <div class="app-container">
    <!--工具栏-->
    <div id="components-form-demo-advanced-search">
      <!-- 搜索条件 -->
      <a-form layout="inline" :model="formParam" ref="searchFormRef">
        <a-form-item label="项目名称">
          <a-input v-model="formParam.projectName" placeholder="请输入"/>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch(pagination.current, pagination.pageSize)" style="margin-right: 10px">查询</a-button>
          <a-button @click="handleReset" style="margin-right: 10px">重置</a-button>
          <a-button @click="create" style="margin-right: 10px">新增</a-button>
        </a-form-item>
      </a-form>
      <div class="search-result-list">
        <!--表格渲染-->
        <a-table :columns="columns"
                 :data-source="data"
                 max-height="630"
                 :scroll="{ y: 800 }"
                 :row-key="'key'"
                 :pagination="pagination"
                 :loading="loading"
        >
          <template slot="projectName" slot-scope="text, record, index">
            <a @click="gotoProject(record)">{{text}}</a>
          </template>
          <template slot="powerResourceList" slot-scope="text, record, index">
            <a-list item-layout="horizontal" :data-source="record.powerResourceList">
              <a-list-item slot="renderItem" slot-scope="item, index2">
                <span>{{ item }}</span>
              </a-list-item>
            </a-list>
          </template>
          <template slot="storageResourceList" slot-scope="text, record, index">
            <a-list item-layout="horizontal" :data-source="record.storageResourceList">
              <a-list-item slot="renderItem" slot-scope="item, index2">
                <span>{{ item }}</span>
              </a-list-item>
            </a-list>
          </template>
          <template slot="deleted" slot-scope="text, record, index">
            <span>{{ parseTime(record.createTime) }}</span>
          </template>
          <template slot="deleted" slot-scope="text, record, index">
            {{record.deleted ? '是' : '否'}}
          </template>
          <template slot="operation" slot-scope="text, record, index">
            <div class="editable-row-operations">
               <span>
                <a @click="() => edit(record)">编辑</a>
              </span>
              <span>
                <a-popconfirm title="确定要删除?" @confirm="() => del(record.id)">
                  <a>删除</a>
                </a-popconfirm>
              </span>

            </div>
          </template>
        </a-table>
        <!--分页组件-->

      </div>
    </div>

    <ProjectModal v-if="modalVisible" :modalVisible="modalVisible" :project="projectData" :isEdit="isEdit" @handleOk="handleOk" @handleCancel="handleCancel"/>

  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ProjectModal from "@/views/platformResource/project/projectModal.vue";
import * as ProjectApi from "@/api/project";
import { parseTime } from '@/utils/utils.js'
export default {
  name: 'Project',
  components: {ProjectModal},
  data() {
    return {
      columns: [
        {
          title: '项目名称',
          dataIndex: 'projectName',
          key: 'projectName',
          width: '10%',
          scopedSlots: { customRender: 'projectName' },
        },
        {
          title: '项目算力资源池 * 算力配额',
          dataIndex: 'powerResourceList',
          key: 'powerResourceList',
          width: '30%',
          scopedSlots: { customRender: 'powerResourceList' },
        },
        {
          title: '存储资源池 * 存储配额',
          dataIndex: 'storageResourceList',
          key: 'storageResourceList',
          width: '20%',
          scopedSlots: { customRender: 'storageResourceList' },
        },
        {
          title: '创建时间',
          dataIndex: 'createTime',
          key: 'createTime',
          width: '20%',
          scopedSlots: { customRender: 'createTime' },
        },
        {
          title: '是否删除',
          dataIndex: 'deleted',
          key: 'deleted',
          width: '10%',
          scopedSlots: { customRender: 'deleted' },
        },
        {
          title: '操作',
          dataIndex: 'operation',
          key: 'operation',
          scopedSlots: { customRender: 'operation' },
        },
      ],
      data: [
        {
          projectName: '',
          powerResourceList: [],
          storageResourceList: [],
          createTime: '',
          deleted: false
        }
      ],
      pagination: {
        current: 1,
        pageSize: 10,
        pages: 0,
        total: 0,
        showQuickJumper: true, // 显示快速跳转输入框
        showSizeChanger: true, // 显示每页条数选择器
        pageSizeOptions: ['5', '10', '20', '50'], // 每页条数选项
        onChange: (current, pageSize) => {
          this.handleSearch(current, pageSize); // 请求数据
        },
        onShowSizeChange: (current, size) => {
          this.handlePageSizeChange(current, size); // 请求数据
        },
      },

      isEdit: false,
      formParam: {
        projectName: '',
      },

      modalVisible: false,
      projectData: {},

      loading: false,
    };
  },
  mounted() {
    this.pagination = {
      ...this.pagination,
      current: 1,
      pageSize: 10,
    }
    this.handleSearch(this.pagination.current, this.pagination.pageSize)
  },
  computed: {
    ...mapGetters(['user']),
  },
  methods: {
    parseTime,
    gotoProject(record){
      this.$router.push({ path: '/projectSpace/teamProject', query: { id: record.id } });
    },

    // 每页条数变化时触发
    handlePageSizeChange(current, pageSize) {
      this.pagination.pageSize = pageSize; // 更新每页条数
      this.handleSearch(current, pageSize);
    },

    handleSearch(current = 1, pageSize = 10) {
      this.loading = true
      let param = `?` + `current=` + current + `&size=` + pageSize + `&projectName=` + this.formParam.projectName
      ProjectApi.getProjects(param)
          .then(res => {
            this.pagination = {
              current: current,
              pageSize: pageSize,
              pages: res.pages,
              total: res.total,
            }
            this.data = res.records
          })
          .catch(err => {
            console.log(err);
            this.$message.error(err)
          }).finally(()=>{
        this.loading = false
      })
    },

    handleReset() {
      this.formParam = {
        projectName: ''
      }
      this.pagination = {
        ...this.pagination,
        current: 1,
        pageSize: 10
      }
      this.handleSearch(this.pagination.current, this.pagination.pageSize)
    },

    create(){
      this.projectData = {}
      this.isEdit = false
      this.modalVisible = true
    },
    edit(record) {
      this.projectData = record
      this.isEdit = true
      this.modalVisible = true
    },
    del(id) {
      // let ids = []
      // ids.push(id)
      ProjectApi.delProjects([id])
          .then(res => {
            this.handleSearch(this.pagination.current, this.pagination.pageSize)
            this.$message.success('删除成功')
          })
          .catch(err => {
            console.log(err);
          })
    },
    async handleOk(val) {
      this.$nextTick(async () => {
        this.pagination = {
          ...this.pagination,
          current: 1,
          pageSize: 10
        }
        await this.handleSearch(this.pagination.current, this.pagination.pageSize)
        this.modalVisible = false
      })
    },
    handleCancel(val){
      this.pagination = {
        ...this.pagination,
        current: 1,
        pageSize: 10
      }
      this.modalVisible = false
    }
  },
};
</script>
<style scoped lang="less">
.ant-advanced-search-form .ant-form-item {
  display: flex;
}

.editable-row-operations a {
  margin-right: 8px;
}
</style>
