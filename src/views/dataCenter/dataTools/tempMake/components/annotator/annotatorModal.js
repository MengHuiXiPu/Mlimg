import axios from "axios";
import renderSvg from "./cocoAnnotation/mixins/renderSvg";
import loadPicture from "./loadPicture.js";
import { getMarkPositions,debounce, } from "@/components/cocoAnnotation/libs/config";
import { mapGetters, mapMutations, mapState } from "vuex";
import { getSingleDataListDetailById } from "@/api/dataCenter";
import { getPicture } from "@/api/modelManage";
import ImageCache from "@/utils/ImageCache";
import { getSystemConfig } from "@/api/dataCenter";
export default {
  mixins: [renderSvg, loadPicture],
  data() {
    return {
      // componentKey: { id: null, action: "" },
      focusId: null,
      topHover: null,
      rightHover: null,
      pictureLoadMap: {},
      // 已加载的图片列表？应该是processPictureList+confirmPictureList = pictureLoadList
      pictureLoadList: [],
      // 上边已标注图片列表
      confirmPictureList: [],
      // 右边未标注图片列表
      processPictureList: [],
      timer: null,
      hasAutoTask: false,
      showRightBox: true,
      showTopBox: false,
      // 有时要改变modalBody的高度
      modalBody: null,
      // markTaskId
      markTaskId: null,
      lastMode: "segment",
      datasetName: "",
      imageUrl: "",
      targetTop: 0,
      checkBoxVal: ["hasNotDo"],
      createBy: "admin",
      // 需要标注的图片id集合，分类算法自动标注时使用，当该值不为null时，说明执行过自动标注分类算法
      annotateTargetIds: null,
      datasetDetail: '', //数据集详情数据
      // loadAnnotationsFinished: false, //切换图片时，会加载该图片的标注数据，并将其渲染在camvas上，该标志位变量记录这个动作的完成结果，完成时，切换下一张图片才会触发上一张图片标注信息的保存（这种方式仅在两次点击之间有效，不断的切换会失效）
      autoSaveAnnotationsFlag: true, //为true时 切换图片才会保存上一张图片的标注
      // 自动保存标注信息的定时器，目前设定为3s，每次切换图片重置，如果3s内没有切换图片，置为true(用户有修改标注的操作的话，基本是需要3s以上的时间的)
      autoSaveAnnotationsTimer: null, 
    };
  },
  computed: {
    ...mapGetters(["GroupLoading"]),
    ...mapState({
      taskId: (state) => state.annotator.taskId,
    }),
    previewSrc() {
      if (this.rightHover) return this.pictureLoadMap[this.rightHover];
      else return this.pictureLoadMap[this.topHover];
    },
    fixedBoxStyle() {
      return {
        height: this.confirmPictureList.length ? "auto" : "100px",
      };
    },
    imgListStyle() {
      return {
        width: this.processPictureList.length ? "auto" : "166px",
        marginLeft: "0px",
        backgroundColor: "#a7cdff",
      };
    },
    hasXScroll() {
      return this.confirmPictureList.length * 158 > window.innerWidth;
    },
    // 根据数据集类型确定，取值范围 segment，label，detect, 对应分割，分类，目标检测， （未定义）
    mode() {
      if(this.dlTagType === '分类') {
        return "label"
      }else if (this.dlTagType === '分割') { //
        return "segment"
      }else if (this.dlTagType === '目标检测') {
        return "detect"
      }else { //其他（未定义的类型）：会议讨论是在进入标注页面之前拦截转换，具体怎么做还未明确
        // ...默认segment
        return "unknown"
      }
    }
  },
  provide() {
    return {
      modalInstance: this,
    };
  },
  watch: {
    pictureList: {
      handler(newArray, oldArray) {
        const fn = () => {
          this.pictureLoadList = JSON.parse(JSON.stringify(newArray));
          this.pictureLoadList.forEach(async (ele) => {
            // 获取缓存
            if (this.pictureLoadMap[ele.id]) {
              this.$set(ele, "url", this.pictureLoadMap[ele.id]);
            } else {
              getPicture(ele.id, "thumbnail_with_bbox").then((res) => {
                const url = window.URL.createObjectURL(res);
                this.$set(ele, "url", url);
                this.$set(this.pictureLoadMap, ele.id, url);
              });
            }

            ImageCache.getImage(ele.id).then((cachedImageData) => {
              if (cachedImageData == null) {
                getPicture(ele.id).then((res2) => {
                  ImageCache.saveImage(ele.id, res2);
                });
              }
            });
          });
        };
        if (newArray.length !== oldArray.length) {
          // 执行命中逻辑，pictureList.length发生变化, 初始化 this.pictureLoadList
          fn();
          return;
        }
        for (const [index, newItem] of newArray.entries()) {
          const oldItem = oldArray[index];
          if (newItem.id !== oldItem.id) {
            // 执行命中逻辑，id 属性发生变化的处理
            fn();
            break;
          }
        }
      },
    },
    pictureLoadList: {
      handler(newArray, oldArray) {
        const fn = () => {
          // 执行命中逻辑
          this.confirmPictureList = newArray.filter((item) => {
            return item.confirmMark === 1;
          });
          this.processPictureList = newArray.filter((item) => {
            return item.confirmMark === 0;
          });
          this.updateVisibleItems();
          // 加载更多: 打开状态下，不要让右侧列表图片为空或利于16张
          if (
            this.isShow &&
            newArray.length < this.pictureAllList.length &&
            this.processPictureList.length < this.loadLength
          ) {
            this.loadList();
          }
        };
        if (newArray.length !== oldArray.length) {
          // 执行命中逻辑，pictureList.length发生变化
          fn();
          return;
        }
        for (const [index, newItem] of newArray.entries()) {
          const oldItem = oldArray[index];
          if (newItem.id !== oldItem.id) {
            // 执行命中逻辑，id 属性发生变化的处理
            fn();
            break;
          }
        }
      },
      deep: true,
    },
    async isShow(val) {
      // 如果弹框打开
      if (val) {
        this.resetState()
        // 确认选中id
        this.focusId = this.imageId;
        // this.componentKey = {
        //   id: this.focusId,
        //   action: "updatePhoto",
        // };

        const res = await getPicture(this.imageId);
        this.imageUrl = window.URL.createObjectURL(res);
        // console.log(this.imageUrl);
        // 获取数据集详情，主要是获取自动标注任务状态，根据状态，来判断是否继续轮询。
        const datasetDetail = await getSingleDataListDetailById(this.datasetId);
        this.datasetDetail = datasetDetail?.data || {}
        // console.log(datasetDetail);
        this.markTaskId = datasetDetail.data.markTaskId;
        this.datasetName = datasetDetail.data.dlName;
        this.createBy = datasetDetail.data.createBy;
        if (datasetDetail.data.autoMarkTaskStatus === 1) {
          this.setTaskId(datasetDetail.data?.markTaskId)
          this.hasAutoTask = true
        }

        // 如果不是从第一页进入，则先把当前页放在最前面，再把第一页放在当前页后面。用作load加载列表
        if (this.pageArr.length === 0) {
          this.countNum =
            this.pagination.current !== 1 ? 1 : this.pagination.current + 1;
          this.pageArr.push(this.pagination.current);
        }
        // 加载更多: 打开状态下，不要让右侧列表图片为空或利于16张
        if (
          this.pictureLoadList.length < this.pictureAllList.length &&
          this.processPictureList.length < this.loadLength
        ) {
          this.loadList();
        }

        // 获取 modal 对应的 DOM 元素
        this.modalBody = document.querySelector(".ant-modal-body");
        // const heightVal =
        //   this.confirmPictureList.findIndex((ele) => ele.id === this.focusId) >
        //   -1
        //     ? 104
        //     : 100;
        // this.modalBody.style.height = `calc(100% - ${
        //   this.hasXScroll ? 111 : heightVal
        // }px)`;
      } else {
        this.hasAutoTask = false;
        this.modalBody = null;
        this.targetTop = 0;
        this.imageUrl = "";
        this.checkBoxVal = ["hasNotDo"];
        // this.pageArr.length = 0;
        this.handleScroll(0);
      }
    },
    selectMenu() {
      this.pageArr = [];
    },
    // topBox伸缩时，要对应改变modalBody的高度。
    showTopBox(val) {
      this.$nextTick(() => {
        this.modalBody.style.transition = "height 0.5s ease-out";
        const heightVal =
          this.confirmPictureList.findIndex((ele) => ele.id === this.focusId) >
          -1
            ? 104
            : 100;
        this.modalBody.style.height = val
          ? `calc(100% - ${this.hasXScroll ? 111 : heightVal}px)`
          : "100%";
      });

      requestAnimationFrame(() => {
        // 在下一帧结束时移除过渡效果
        this.modalBody.style.transition = "";
      });
    },
    hasXScroll(val) {
      if (this.showTopBox) {
        const heightVal =
          this.confirmPictureList.findIndex((ele) => ele.id === this.focusId) >
          -1
            ? 104
            : 100;
        this.modalBody &&
          (this.modalBody.style.height = `calc(100% - ${
            val ? 111 : heightVal
          }px)`);
      }
    },
  },
  created() {
  },
  destroyed() {
    window.clearTimeout(this.timer);
    clearTimeout(this.autoSaveAnnotationsTimer);
  },
  methods: {
    ...mapMutations(["clearLoading", "setGroupLoading", "cancelLoadingItem", "setTaskId"]),
    // 后续当图片标注情况更新时可以调用，会刷新预览图片和当前右侧显示的图片实时情况
    getImg(imageId) {
      getPicture(imageId, "thumbnail_with_bbox").then((res) => {
        const url = window.URL.createObjectURL(res);
        this.$set(this.pictureLoadMap, imageId, url);
        const currentPicture = this.pictureLoadList.find(
          (item) => item.id === imageId
        );
        if (currentPicture) {
          currentPicture.url = url;
        }
      });
      ImageCache.getImage(imageId).then((cachedImageData) => {
        if (cachedImageData == null) {
          getPicture(imageId).then((res2) => {
            ImageCache.saveImage(imageId, res2);
          });
        }
      });
    },
    /**
     * 根据图片id加载缩略图, 并更新到pictureLoadList
     * @returns Promise
     */
    loadThumbnail(imageId) {
      return new Promise((resolve, reject) => {
        getPicture(imageId, "thumbnail_with_bbox").then((res) => {
          const url = window.URL.createObjectURL(res);
          this.$set(this.pictureLoadMap, imageId, url);
          this.pictureLoadList.forEach((item) => {
            if (item.id === imageId) {
              item.url = url;
            }
          });
          resolve(res)
        }).catch(e => {
          this.$message.warning(`缩略图: ${imageId}加载失败, ${e?.response?.status}`)
          reject(e?.response)
        })
      })
    },
    showPageList(val) {
      this.showRightBox = val.includes("hasNotDo");
      this.showTopBox = val.includes("hasdone");
      this.checkBoxVal = val;
      // 重新渲染子组件，为了重新initCanvas
      // 延时1s这写法真绝了，你太聪明啦
      // setTimeout(() => {
      //   // this.componentKey = {
      //   //   id: this.focusId,
      //   //   action: "changeHeight",
      //   // };
      //   this.$refs.annotator.reload(this.focusId, this.imageUrl);
      // }, 1000);
      this.$nextTick(() => {
        requestAnimationFrame(()=> {
          // this.$refs.annotator.reload(this.focusId, this.imageUrl, { refit: true });
          this.$refs.annotator.resetCanvasSize()
        })
      })
    },

    // url
    imgSrc(item) {
      return item.url || require("@/assets/images/place.gif");
    },
    handleHover(id, type = "") {
      if (type === "top") this.topHover = id;
      else this.rightHover = id;
    },
    handleHoverMove(id, type = "") {
      if (type === "top") this.topHover = null;
      else this.rightHover = null;
    },
    close() {
      this.$refs.annotator.current.annotation = -1;
      // 先保存，再销毁组件
      // this.$refs.annotator.save(() => {
      //   // 关掉loading
      //   this.clearLoading();
      //   if(!this.focusId) {
      //     this.$emit("update:isShow", false);
      //     this.$emit("on-fresh");
      //     return
      //   }
      //   const loading = this.$GLoading('数据保存中...')
      //   // 不知道要求是否应该保存标注，但是既然保存了，那么也应该更新更新缩略图
      //   getPicture(this.focusId, "thumbnail_with_bbox").then(res => {
      //     const url = window.URL.createObjectURL(res);
      //     this.pictureLoadList.forEach((ele) => {
      //       if (ele.id === this.focusId) {
      //         ele.url = url;
      //         this.$set(this.pictureLoadMap, this.focusId, url);
      //       }
      //     });
      //   }).finally(() => {
      //     loading.close();
      //     // 去除选中
      //     this.focusId = '';
      //     this.$emit("update:isShow", false);
      //     this.$emit("on-fresh");
      //   })
        
      // });
      this.focusId = '';
      this.$emit("update:isShow", false);
      this.$emit("on-fresh");
    },
    // 确认
    handleConfirm(item, confirmVal) {
      if (!this.confirmPictureList.length) this.topHover = null;
      if (!this.visibleItems.length) this.rightHover = null;
      window.clearTimeout(this.timer);
      axios
        .post(`/api/v1/datacenter/dataListFileDetail/confirmMark/${item.id}`, {
          confirmMark: confirmVal,
        })
        .then((res) => {
          if (res.data.status) {
            this.pictureLoadList.forEach((ele) => {
              if (ele.id === item.id) {
                ele.confirmMark = confirmVal;
              }
            });
            // 右侧图片区域的index
            let processIndex;
            if (confirmVal === 1) {
              // 移除annotateTargetIds中对应的图片id
              if(Array.isArray(this.annotateTargetIds)) {
                let idx = this.annotateTargetIds.findIndex(id => id == item.id)
                this.annotateTargetIds.splice(idx, 1)
              }
              const index = this.processPictureList.findIndex(
                (ele) => ele.id === item.id
              );
              processIndex = index; 
              if(!this.confirmPictureList.find(c => c.id === item.id)) { //避免重复操作
                this.processPictureList.splice(index, 1);
                this.confirmPictureList.push(item);
              }
              // 消除掉被移除的图片预览
              this.handleHoverMove(item.id, 'right');
              // this.renderConfirmListSvg();
            } else {
              // 将图片id添加到annotateTargetIds
              if(Array.isArray(this.annotateTargetIds)) {
                this.addAnnotateTargetIds([item.id])
              }
              const index = this.confirmPictureList.findIndex(
                (ele) => ele.id === item.id
              );
              if(!this.processPictureList.find(c => c.id === item.id)) { //避免重复操作
                this.confirmPictureList.splice(index, 1);
                this.processPictureList.push(item);
              }
              // 消除掉被移除的图片预览
              this.handleHoverMove(item.id, 'top');
              // this.renderListSvg();
            }
            this.updateVisibleItems();
            this.nextPhoto(processIndex);
            if (this.showTopBox) {
              const heightVal =
                this.confirmPictureList.findIndex(
                  (ele) => ele.id === this.focusId
                ) > -1
                  ? 104
                  : 100;
              this.modalBody &&
                (this.modalBody.style.height = `calc(100% - ${
                  this.hasXScroll ? 111 : heightVal
                }px)`);
            }
          }
        })
        .catch((error) => {
          this.$message.error(error);
        });
    },
    // 批量确认
    batchConfirm(method, val) {
      // 获取待处理的图片列表
      axios
        .put(`/api/v1/datacenter/dataListFileDetail/batchConfirmMark`, {
          candidateImageIds: this.processPictureList.map((item) => item.id),
          method: method,
          threshold: method === "threshold" ? val : undefined,
        })
        .then((res) => {
          const confirmedImageIds = res.data.confirmedImageIds;
          this.pictureLoadList.forEach((ele) => {
            // if (ele.id === item.id) {
            //   ele.confirmMark = confirmVal;
            // }
            if (confirmedImageIds.includes(ele.id)) {
              ele.confirmMark = 1;
            }
          });
          const filterListA = this.processPictureList.filter(
            (item) => !confirmedImageIds.includes(item.id)
          );
          const filterListB = this.processPictureList.filter((item) =>
            confirmedImageIds.includes(item.id)
          );
          this.processPictureList = filterListA;
          this.confirmPictureList = this.confirmPictureList.concat(filterListB);
          this.updateVisibleItems();
          // 如果是由前端记录标注图片列表（执行过分类标注），那么需要从annotateTargetIds中移除confirmedImageIds
          if(Array.isArray(this.annotateTargetIds)) {
            confirmedImageIds.forEach(imageId => {
              let idx = this.annotateTargetIds.findIndex(id => id == imageId)
              this.annotateTargetIds.splice(idx, 1)
            })
            
          }
          // 加载更多: 打开状态下，不要让右侧列表图片为空或利于16张
          if (
            this.pictureLoadList.length < this.pictureAllList.length &&
            this.processPictureList.length < this.loadLength
          ) {
            this.loadList();
          }
          if (this.showTopBox) {
            const heightVal =
              this.confirmPictureList.findIndex(
                (ele) => ele.id === this.focusId
              ) > -1
                ? 104
                : 100;
            this.modalBody &&
              (this.modalBody.style.height = `calc(100% - ${
                this.hasXScroll ? 111 : heightVal
              }px)`);
          }
        });
    },
    //清除已有的path对象
    clearPath() {
      this.$refs.annotator.removeLine();
      this.$refs.annotator?.$refs?.polygon.deletePolygon();
      this.$refs.annotator?.$refs?.bbox.deleteBbox();
      this.$refs.annotator?.$refs?.brush.removeBrush();
    },
    // 列表切换图片，会让annotator组件重新渲染
    handleFocus(item) {
      if (this.focusId === item.id) {
        return;
      }
      // 清除已存在的path对象
      this.clearPath();
      // URL.revokeObjectURL(this.imageUrl)
      // this.imageUrl = ""
      this.$refs.annotator.current.annotation = -1;
      this.setGroupLoading(item.id);
      // 先保存，再切换图片，重新渲染annotator标注
      new Promise((resolve, reject) => {
        this.autoSaveAnnotationsFlag &&
          this.$refs.annotator.save(
            async (id, mode) => {
              const res1 = await getPicture(id, "thumbnail_with_bbox");
              const smallUrl = window.URL.createObjectURL(res1);
              const currPicture = this.pictureLoadList.find(
                (ele) => ele.id === id
              );
              if (currPicture) {
                currPicture.url = smallUrl;
                this.$set(this.pictureLoadMap, id, smallUrl);
              }
              this.lastMode = mode;
            },
            () => {
              this.cancelLoadingItem(item.id);
            },
            () => {
              resolve();
            }
          );
      });
      // fix: 用户快速切换图片时，会存在当前图片还没加载回来标注，就出发保存，导致已有标注被《清空》的情况
      this.autoSaveAnnotationsFlag = false; //加载图片之前就需要将该标志位设置为false
      clearTimeout(this.autoSaveAnnotationsTimer);
      this.autoSaveAnnotationsTimer = setTimeout(() => {
        this.autoSaveAnnotationsFlag = true;
      }, 3000);
      // fix end

      ImageCache.getImage(item.id).then((cachedImageData) => {
        if (cachedImageData) {
          // 如果有缓存，设置为组件的数据
          this.imageUrl = window.URL.createObjectURL(cachedImageData);
          this.focusId = item.id;
          this.$refs.annotator.reload(this.focusId, this.imageUrl);
          // this.componentKey = {
          //   id: this.focusId,
          //   action: "updatePhoto",
          // };
        } else {
          getPicture(item.id).then((res2) => {
            this.imageUrl = window.URL.createObjectURL(res2);
            this.focusId = item.id;
            this.$refs.annotator.reload(this.focusId, this.imageUrl);
            // this.componentKey = {
            //   id: this.focusId,
            //   action: "updatePhoto",
            // };
            ImageCache.saveImage(item.id, res2);
          });
        }
        // this.$refs.annotator.reload(this.focusId, this.imageUrl);
        this.cancelLoadingItem(item.id);
        // this.componentKey = {
        //   id: this.focusId,
        //   action: "updatePhoto",
        // };
      });
      // 平滑滚动到视野中, 会自动触发懒加载
      this.$nextTick(() => {
        const imgElement = this.$refs.imgBox?.find((box) =>
          box.contains(document.getElementById(`pic_${item.id}`))
        );
        if (imgElement) {
          imgElement.scrollIntoView({
            behavior: "smooth", // 平滑滚动
            block: "center", // 滚动到视口的中间
          });
        }
      });
      // }, 100);
    },
    // 下一张
    async nextPhoto(num = 0) {
      if (!this.processPictureList.length) return;
      const lastId =
        this.processPictureList[this.processPictureList.length - 1].id;
      if (this.focusId === lastId) {
        return;
        // 下面三行废弃，改为使用平滑滚动的方式自动触发懒加载(后续如果仍需使用下面的方式的话，记得在loadList中return Promise,即返回getPictureIdPageList调用)
        // 之前直接return了，现在提出需求，如果是已加载的图片的最后一张，如果还有图片的话 要自动触发懒加载，去加载后面的图片
        // if(this.pictureAllList.length - this.confirmPictureList.length <= this.processPictureList.length ) return
        // await this.loadList();
      }
      let index = 0;
      if (num) {
        index = num - 1;
      } else {
        index = this.processPictureList.findIndex(
          (ele) => ele.id === this.focusId
        );
      }
      const nextItem = this.processPictureList[index + 1];
      this.handleFocus(nextItem);
    },
    // 上一张
    prePhoto() {
      const firstId = this.processPictureList[0].id;
      if (this.focusId === firstId) {
        return;
      }
      const index = this.processPictureList.findIndex(
        (ele) => ele.id === this.focusId
      );
      const preItem = this.processPictureList[index - 1];
      this.handleFocus(preItem);
    },
    // 滚动到指定位置
    scrollList(val) {
      // 获取 img-list 对应的 DOM 元素
      this.$nextTick(() => {
        const scrollBox = this.$refs.imgList;
        scrollBox.scrollTop = val;
      });
    },
    // 标注工具删除图片
    async deleteImg(id) {
      const index = this.pictureLoadList.findIndex((item) => item.id === id);
      const processIndex = this.processPictureList.findIndex(
        (item) => item.id === id
      );
      const nextId = this.processPictureList[processIndex + 1]?.id;
      if (nextId != null) {
        const res2 = await getPicture(nextId);
        this.imageUrl = window.URL.createObjectURL(res2);
      } else {
        this.imageUrl = "";
      }
      this.focusId = nextId;
      this.cancelLoadingItem(id);
      this.pictureLoadList.splice(index, 1);
      this.processPictureList.splice(processIndex, 1);
      // this.componentKey = {
      //   id: this.focusId,
      //   action: "updatePhoto",
      // };
      this.$refs.annotator.reload(this.focusId, this.imageUrl);
      this.updateVisibleItems();
    },
    // 更新processPictureList，大部分是由子组件发起的
    updateProcessPictureList(list) {
      const newList = [...list];
      this.processPictureList.forEach((item, index) => {
        // this.$set(item, "markPositions", newList[index].markPositions);
        this.$set(item, "isAutoAnnotating", newList[index].isAutoAnnotating);
      });
      // this.renderListSvg();
    },
    // annotator组件挂载时，要执行的逻辑
    annotatorMounted() {
      // this.renderListSvg();
      this.scrollList(this.targetTop);
      // 记住滚动条得位置
      const scrollBox = this.$refs.imgList;
      scrollBox &&
        scrollBox.addEventListener(
          "scroll",
          debounce(() => {
            this.targetTop = this.$refs.imgList.scrollTop;
          }, 200)
        );
      scrollBox &&
        scrollBox.addEventListener("scroll", () => {
          const top = this.$refs.imgList.scrollTop;
          this.handleScroll(top);
        });
      if (this.lastMode === "label") {
        // this.$refs.modeBtn.click();
        this.$refs.annotator.$refs.modeBtn.click();
      }

      if (this.showTopBox) {
        const heightVal =
          this.confirmPictureList.findIndex((ele) => ele.id === this.focusId) >
          -1
            ? 104
            : 100;
        this.modalBody &&
          (this.modalBody.style.height = `calc(100% - ${
            this.hasXScroll ? 111 : heightVal
          }px)`);
      }
    },
    /**
     * @public
     * 更新待标注的图片id集合
     * ids[]
     */
    addAnnotateTargetIds(ids = []) {
      this.annotateTargetIds = this.annotateTargetIds || []
      const res = [...this.annotateTargetIds, ...ids]
      this.annotateTargetIds = Array.from(new Set(res))
    },
    // 打开标注框后，重置状态
    resetState() {
      this.showTopBox = false;
      this.annotateTargetIds = null;
      this.showRightBox = true;
      this.countNum = 2;
      this.startIndex = 0;
      this.imageUrl = ""
    },
  },
}