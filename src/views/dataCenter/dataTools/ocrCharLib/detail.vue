<template>
  <div class="ats-detail-wrapper scrollbar">
    <a-spin :spinning="spinning">
      <template v-if="tempId">
        <el-descriptions column="3" style="margin-bottom: 10px;" title="基本信息" size="medium">
          <el-descriptions-item label="创建人">{{ taskData.createBy }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ taskData.createTime | moment }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ taskData.updateTime | moment }}</el-descriptions-item>
          <el-descriptions-item label="描述">
            <text-editor :text="taskData.desc" size="mini" @change="handlUpdateDesc" maxlength="512" :key="tempId"></text-editor>
          </el-descriptions-item>
        </el-descriptions>
        <!-- <el-divider></el-divider> -->
        <div class="picture-footage-box">
          <a-tabs v-model="activeKey" style="margin-top: 30px;" :animated="false">
            <a-tab-pane tab="原图" key="22">
              <img-list-panel :tempId="tempId"  scene="original" @slice="handleSlice"></img-list-panel>
            </a-tab-pane>
            <a-tab-pane tab="字符图" key="23">
              <img-list-panel :tempId="tempId"  scene="character" @splicing="handleSplicing" ref="refCharImgList"></img-list-panel>
            </a-tab-pane>
            <a-tab-pane tab="OCR模板图" key="24">
              <div style="text-align: right;margin-bottom: 15px;">
                <a-button type="primary" size="medium"  @click="handleSplicing">去拼接OCR模版图</a-button>
              </div>
              <template v-if="tempList?.length">
                <a-table :columns="tempColumns" :data-source="tempList" :pagination="pagination" @change="handleTableChange">
                  <span slot="action" slot-scope="record">
                    <a @click="() => handleDownTemp(record)">下载模版zip包</a>
                    <!-- <a style="margin-left: 10px;margin-right: 10px;">复制至字符集</a> -->
                  </span>
                  <template slot="tempImg" slot-scope="record">
                    <el-image :src="matchImgSrc(record)" :preview-src-list="[record.url]" fit="contain" style="width: 10vw;height: 6vh;"></el-image>
                  </template>
                </a-table>
              </template>
              <a-empty style="line-height: 10;" :image="simpleImage" v-else>
                <span slot="description"> 暂无模板图，请 <a class="common-link" @click="handleSplicing">去拼接OCR 模板图</a></span>
              </a-empty>
            </a-tab-pane>
          </a-tabs>
        </div> 
      </template>
      <a-empty style="line-height: 30;" :image="simpleImage" v-else>
        <span slot="description"> 未选择模版，请选择或 <a class="common-link" @click="handCreate">创建新的模板</a></span>
      </a-empty>
      <!-- 字符图拼接 -->
      <splicing-modal v-if="showSplicingModal" :visible.sync="showSplicingModal" :tempId="tempId" @close="getTempList"/>
      <!-- 截取字符图 -->
      <slice-modal v-if="showSliceModal" :visible.sync="showSliceModal" :tempId="tempId"/>
    </a-spin>
  </div>
</template>

