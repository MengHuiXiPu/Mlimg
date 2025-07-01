<template>
  <div class="page-content page-content-height">
    <div class="left-content scrollbar">
      <div class="header-box">
        <a-button type="primary" @click="handCreate">创建新模板</a-button>
        <a-input-search placeholder="请输入模版名称" enter-button="查询" v-model="keyword" @search="onSearch" style="margin-top: 10px;"/>
      </div>
      <ul class="template-list scrollbar" v-infinite-scroll="loadMore" infinite-scroll-distance="0"
        infinite-scroll-disabled="loadDisabled" infinite-scroll-delay="300" infinite-scroll-immediate="false">
        <li class="template-item" v-for="(item, index) in tempList" :key="item.id" @click="handSelectTemp(item)"
          :class="{ 'item-selected': currentTemp.id === item.id }">
          <div class="temp-logo"><svg-icon type="dat" style="font-size: 18px;"></svg-icon> </div>
          <div class="temp-name" :title="item.name">{{ item.name }}</div>
          <a-dropdown>
            <div @click.stop class="moreBtn ant-dropdown-link"><a-icon type="more" /></div>
            <a-menu slot="overlay">
              <a-menu-item key="1" @click="handCreate(item)"> 重命名 </a-menu-item>
              <a-menu-item key="2" @click="handDeleteTemp(item)"> 删除</a-menu-item>
            </a-menu>
          </a-dropdown>
        </li>
        <!-- <a-card :hoverable="true" size="small" @click="handSelectTemp(item)" v-for="(item, index) in tempList" :key="item.id">
          <a-card-meta>
            <a slot="title" :class="{ 'item-selected': currentTemp.id === item.id }" class="card-title" :title="item.name">{{ item.name }}</a>
            <svg-icon type="dat" slot="avatar" class="card-logo"></svg-icon>
            <div class="meta-content" slot="description" :title="item.desc">{{ item.desc || " " }}</div>
          </a-card-meta>
          <template slot="actions">
            <a @click="handCreate(item)" style="color:#1890ff">重命名</a>
            <a @click="handDeleteTemp(item)" style="color:#1890ff">删除</a>
          </template>
        </a-card> -->
        <div class="prompt-box">
          <p v-if="listLoading" class="loading-text" :style="`margin-top: ${tempList.length ? '10px' : '50px'}`">
            <i class="el-icon-loading"></i>&nbsp;加载中...
          </p>
          <div v-if="!listLoading && loadDisabled">
            <a-empty :image="simpleImage" v-if="!tempList.length">
              <span slot="description"> 模板列表为空，请先 <a class="common-link" @click="handCreate">去创建新的模版</a></span>
            </a-empty>
            <span slot="description" v-else> 无更多数据</span>
          </div>
        </div>
      </ul>
    </div>
    <!-- 右侧详情内容 -->
    <detail-pane :tempId="currentTemp.id" class="right-content scrollbar" @create="handCreate" @edit="handEdit" ref="refDetailPane"/>
    <!-- 创建模板modal -->
    <create-temp ref="refCreateTemp" @success="onSearch" :visible.sync="showCreateTempModal" v-if="showCreateTempModal" />
    <!-- 编辑模版modal -->
    <edit-modal :visible.sync="showEditTempModal" v-if="showEditTempModal" @success="reloadTempDetail" :tempData="currentTemp"/>
  </div>
</template>

<script>
import { Empty } from 'ant-design-vue';
import createTemp from "./createTemp.vue";
import editModal from "./editModal.vue";
import detail from "./detail.vue";
import { getTempList, saveTemp, deleteTemp } from "@/api/tempMake";
export default {
  components: {
    createTemp,
    "detail-pane": detail,
    editModal,
  },
  data() {
    return {
      keyword: "",
      showCreateTempModal: false,
      showEditTempModal: false,
      tempList: [],
      currentTemp: {},
      listLoading: false,   //图片列表加载中loading
      pagination: { //数据集和本地上传都使用该分页，每次切换重置
        limit: 20,    //pageSize
        pageNo: 1,     //pageNo
        total: 0
      },
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
    }
  },
  computed: {
    // 判定不再需要滚动加载的标识变量
    loadDisabled() {
      // return this.imageList.length >= this.pagination.total
      if (!this.pagination.total) return true
      return this.tempList.length && (this.tempList.length >= this.pagination.total)
    },
  },
  methods: {
    onSearch() {
      this.pagination.pageNo = 1
      this.tempList = []
      this.getTempList()
      if (this.currentTemp.id) {
        // 更新模板详情
        this.reloadTempDetail()
      }
    },
    reloadTempDetail() {
      if (this.$refs.refDetailPane) {
        this.$refs.refDetailPane.getTempDetailData(false)
      }
    },
    handSelectTemp(data) {
      this.currentTemp = data
    },
    handCreate(item = {}) {
      this.showCreateTempModal = true
      if (item.id) { //编辑
        this.$nextTick(() => {
          this.$refs.refCreateTemp.initState(item)
        })
      }
    },
    handEdit() {
      this.showEditTempModal = true
    },
    loadMore() {
      // 如果没有更多数据，则不请求
      if (this.listLoading) return
      this.pagination.pageNo++
      this.getTempList()
    },
    getTempList() {
      this.listLoading = true
      // this.tempList = []
      const { limit, pageNo } = this.pagination
      getTempList({
        pageNo,
        limit,
        name: this.keyword
      }).then(res => {
        if (res.code === 0) {
          this.tempList = this.tempList.concat(res.data.records)
          this.pagination.total = res.data.total
        }
      }).finally(() => {
        this.listLoading = false
      })
    },
    handDeleteTemp(data) {
      this.$confirm({
        title: '删除模板',
        content: `删除模板${data.name}后，数据将无法恢复，请谨慎操作`,
        okText: '确定删除',
        okType: 'danger',
        onOk: () => {
          deleteTemp(data.id).then(res => {
            if (res.code == 0) {
              this.$message.success("删除成功")
              this.tempList = []
              this.pagination.pageNo = 1;
              this.currentTemp = {}
              this.getTempList();
            }
          })
        },
      });
    }
  },
  created() {
    this.getTempList()
  }
}
</script>

<style lang="less" scoped>
@import url("../index.less");
</style>