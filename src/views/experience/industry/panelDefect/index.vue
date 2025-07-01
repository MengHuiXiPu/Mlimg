<template>
  <div class="panelDefect">
    <div class="panelDefect-content">
      <div class="panelDefect-content-img">
        <img ref="img" :src="imgSrc" :class="maxInfoWidth && 'maxIsWidth'">
        <div
          class="Detect"
          :class="[loading && 'loading']"
          v-if="loading"
          :style="{
            paddingTop: shdrow.top + 'px',
            paddingLeft: shdrow.left + 'px'
          }">
          <img
            :src="imgSrc"
            :width="shdrow.width"
            :height="shdrow.height">
        </div>
        <div class="result" :class="[hiddenLeft && 'leftHidden']">
          <pre>Result：{{ result || '请上传图片或者选择一张示例图' }}</pre>
          <div
            class="hiddenBtn"
            @click="hiddenLeft = !hiddenLeft"
          >
            <p-icon :type="hiddenLeft ? 'caret-right' : 'caret-left'" />
          </div>
        </div>
      </div>
      <div class="panelDefect-content-footer">
        <p-input-search class="imgUrl" placeholder="请输入图片URL地址，点搜索按钮或者按Enter键进行确认" @search="imgToFile" />
        <div class="footer-right">
          <span>或</span>
          <p-button type="primary" @click="clickUpload">上传图片</p-button>
          <input
            multiple
            :accept="accept.toString()"
            type="file"
            hidden
            ref="fileUpload"
            @change="uploadImage"
          >
          <p-button type="primary" :disabled="!this.result" @click="resultDownload">复制结果</p-button>
        </div>
        <p>图片格式：JPEG、JPG、BMP；图片大小：小于3MB；图片分辨率：大于64*64</p>
      </div>
    </div>
    <div class="panelDefect-list">
      <p>示例图</p>
      <div class="panelDefect-list-content">
        <div
          class="panelDefect-list-content-item"
          v-for="item in imgList"
          :key="item.id"
          @click="selectImage(item)">
          <img :src="pictureList[item.id]">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import img from '@/assets/img/2.jpg'
