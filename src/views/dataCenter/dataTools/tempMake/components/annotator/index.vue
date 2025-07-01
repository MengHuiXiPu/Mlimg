<template>
  <div class="annotation-wrapper">
    <Annotator
      id="annotator"
      ref="annotator"
      v-if="isReady"
      :identifier="imageId"
      :image-url="imageUrl"
      :dataset-name="datasetDetail.dlName"
      :create-by="datasetDetail.createBy"
      :markTaskId="datasetDetail.markTaskId"
      :datasetId="datasetDetail.id"
      mode = "segment"
      :datasetDetail="datasetDetail"
      @hook:mounted="annotatorMounted"
    />
  </div>
</template>

<script>
import { getSingleDataListDetailById, getPictureIdPageList } from "@/api/dataCenter";
import { getPicture, getFileCategoryAndCount } from "@/api/modelManage";
import Annotator from "./cocoAnnotation/Annotator.vue";
import annotatorModal from "./annotatorModal.js";
export default {
  name: "step3",
  components: {
    Annotator,
  },
  mixins: [annotatorModal],
  data() {
    return {
      isReady: false,  //查询完数据集详情后显示标注框
      datasetDetail: {}, //
      imageId: null,
      imageUrl: null,
      datasetId: null,
      isShow: false,
      dlTagType: null,
      isActived: false, //是否在标注这一步
    }
  },
  props: {
    showLoading: {
      type: Function,
      default: () => { }
    },
    closeLoading: {
      type: Function,
      default: () => { }
    },
    tempData: {
      type: Object,
      default: () => ({})
    },
    pictureList: {
      type: Object,
      default: () => [],
    },
    pagination: {
      type: Object,
      default: () => ({
        total: 0,
        pageSize: 16,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["16", "20", "24", "28"]
      }),
    },
  },
  methods: {
    annotatorMounted() {

    },
    async nextStep() {
      return new Promise(async (resolve, reject) => {
        const categoryList = this.$refs.annotator?.categories || []
        let isEmpty = true
        categoryList.forEach(item => {
          if (item.annotations?.length) {
            isEmpty = false
          }
        })
        if (isEmpty) {
          this.$message.error('未对图片进行标注，无法进入下一步')
          reject()
        } else {
          // 保存标注数据
          await this.$refs.annotator.save()
          resolve()
        }
      })
    },
    async fetchDsDetails() {
      this.showLoading('图片加载中...')
      try {
        // 先获取数据集详情
        const dsDetail = await getSingleDataListDetailById(parseInt(this.tempData.splicedPic?.remark))
        if (dsDetail.code === 0) {
          this.datasetDetail = dsDetail.data
          this.datasetId = dsDetail.data.id
          this.dlTagType = dsDetail.data.dlTagType
          // 获取类别列表，用类别再去查图片 id
          const catRes = await getFileCategoryAndCount({
            id: this.datasetId,
            markRange: 0,
            reviewRange: 0
          })
          let category = ""
          if (catRes.code === 0) {
            category = catRes.data.DataListCategory[0]
          }
          // 获取数据集的图片列表(虽然只有一张)
          const idRes = await getPictureIdPageList({
            categoryName: category,
            markRange: 0,
            limit: 1000,
            pageNo: 1,
            // reviewRange: 0,
            id: dsDetail.data.id
          })
          if (idRes.code === 0) {
            this.imageId = idRes.data.records[0].id
            // 根据 id 去加载图片
            const blob = await getPicture(this.imageId)
            const url = window.URL.createObjectURL(blob)
            this.imageUrl = url
            if (this.isReady) {  //非第一次加载，此时用户重新截取图片，生成了新的数据集，需要重新渲染画布(相当于切换图片)
              this.$refs.annotator && this.$refs.annotator.reload(this.imageId, this.imageUrl);
            }
            this.isReady = true
          }
          this.closeLoading()
        }
      } catch (e) {
        this.closeLoading()
        console.error(e)
      }
    }
  },
  activated() {
    this.isActived = true
    this.fetchDsDetails()
  },
  deactivated() {
    this.isActived = false
  },
}
</script>

<style lang="less" scoped>
.annotation-wrapper {
  height: 100%;
}
#annotator {
  position: relative;
  font-family: Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: rgba(218, 234, 255, 1); //annotator的底色
  overflow: hidden;
}
.default {
  background-color: rgb(167, 205, 255);
  border: 1px solid #d8d6d2;
  border-radius: 8px;
}

.focus-style {
  border: 2px solid #ff0000;
}
</style>