<template>
  <!-- 暂时不需要这个组件了，需求变的好快 -->
  <div class="result-wrapper">
    <div class="left">
      <img
        :src="imageList[currentData[0]?.id] || defaultPhone"
        alt=""
        style="width: 100%; cursor: pointer"
        @click="handleImgCilck"
      />
    </div>
    <div class="right">
      <div class="info">
        <a-table
          :columns="columns"
          :data-source="currentData"
          :pagination="false"
          :rowKey="(record) => record.id"
        ></a-table>
      </div>
      <div class="imgList">
        <a-list
          item-layout="vertical"
          :data-source="sampleTableData"
          size="small"
          :pagination="pagination"
          @click="handleListItemClick"
        >
          <a-list-item
            style="cursor: pointer"
            slot="renderItem"
            slot-scope="item, index"
            :key="index"
            :data-value="index"
            :class="{ active: activeItem == index }"
          >
            <img
              :src="imageList[item.id] || defaultPhone"
              alt=""
              class="img-class"
            />
          </a-list-item>
        </a-list>
      </div>
    </div>
    <div class="demo-image__preview">
      <el-image-viewer
        v-if="showViewer && imageList[currentData[0]?.id]"
        :initialIndex="initialIndex"
        :on-close="closeViewer"
        :url-list="[imageList[currentData[0]?.id]]"
      />
    </div>
  </div>
</template>

<script>
import * as modelApi from "@/api/modelManage.js";
import * as offlineApi from "@/api/offlineForecast.js";
import ElImageViewer from "element-ui/packages/image/src/image-viewer";

export default {
  name: "ManagementResult",
  components: {
    ElImageViewer,
  },
  props: {
    type: {
      type: String,
      default: null,
    },
    paramId: {
      //离线报告id
      type: String,
      default: null,
    },
  },
  computed: {
    defaultPhone() {
      return require("@/assets/images/place.gif");
    },
  },
  mounted() {
    this.getSampleDetailList();
  },
  data() {
    return {
      api: {
        //包装引入的api
        model: modelApi,
        forecast: offlineApi,
      },
      idName: {
        model: "modelId",
        forecast: "forecastId",
      },
      showViewer: false,
      sampleTableLoading: false,
      // 存储当前页数据对象
      sampleTableData: [],
      // 存储当前页图片地址
      imageList: [],
      // 当前展示的数据的对象
      currentData: [],
      activeItem: 0,
      // 结果类型
      resultType: 0,
      pagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        simple: true,
        onChange: (page) => {
          this.pagination.current = page;
          this.getSampleDetailList();
          this.activeItem = 0;
        },
      },
      columns: [
        {
          title: "置信度",
          dataIndex: "conf",
          key: "conf",
        },
        {
          title: "真实类别",
          dataIndex: "groundTrue",
          key: "groundTrue",
        },
        {
          title: "预测类别",
          dataIndex: "predictCode",
          key: "predictCode",
        },
        {
          title: "预测框数量",
          dataIndex: "bboxCnt",
          key: "bboxCnt",
        },
      ],
    };
  },
  methods: {
    getImage(id) {
      return this.type === "model"
        ? modelApi.getImage(id)
        : offlineApi.getImage(id);
    },
    // 查询样本详情
    async getSampleDetailList(callback) {
      this.sampleTableLoading = true;
      const params = {
        // selectPredictCode: "CNT0",
        [this.idName[this.type]]: this.paramId, //模型id
        limit: this.pagination.pageSize,
        pageNo: this.pagination.current,
        resultType: this.resultType,
      };
      // 调用api获取图片样本详情
      this.api[this.type]
        .getSampleDetailList(params)
        .then((res) => {
          const {
            code,
            data: { records, total = 0 },
            msg,
          } = res;
          if (code === 0) {
            this.pagination.total = total;
            this.sampleTableData = records;
            records.forEach((item, index) => {
              if (!this.imageList[item.id]) {
                this.getImage(item.id).then((res) => {
                  const url = window.URL.createObjectURL(res); //设置右下角图片列表图片地址
                  this.$set(this.imageList, item.id, url);
                });
              }
            });
            this.currentData = this.sampleTableData.length
              ? [this.sampleTableData[this.activeItem]]
              : [];
            if (callback) callback(this.sampleTableData);
          }
        })
        .finally(() => {
          this.sampleTableLoading = false;
        });
    },
    handleImgCilck() {
      this.showViewer = true;
    },
    closeViewer() {
      this.showViewer = false;
    },
    handleListItemClick(event) {
      const listItem = event.target.closest(".ant-list-item");
      if (listItem) {
        const index = listItem.dataset.value;
        this.activeItem = index;
        this.currentData = [this.sampleTableData[index]];
      }
    },
  },
};
</script>

<style lang="less" scoped>
.result-wrapper {
  display: flex;
  .left {
    width: 550px;
  }
  .right {
    flex: 1;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    .info {
      width: 450px;
    }
    .img-class {
      display: block;
      margin: 0 auto;
      width: 30px;
      height: 30px;
    }
    .active {
      background-color: #d9d9d9;
    }
  }
}
</style>
