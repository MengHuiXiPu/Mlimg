<template>
  <div class="industry">
    <p-header
      :tab-list="tabList"
      :showNew="false"
      :showSearch="false"
      :tab-active-key="1"
      :placeholderText="'请输入参数名称'"
      @reload="getDataList"
    />
    <div class="industry-content">
      <div class="industry-content-item" v-for="item in industryList" :key="item.id">
        <p-card hoverable>
          <img slot="cover" :src="pictureList[item.id]" v-if="pictureList[item.id]">
          <div slot="cover" class="no-image" v-else>
            <p-icon type="picture"></p-icon>
            <span>暂无图片</span>
          </div>
          <p-card-meta :title="item.title">
            <template slot="description">
              {{ item.description }}
            </template>
          </p-card-meta>
          <p-tooltip>
            <template slot="title">立即体验</template>
            <div class="toExperience" @click="toExperience(item)">
              <p-icon type="login"></p-icon>
            </div>
          </p-tooltip>
        </p-card>
      </div>
    </div>
  </div>
</template>

<script>
import PHeader from '@/components/PHeader'
import experience from '@/api/experience'
import bus from '@/utils/bus'
export default {
  name: 'industry',
  components: {
    PHeader
  },
  data () {
    return {
      tabList: [
        { key: 1, name: "工业质检" }
      ],
      industryList: [],
      pictureList: [],
    }
  },
  mounted () {
    this.getDataList()
    bus.$on('reloadTask', () => {
      this.getDataList()
    })
  },
  beforeDestroy () {
    bus.$off('reloadTask')
    // 清空图片缓存
    Object.values(this.pictureList).forEach(item => {
      window.URL.revokeObjectURL(item)
    })
  },
  methods: {
    async getDataList () {
      const params = {
        pageNo: 1,
        limit: 99999999,
        appType: 3
      }
      const res = await experience.manage.list(params)
      if (res.code !== 0) return false
      this.industryList = res.data.records
      this.industryList.forEach(item => {
        this.getTopImage(item.id).then(img => {
          this.$set(this.pictureList, item.id, img.size === 0 ? '' : window.URL.createObjectURL(img))
        })
      })
    },
    async getTopImage (id) {
      const res = await experience.experienceInfo.getTopImage(id)
      return res
    },
    toExperience ({ id, title }) {
      this.$router.push({
        path: '/experience/industry/panelDefect',
        query: { id }
      })
      experience.manage.actionAlgRequest({
        taskId: id,
        title
      })
    }
  }
}
</script>

<style lang="less" scoped>
.industry{
  &-content{
    &-item{
      float: left;
      width: 25%;
      padding: 10px;
      .tcl-card{
        overflow: hidden;
        /deep/ .tcl-card-cover{
          height: 20vh;
          img{
            width: 100%;
            height: 100%;
          }
          .no-image{
            background: #0072c66e;
            color: #fff;
            font-size: 100px;
            text-align: center;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            & > span {
              font-size: 25px;
            }
          }
        }
        /deep/ .tcl-card-body{
          height: 124px;
        }
        /deep/ .tcl-card-meta-description{
          display: -webkit-box;
          overflow: hidden;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }
        .toExperience{
          position: absolute;
          bottom: -50px;
          right: -50px;
          background: #00000073;
          color: #fff;
          height: 50px;
          width: 50px;
          border-radius: 100% 0 0;
          transition: 0.3s all;
          line-height: 50px;
          text-align: right;
          padding-right: 10px;
          padding-top: 5px;
          font-size: 20px;
          &:hover{
            color: #00c4ff;
          }
        }
      }
      .tcl-card:hover{
        .toExperience{
          bottom: 0;
          right: 0;
        }
      }
    }
  }
}
</style>