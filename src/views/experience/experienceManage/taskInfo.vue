<template>
  <div class="taskInfo page-content">
    <a-spin :spinning="loading">
      <div class="top">
        <div class="top-title">
          <a-divider class="title" type="vertical" />
          <span>任务名称：{{ taskDetail.title }}</span>
        </div>
        <div class="top-content">
          <a-descriptions :column="4" size="small" :title="''" class="detailTitle">
            <a-descriptions-item label="创建用户">{{ taskDetail.createBy }}</a-descriptions-item>
            <a-descriptions-item label="创建时间">{{ taskDetail.createTime | moment }}</a-descriptions-item>
          </a-descriptions>
          <a-descriptions :column="1" size="small" :title="''" class="detailTitle">
            <a-descriptions-item label="备注">{{ taskDetail.description }}</a-descriptions-item>
          </a-descriptions>
        </div>
      </div>
      <div class="bottom">
        <div class="bottom-title">
          <a-divider class="title" type="vertical" />
          <span>示例图</span>
          <div class="img-top">
            <template v-if="editType">
              <a-button type="primary" @click="$refs['fileUpload'].click()">上传<a-icon type="upload"></a-icon></a-button>
              <input
                multiple
                :accept="accept.toString()"
                type="file"
                hidden
                ref="fileUpload"
                @change="uploadImage"
              >
              <a-popconfirm
                title="是否删除当前选中图片?"
                ok-text="是"
                cancel-text="否"
                @confirm="deleteImage"
                :disabled="selectImageList.length === 0"
              >
                <a-button type="default" :disabled="selectImageList.length === 0">删除<a-icon type="delete"></a-icon></a-button>
              </a-popconfirm>
            </template>
            <a-checkbox v-model="editType">编辑模式</a-checkbox>
          </div>
        </div>
        <div class="bottom-content">
          <div class="img-item" v-for="pictureId in pictureIds" :key="pictureId.id">
            <img
              :ref="'img_' + pictureId.id"
              :src="pictureList[pictureId.id]"
              @click="handleShowLargePicture(pictureId.id)"
            />
            <div class="selectBtn" v-if="editType">
              <a-checkbox :checked="pictureId.selected" @change="selectImage($event, pictureId.id)"></a-checkbox>
            </div>
            <a-tooltip>
              <template slot="title">设置为封面图片</template>
              <div class="setTopImage" :class="pictureId.topImg && 'topImg'" @click="toTopImage(pictureId.id)">
                <a-icon type="star" :theme="pictureId.topImg && 'twoTone'" :two-tone-color="pictureId.topImg && '#00c4ff'"></a-icon>
              </div>
            </a-tooltip>
            <a-icon v-if="!pictureList[pictureId.id]" type="loading" />
          </div>
        </div>
        <div class="pagation-image">
          <a-pagination
            :show-total="() => `共 ${pagination.total} 条`"
            show-quick-jumper
            :defaultPageSize="pagination.pageSize"
            :default-current="pagination.current"
            :current="pagination.current"
            :total="pagination.total"
            show-less-items
            @change="pageChange"
          />
        </div>
      </div>
    </a-spin>
    <ImagePreview
      v-if="previewImage"
      :data="pictureIds"
      :default="previewImage"
      :pictureList="pictureList"
      :detailData="{ dlTagType: '分类' }"
      :getImageFun="getImage"
      :pagination="pagination"
      @close="previewImage = ''"
      @page="imagePreviewPageChange"/>
  </div>
</template>

