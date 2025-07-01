import {
  getPicture,
  getPictureFileIds
} from "@/api/modelManage"
import {
  getPictureIdPageList
} from "@/api/dataCenter"
// import ImageCache from "@/utils/ImageCache";

export default {
  data() {
    return {
      countNum: 2,
      totalNum: 0,
      loadLength: this.pagination.pageSize,
      // 用于存储加载了哪些页。
      pageArr: [],
      // selectMenu下所有的图片id列表（只有id）
      pictureAllList: [],
      visibleItems: [], // 当前可见区域的数据
      itemHeight: 108, // 列表项高度
      visibleCount: this.pagination.pageSize, // 可见项数量
      startIndex: 0, // 可见区域的起始索引
      paddingTop: 0
    }
  },
  computed: {
    loadDisabled() {
      return this.pictureLoadList.length >= this.totalNum
    },
    scrollWrapper() {
      return {
        height: this.processPictureList.length * this.itemHeight + 'px',
        paddingTop: this.paddingTop + 'px'
      }
    }
  },
  watch: {
    selectMenu(val) {
      this.getAllRecords(val);
    }
  },
  methods: {
    async getAllRecords(val) {
      const params = this.datasetId + '_' + val
      const res = await getPictureFileIds(params)//获取图片列表id
      this.pictureAllList = res.data;
      this.totalNum = res.data.length;
    },
    loadList() {
      // 跳过已加载过得页数据
      if (this.pagination.current === this.countNum) {
        this.countNum++
        this.loadList()
      }

      // 分页参数
      const params = {
        categoryName: this.selectMenu,
        id: this.datasetId,
        limit: this.loadLength,
        pageNo: this.countNum,
        markRange: 0,
        reviewRange: 0,
      };
      getPictureIdPageList(params).then(res => {
        const singlePageRecords = res.data.records
        this.pictureLoadList = this.pictureLoadList.concat(singlePageRecords)

        singlePageRecords.map(record => {
          return getPicture(record.id, 'thumbnail_with_bbox').then(res => {
            const url = window.URL.createObjectURL(res)
            record.url = url
            this.$set(this.pictureLoadMap, record.id, url);
            if (this.taskId) {
              this.setGroupLoading(record.id);
            }
          })
        })

        // singlePageRecords.forEach((ele)=> {
        //   ImageCache.getImage(ele.id).then((cachedImageData) => {
        //     if (cachedImageData == null) {
        //       getPicture(ele.id).then((res2) => {
        //         ImageCache.saveImage(ele.id, res2);
        //       })
        //     }
        //   });
        // })

      })
      this.pageArr.push(this.countNum)
      this.countNum++
      console.log(this.pageArr)
    },
    handleScroll(top) {
      // 计算当前滚动到的索引
      const scrollTop = top;
      this.paddingTop = scrollTop
      const index = Math.floor(scrollTop / this.itemHeight);
      // 判断是否需要更新可见区域的数据
      if (index !== this.startIndex) {
        this.startIndex = index;
        this.updateVisibleItems();
      }
    },
    updateVisibleItems() {
      // 根据当前可见区域的起始索引和可见项数量，更新可见区域的数据
      this.visibleItems = this.processPictureList.slice(
        this.startIndex,
        this.startIndex + this.visibleCount
      );
    },
  }
}