<script>
import textEditor from "@/components/business/textEditor/index.vue";
import { Empty } from 'ant-design-vue';
import { saveTemp, getTempDeteil, getStepList, downloadOcrTemplate } from "@/api/ocrCharLib";
import { uploadPic, deletePicture, getPicList, getThumbnailList, getPicByPath } from "@/api/tempMake.js";
// import editTable from "./components/editTable.vue";
import imgListPanel from "./components/imgListPanel.vue";
import splicingModal from "./splicingModal.vue";
import sliceModal from "./sliceModal/index.vue";
import moment from "moment";
import { saveAs } from "file-saver";
export default {
  components: {
    textEditor,
    imgListPanel,
    splicingModal,
    sliceModal,
    // editTable,
  },
  data() {
    return {
      spinning: false,
      taskData: {}, //模板详情 data
      activeKey: "22",
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      originalImgList: [], //原始图片列表
      showSplicingModal: false,
      showSliceModal: false, //
      tempList: [], //模板列表
      // 模板列表的分页
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0
      },
      // 模板列表的表头
      tempColumns: [
        {
          dataIndex: 'createTime',
          key: 'createTime',
          title: '模版生成时间',
          customRender: function (text) {
            return moment(text).format("YYYY-MM-DD HH:mm:ss");
          },
        },
        { key: 'tempImg', title: 'OCR模版图', scopedSlots: { customRender: 'tempImg' } },
        { key: 'action', title: '操作', scopedSlots: { customRender: 'action' }, }
      ]
    }
  },
  props: {
    tempId: {
      type: Number,
      default: 0
    },
  },
  methods: {
    // 更新描述
    handlUpdateDesc(newText) {
      saveTemp({
        id: this.tempId,
        desc: newText
      }).then(res => {
        if (res.code === 0) {
          this.$message.success('已更新')
          this.taskData.desc = newText
        }
      })
    },
    // 去拼接OCR模板图
    handleSplicing() {
      // 先判断是否有字符图
      if (this.$refs.refCharImgList) {
        if (!this.$refs.refCharImgList?.imgList?.length) return this.$message.warning('请先上传字符图')
      }
      this.showSplicingModal = true
    },
    // 去截取字符图
    handleSlice() {
      this.showSliceModal = true
    },
    handCreate() {
      this.$emit('create')
    },
    /**
     * @public
     */
    async getTaskDetailData() {
      this.spinning = true
      //查询模板详情和图片列表 
      try {
        const result = await getTempDeteil(this.tempId, { needStepResult: true })
        if (result.code === 0) {
          this.taskData = result.data
        }
        this.spinning = false
      } catch (e) {
        console.error(e)
        this.spinning = false
      }
    },
    // 下载模板 zip 包
    handleDownTemp(record) {
      if (this.downloadIng) {
        return this.$message.warning("资源传输中，请稍后...")
      }
      this.downloadIng = true
      this.$message.warning("资源已开始传输，请稍后...")
      downloadOcrTemplate(record.id).then(res => {
        const blob = new Blob([res], { type: "application/zip" });
        saveAs(blob, `${record.filename || this.taskData?.name}.zip`);
        // 已下载
        this.$message.success('已完成下载')
      }).finally(() => {
        this.downloadIng = false
      })
    },
    // 模板列表的分页 change
    handleTableChange(pagination) {
      this.pagination.current = pagination.current;
      this.getTempList();
    },
    /**
     * 获取模板列表
     */
    async getTempList() {
      const { current, pageSize } = this.pagination
      const res = await getStepList({
        dataProcessingId: this.tempId,
        pageNo: current,
        limit: pageSize,
        stepEnum: "33", //模板固定 32
      })
      if (res.code === 0) {
        this.pagination.total = res.data.total
        this.tempList = res.data.records
        // 遍历去加载图片
        this.tempList.forEach(item => {
          getPicByPath(item.path).then(res => {
            const url = window.URL.createObjectURL(res)
            this.$set(item, 'url', url)
          })
        })
      }
    },
    matchImgSrc(item) {
      return item.url || require("@/assets/images/place.gif");
    },
  },
  watch: {
    tempId() {
      if (this.tempId) {
        this.activeKey = "22"
        //查询模板详情和图片列表 
        this.getTaskDetailData()
        this.getTempList()
      }
    }
  },
}
</script>

<style lang="less" scoped>
.tab-header {
  color: #303133;
  font-size: 16px;
  font-weight: 700;
  margin-right: 20px;
}
.table-col-input {
  width: 100%;
}
.ats-detail-wrapper {
  &::v-deep {
    .ant-table-thead > tr > th,
    .ant-table-tbody > tr > td {
      padding: 8px;
    }
  }
}
</style>