<script>
import ImagePreview from '@/components/ImagePreview'
import experience from '@/api/experience'
import bus from '@/utils/bus'
export default {
  name: 'taskInfo',
  components: { ImagePreview },
  data () {
    return {
      taskId: '',
      loading: false,
      taskDetail: {
        title: '面板ADC质检',
        createBy: 'admin',
        createTime: new Date().getTime(),
        description: 'wfwefwefwefwefwef'
      },
      editType: false,
      pictureIds: [],
      pictureList: {},
      previewImage: '',
      pagination: {
        total: 0,
        pageSize: 12,
        current: 1,
        showSizeChanger: false,
        pageSizeOptions: ["12", "20", "24", "28"]
      },
      accept: ['.jpg', '.png', '.jpeg']
    }
  },
  computed: {
    selectImageList () {
      return this.pictureIds.filter(item => item.selected).map(item => item.id)
    }
  },
  mounted () {
    this.taskId = this.$route.query.id
    this.getData()
    this.getImageList()
  },
  beforeDestroy () {
    // 清空图片缓存
    Object.values(this.pictureList).forEach(item => {
      window.URL.revokeObjectURL(item)
    })
  },
  methods: {
    async getData () {
      this.loading = true
      const res = await experience.manage.getTaskInfo(this.taskId, 'get')
      this.loading = false
      if (res.code !== 0) return false
      this.taskDetail = res.data
    },
    async getImageList () {
      const { pageSize, current } = this.pagination
      const params = {
        pageNo: current,
        limit: pageSize,
        taskId: this.taskId
      }
      this.loading = true
      const res = await experience.manageImage.list(params)
      this.loading = false
      if (res.code !== 0) return false
      this.pictureIds = res.data.records
      this.$set(this.pagination, 'total', res.data.total)
      this.pictureIds.forEach(picId => {
        picId.selected = false
        if (this.pictureList[picId.id]) {
          picId.url = this.pictureList[picId.id]
        } else {
          experience.getImage(picId.id).then(res => {
            const url = window.URL.createObjectURL(res)
            picId.url = url
            this.$set(this.pictureList, picId.id, url)
          })
        }
      })
    },
    selectImage (e, id) {
      this.pictureIds.forEach((item, index) => {
        if (item.id === id) {
          item.selected = e.target.checked
          this.$set(this.pictureIds, index, item)
        }
      })
    },
    handleShowLargePicture (imageID) {
      if (this.editType) {
        this.pictureIds.forEach((item, index) => {
          if (item.id === imageID) {
            item.selected = !item.selected
            this.$set(this.pictureIds, index, item)
          }
        })
      } else {
        this.previewImage = imageID
      }
    },
    async imagePreviewPageChange (data, callback) {
      if (data === 'prev') {
        if (this.pagination.current === 1) {
          return callback([])
        }
        this.$set(this.pagination, 'current', this.pagination.current - 1)
      } else {
        if (this.pagination.current === Math.ceil(this.pagination.total / this.pagination.pageSize)) {
          return callback([])
        }
        this.$set(this.pagination, 'current', this.pagination.current + 1)
      }
      this.getImageList()
    },
    pageChange (page, pageSize) {
      this.pagination.pageSize = pageSize
      this.pagination.current = page 
      this.getImageList()
    },
    async getImage (id) {
      return await experience.getImage(id)
    },
    async deleteImage () {
      // 从当前分类删除当前选中的图片列表
      // 删除完成之后需要将当前图片列表中的最后一个删除，并且修改total
      const data = await experience.manageImage.deleteImage({
        ids: this.selectImageList.toString()
      })
      if (data.code === 0) {
        this.$message.success('删除成功')
        // this.handleCategorySelect(this.selectMenu)
        const { current, total, pageSize } = this.pagination
        if (this.selectImageList.length === this.pictureIds.length && current === Math.ceil(total / pageSize) && current !== 1) {
          this.pagination.current--
        }
        this.getImageList()
      }
    },
    uploadImage (e) {
      let files = []
      const formData = new FormData()
      e.target.files.forEach((item, index) => {
        if (this.accept.includes(item.name.substring(item.name.lastIndexOf('.')).toLowerCase())) {
          files.push(item)
          formData.append('file', item)
        }
      })
      formData.append('taskId', this.taskId)
      // formData.append('file', files)
      if (files.length !== e.target.files.length) {
        this.$message.error(`请上传 ${this.accept.toString()} 格式的文件`)
        return false
      }
      experience.manageImage.upload(formData).then(() => {
        this.$refs['fileUpload'].value = ''
        // if (res.code !== 0) return false
        this.$message.success('上传成功')
        this.getImageList()
      }).catch(() => {
        this.$refs['fileUpload'].value = ''
        // if (res.code !== 0) return false
        this.$message.success('上传成功')
        this.getImageList()
      })
    },
    async toTopImage (id) {
      const res = await experience.manageImage.setTopImage({
        picId: id,
        taskId: this.taskId
      })
      if (res.code !== 0) return false
      this.$message.success('设置成功')
      this.getImageList()
      bus.$emit('reloadTask')
    }
  }
}
</script>

<style lang="less" scoped>
.taskInfo{
  .top{
    &-title{
      margin-bottom: 10px;
      span{
        font-size: 16px;
        font-weight: 600;
        color: #000;
      }
    }
    &-content{
      overflow: hidden;
      padding: 5px 0;
      border-top: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
      margin-bottom: 10px;
      .ant-statistic{
        float: left;
        width: 16.66%;
        text-align: center;
        height: 80px;
        /deep/ .ant-statistic-title{
          line-height: 30px;
          font-weight: bold;
        }
        &:not(:first-child){
          border-left: 1px solid #ccc;
        }
      }
    }
  }
  .bottom{
    &-title{
      margin-bottom: 10px;
      overflow: hidden;
      span{
        font-size: 16px;
        font-weight: 600;
        color: #000;
      }
      .img-top{
        float: right;
        line-height: 32px;
        &>*{
          margin-left: 10px;
        }
      }
    }
    &-content{
      overflow: hidden;
      height: 64vh;
      .img-item{
        width: 25%;
        height: calc(33% - 15px);
        padding: 0 1%;
        margin-bottom: 15px;
        min-width: 200px;
        float: left;
        position: relative;
        cursor: pointer;
        overflow: hidden;
        .selectBtn{
          position: absolute;
          top: -3px;
          z-index: 2;
        }
        img{
          width: 100%;
          height: 100%;
          user-select: none;
        }
        // i{
        //   position: absolute;
        //   left: 50%;
        //   top: 50%;
        //   font-size: 50px;
        //   transform: translate3d(-50%, -50%, 0);
        //   z-index: 2;
        // }
        .setTopImage{
          position: absolute;
          bottom: -50px;
          right: -50px;
          background: #00000073;
          color: #fff;
          height: 40px;
          width: 40px;
          border-radius: 100% 0 0;
          transition: 0.3s all;
          line-height: 50px;
          text-align: right;
          padding-right: 5px;
          font-size: 20px;
          &:hover{
            color: #00c4ff;
          }
          &.topImg{
            color: #00c4ff;
            bottom: 0;
            right: 13px;
          }
        }
        &:hover{
          .setTopImage{
            bottom: 0;
            right: 13px;
          }
        }
      }
    }
  }
  .pagation-image {
    float: right;
    padding: 5px 10px;
  }
}
</style>