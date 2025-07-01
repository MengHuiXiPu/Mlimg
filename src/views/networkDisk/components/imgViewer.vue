<template>
  <div>
   <viewer
          v-show="showViewer"
           :options="options"
           :images="images"
           @inited="inited"
           class="viewer" ref="viewer"
   >
     <img v-for="src in images" :src="src.source" :key="src.source" />
     <!-- <template slot-scope="scope">
       <div v-for="(image,index) in scope.images" :key="index">
         <img :src="image.source">
       </div>
     </template> -->
   </viewer>
    <!-- <div v-for="(image,index) in images" :key="index">
      <img :src="image.source">
    </div> -->
  </div>
</template>
<script>
import Bus from '../bus'
import fileApi from "@/api/file-api";
// import 'viewerjs/dist/viewer.css'
// import Viewer from "v-viewer/src/component.vue"


export default {
  name: "ImageViewer",
  components: {
  },
  props: {
    file: {
      type: Object,
      default: function () {
        return {}
      }
    },
    shareId: {
      type: String,
      default: undefined
    },
    fileList: {
      type: Array,
      default: function () {
        return []
      }
    },
    status: {
      type: Boolean,
      default: function () {
        return false
      }
    },
    initialIndex: {
      type: Number,
      default: 0,
    }
  },
  computed: {},
  data() {
    // this.viewerOptions = {
    //   backdrop: true, // 是否启用播放模态背景[布尔值/字符串：默认true](不启用时，点击空白处不会退出播放，仅点击右上角关闭按钮才会退出播放)
    //   inline: false, // 启用inline模式[布尔值：默认false]
    //   button: true, // 显示右上角关闭按钮[布尔值：默认true]
    //   navbar: false, // 显示缩略图导航[布尔值/数字：默认true]
    //   title: false, // 显示当前图片的标题(显示alt属性或从URL解析出的图片名称)[布尔值/数字/方法/数组：默认true]
    //   toolbar: false, // 显示工具栏、自定义工具栏[布尔值/数字/对象：默认true]
    //   tooltip: true, // 显示缩放百分比[布尔值：默认true]
    //   movable: true, // 图片是否可移动[布尔值：默认true]
    //   zoomable: true, // 图片是否可缩放[布尔值：默认true]
    //   rotatable: true, // 图片是否可旋转[布尔值：默认true]
    //   scalable: true, // 图片是否可翻转[布尔值：默认true]
    //   transition: true, // 使用CSS3过渡[布尔值：默认true]
    //   fullscreen: true, // 播放时是否全屏[布尔值/全屏配置：默认true]
    //   keyboard: true, // 是否支持键盘[布尔值：默认true]
    //   url: 'src' // 播放时图片地址 URL 来源。[字符串/方法：默认src](如果是字符串，则应该是每个图像元素的属性之一。 如果是方法，则应该返回一个有效的图像URL)
    // }
    return {
      imageThumbnailUrl: `/view/thumbnail`,
      shareImageThumbnailUrl: `/public/s/view/thumbnail`,
      publicImageThumbnailUrl: '/public/s/view/thumbnail',
      currentSrc: '',
      images: [],
      imagesFristIndex: -1,
      imagesLastIndex: -1,
      imageFiles: [],
      vantImagePreview: null,
      $viewer: null,
      showViewer:false,
      // pc: this.$pc,
      options: {
        url: 'src',
        initialViewIndex: 3,
        ready: function (e) {
        },
        show: function (e) {
        },
        shown: function (e) {
        },
        hide: function (e) {
        },
        hidden: function () {
          Bus.$emit('updateImageViewerStatus', false)
        },
        view: function (e) {
        },
        viewed: function (e) {
        },
        zoom: function (e) {
        },
        zoomed: function (e) {
        }
      },
    }
  },
  watch: {
    status: function (visible) {
      // console.log()
      // this.pc = this.$pc
      // console.log(this.pc, 'xxxxxxxxxx')
      if (visible) {
        this.showViewer = true;
        this.images = [];
        this.imageFiles = this.fileList.filter(element => !element.isFolder && element.contentType.startsWith('image'))
        console.log(this.imageFiles,'图片文件')
        const promises = this.imageFiles.map((element) => fileApi.getPreviewFile({id: element.id}))         
        Promise.all(promises).then(lists => {
          lists.forEach(list => {
            console.log(list,"预览的结果");
            let imageUrL = null;
            const blobData = new Blob([list], {type: 'image/*'});
            imageUrL = window.URL.createObjectURL(blobData);
            this.images.push({
              source: imageUrL
            })
          })
        }).finally(() => {
          this.show(this.initialIndex)
        });
      }
      else{
        this.showViewer = false;
      }
    }
  },
  mounted() {
    let that = this;
    Bus.$on('updateImageViewerStatus', () => {
      this.imagesFristIndex = -1
      this.imagesLastIndex = -1
      // this.$emit('update:status', false)
      that.$emit("hideImageViewer");
    })
  },
  methods: {
    inited(viewer) {
      this.$viewer = viewer
    },
    getImageUrl(element) {
      let imageUrL = null
      fileApi.getPreviewFile({
            id: element.id
          }).then(res =>{
            console.log(res,"预览的结果")
            const blobData = new Blob([res], {type: 'image/*'});
            // const blob = new Blob([res], { type: element.contentType });
            imageUrL = window.URL.createObjectURL(blobData);
            // console.log(imageUrL, '图片的url');
            this.images.push({
              // thumbnail: this.getImageUrlByThumbnail(element),
              source: imageUrL
            })
            // window.URL.revokeObjectURL(imageUrL); // 释放掉blob对象
            return imageUrL
          })          
      // let url = fileConfig.previewUrl(this.$store.state.user.name, element, this.$store.getters.token)
      // if (this.shareId) {
      //   url = fileConfig.publicPreviewUrl(element, window.shareId, this.$store.getters.shareToken)
      // }
      
    },
    // 该方法貌似未使用，上方调用处被注释掉了
    // getImageUrlByThumbnail(file) {
    //   if (this.$store.getters.token){
    //     return `${this.imageThumbnailUrl}/${file.name}?jmal-token=${this.$store.state.user.token}&name=${this.$store.state.user.name}&id=${file.id}`
    //   } else {
    //     if (this.$store.getters.shareToken) {
    //       return `${this.shareImageThumbnailUrl}/${file.name}?share-token=${this.$store.getters.shareToken}&id=${file.id}`
    //     }
    //     return `${this.publicImageThumbnailUrl}/${file.name}?id=${file.id}`
    //   }
    // },
    show(viewIndex) {
      let index = 0
      if (viewIndex) {
        index = viewIndex
      }
      this.$viewer.index = index
      this.$refs.viewer.$viewer.show()
      // this.$viewer.show()
      // this.$viewer.view(index)
      // if (this.$pc) {
      //   this.$viewer.index = index
      //   this.$viewer.show()
      // } else {
      //   this.imagePreview(index)
      // }
    },
  }
}
</script>

<style lang="scss" scoped>
// .viewer {
//   display: none;
// }

// .viewer-backdrop {
//   background-color: rgba(0, 0, 0, 0.7);
// }
.viewer-w {
  padding: 25px;
  background: #ffffff;
}
.viewer {
  img{
    width:100px;
    height: 100px;
  }
  img:not(:last-child) {
    margin-right: 15px;
  }
}
</style>