import experience from '@/api/experience'
export default {
  name: 'panelDefect',
  data () {
    return {
      imgList: [],
      taskId: null,
      imgSrc: img,
      hiddenLeft: false,
      maxInfoWidth: false,
      pictureList: {},
      result: '',
      loading: false,
      shdrow: {
        width: '',
        height: '',
        left: 0,
        top: 0
      },
      accept: ['.jpg', '.png', '.jpeg']
    }
  },
  mounted () {
    this.taskId = this.$route.query.id
    this.getImgList()
    window.addEventListener('resize', this.imgResize, false)
    this.$refs.img.onload = () => {
      this.imgResize()
    }
  },
  beforeDestroy () {
    // 清空图片缓存
    Object.values(this.pictureList).forEach(item => {
      window.URL.revokeObjectURL(item)
    })
  },
  methods: {
    async getImgList () {
      const params = {
        pageNo: 1,
        limit: 99999999,
        taskId: this.taskId
      }
      const res = await experience.manageImage.list(params)
      if (res.code !== 0) return false
      this.imgList = res.data.records
      this.imgList.forEach(picId => {
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
    async uploadImage (e) {
      const file = e.target.files[0]
      if (!this.accept.includes(file.name.substring(file.name.lastIndexOf('.')).toLowerCase())) {
        this.$message.error(`请上传 ${this.accept.toString()} 格式的文件`)
        return false
      }
      this.loading = true
      this.fileToImage(file)
      await this.uploadFile(file)
      this.$refs['fileUpload'].value = ''
    },
    async uploadFile (file) {
      const formData = new FormData()
      formData.append('taskId', this.taskId)
      formData.append('file', file)
      const res = await experience.experienceInfo.upload(formData)
      this.loading = false
      if (res.code !== 0) return false
      console.log(res)
      if (res.data === 'closed') {
        await experience.manage.actionAlgRequest({
          taskId: this.taskId,
          title: ''
        })
        this.uploadFile(file)
      } else {
        this.result = res.data || '暂无结果'
        this.hiddenLeft = true
      }
    },
    clickUpload () {
      if (this.loading) {
        this.$message.warning('请等待当前图片识别完成')
        return false
      }
      this.$refs['fileUpload'].click()
    },
    resultDownload () {
      const input = document.createElement('input')
      input.type = 'text'
      input.value = this.result
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    },
    async selectImage (item) {
      if (this.loading) {
        this.$message.warning('请等待当前图片识别完成')
        return false
      }
      this.loading = true
      this.imgSrc = this.pictureList[item.id]
      const res = await experience.experienceInfo.selectImage({
        imgId: item.id,
        taskId: this.taskId
      })
      this.loading = false
      if (res.code !== 0) return false
      console.log(res)
      if (res.data === 'closed') {
        await experience.manage.actionAlgRequest({
          taskId: this.taskId,
          title: ''
        })
        this.selectImage(item)
      } else {
        this.result = res.data || '暂无结果'
        this.hiddenLeft = true
      }
    },
    fileToImage (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file) //读取图像文件 result 为 DataURL, DataURL 可直接 赋值给 img.src
      reader.onload = (event) => {
        this.imgSrc = event.target.result //base64
      }
    },
    dataURLtoFile (dataurl, fileName) {
      const arr = dataurl.split(',')
      const mime = arr[0].match(/:(.*?);/)[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new File([u8arr], fileName, {type: mime})
    },
    imgToFile (val) {
      if (this.loading) {
        this.$message.warning('请等待当前图片识别完成')
        return false
      }
      if (!val) {
        this.$message.warning('图片url不能为空')
        return false
      }
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.setAttribute('crossOrigin', 'Anonymous')
      img.src = val
      this.imgSrc = val
      img.onload = (e) => {
        this.loading = true
        canvas.height = img.height
        canvas.width = img.width
        ctx.drawImage(img, 0, 0)
        const dataURL = canvas.toDataURL('image/png')
        const file = this.dataURLtoFile(dataURL, new Date().getTime() + '.png')
        if (file.size > 3 * 1024 * 1024 * 1024) {
          this.$message.warning('图片大小不能超过3MB，请重新选择图片')
          return false
        }
        this.uploadFile(file)
      }
      img.onerror = (e) => {
        this.$message.error('URL解析失败，请检查图片地址是否正确')
      }
    },
    imgResize () {
      this.$nextTick(() => {
        const img = this.$refs.img
        const parent = img.parentElement
        this.maxInfoWidth = parent.offsetHeight / img.naturalHeight < parent.offsetWidth / img.naturalWidth
        this.$nextTick(() => {
          this.shdrow = {
            width: img.offsetWidth + 'px',
            height: img.offsetHeight + 'px',
            left: (parent.offsetWidth - img.offsetWidth) / 2,
            top: (parent.offsetHeight - img.offsetWidth) / 2
          }
        })
      })
    }
  }
}
</script>

<style lang="less" scoped>
.panelDefect{
  padding: 5px 0;
  height: 100%;
  &-content{
    width: calc(100% - 250px);
    height: 100%;
    float: left;
    &-img{
      height: calc(100% - 95px);
      overflow: hidden;
      position: relative;
      background: #000;
      & > img{
        width: 100%;
        height: auto;
        left: 50%;
        transform: translate(-50%, -50%);
        &.maxIsWidth{
          width: auto;
          height: 100%;
        }
      }
      img{
        position: absolute;
        top: 50%;
      }
      // .maxIsWidth{
      //   width: auto;
      //   height: 100%;
      // }
      .Detect {
        // width: 20%;
        height: 100%;
        position: absolute;
        top: 0;
        overflow: hidden;
        border-right: 2px solid chartreuse;
        &.loading{
          animation: Detect 5s infinite linear alternate;
        }
        img{
          filter: grayscale(100%);
          transform: translate(0, -50%);
        }
      }
      .result{
        width: 250px;
        height: 100%;
        position: absolute;
        right: -250px;
        top: 0;
        background: #00000070;
        color: #fff;
        padding: 10px;
        transition: 0.5s;
        &.leftHidden{
          right: 0;
        }
        pre{
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .hiddenBtn{
          cursor: pointer;
          color: #fff;
          background: #00000070;
          width: 9px;
          height: 46px;
          position: absolute;
          right: 100%;
          top: 48%;
          line-height: 46px;
          border-left: none;
          font-size: 12px;
          border-radius: 8px 0 0 8px;
        }
      }
    }
    &-footer{
      padding-top: 20px;
      .imgUrl{
        width: calc(100% - 205px);
      }
      .footer-right{
        float: right;
        & > * {
          margin-left: 10px;
        }
      }
      p{
        margin-top: 10px;
        color: #ccc;
        font-size: 12px;
      }
    }
  }
  &-list{
    width: 250px;
    height: 100%;
    float: left;
    p{
      text-align: center;
    }
    &-content{
      height: calc(100% - 40px);
      overflow-y: auto;
      &-item{
        width: 50%;
        float: left;
        padding: 10px;
        height: 10vh;
        cursor: pointer;
        img{
          width: 100%;
          height: 100%;
        }
      }
    }
  }
  @keyframes Detect {
    from {
      width: 0;
      // margin-right: 100%;
    } to {
      width: calc(100% - 2px);
      // margin-right: 0;
    }
  }
}
</style>