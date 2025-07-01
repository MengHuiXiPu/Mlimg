<template>
  <a-modal
    :visible="isShow"
    wrap-class-name="full-modal"
    :footer="null"
    :mask="false"
    :closable="false"
    :maskClosable="false"
    :keyboard="false"
    :destroyOnClose="true"
    @cancel="close"
  >
    <Annotator
      id="annotator"
      ref="annotator"
      :identifier="record.id"
      :nonDatasetSchema="nonDatasetSchema"
      v-if="imageUrl"
      :image-url="imageUrl"
      @close-modal="close"
    >
    </Annotator>
    <!-- <img :src="imageUrl"/> -->
</a-modal>
</template>

<script>
import Annotator from "@/components/cocoAnnotation/Annotator";
import { getTransferImage,getTransferFileDetail, saveAnnotationData } from '@/api/cloud.js';
import uniqueId from 'lodash/uniqueId';
  export default {
    name: '',
    components: {
      Annotator
    },
    data() {
      return {
        imageUrl: null,
        modelAllList: [],
        loading: null,
        nonDatasetSchema: {
          // 获取标注数据的请求, resopnse interface[dataset, image, labels]
          queryAnnotationDataRequest: getTransferFileDetail,
          // 更新标注数据的请求
          saveAnnotationDataRequest: saveAnnotationData
        },
        // 图片的标注数据
        annotationData: {}
      }
    },
    provide() {
      return {
        modalInstance: this,
      };
    },
    watch: {
      async isShow(val) {
        if(val) {
          this.loading = this.$loading({
            lock: true,
            text: '加载中',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.2)'
          });
          try {
            const res = await getTransferImage(this.record.id)
            this.imageUrl = window.URL.createObjectURL(res);
            this.loading.close()
          }catch {
            this.loading.close()
          }
        }else {
          this.imageUrl = null
        }
      }
    },
    props: {
      isShow: {
        type: Boolean,
        default: false,
      },
      record: {
        type: Object,
        default: () =>({})
      }
    },
    methods: {
      /**
       * @public
       * 更新标签
       */
      updateLabels(labelList) {
        const dataId = this.record.id
        // 后端不生成id，需要自己设置id 保存
        labelList.forEach(label => {
          if(!label.id) { //新建的标签无id
            const labelId =parseInt(uniqueId() + (Date.now().toString()).substr(-7))
            label.id = labelId
          }
        })
        return new Promise((resolve, reject) => {
          const { dataset, image } = this.annotationData
          saveAnnotationData(dataId, {
            image,
            dataset,
            labels: labelList
          }).then(res =>{
            if(res.code == 0) {
              this.$message.success('保存成功')
              resolve()
            }else {
              reject()
            }
          }).catch(e=>reject(e))
        })
      },
      /**
       * @public
       * 更新标注信息
       * annotations: 当前标注信息 []，按照之前的代码逻辑，是所有标签下的标注信息汇总，而不是一个标签下的，每次都会全量保存
       */
      updateAnnotations({ annotations }) {
        const dataId = this.record.id
        const { dataset, image, labels } = this.annotationData
          // 将annotation按照labelId分组
        annotations.forEach(anno => { //将annotation放到对应的label下
          // 查找anno对应的label
          const currentLabel = labels.find(la => la.id == anno.labelId)
          // if(!currentLabel) return
          // 在该label中，更新标注
          let cLabelAnnotations = currentLabel.annotations || []
          let cIndex = cLabelAnnotations.findIndex(ca => ca.id === anno.id)
          if(cIndex > -1) {
            cLabelAnnotations.splice(cIndex, 1, anno)
          }else {
            cLabelAnnotations.push(anno)
          }
        })
        const loading = this.$GLoading('正在保存标注...')
        return saveAnnotationData(dataId, {
          image,
          dataset,
          labels
        }).then(res =>{
          loading.close()
          if(res.code == 0 ) {
            this.$message.success('保存成功')
          }else {
            this.$message.success(res.msg)
          }
        }).catch(e => { loading.close() })
      },
      /**
       * 删除某个标注
       * @param {*} targetId ：要删除的标注annotation id, 值为 all时，表示删除图片的所有标注信息
       */
      deleteAnnotation(targetId) {
        const  { dataset, image, labels } = this.annotationData
        let sendLabels
        if(targetId == 'all') {
          // 这里要使用map返回新的labels对象，在请求接口成功后再删除labels中的annotations(因为annotations关联视图)
          sendLabels = labels.map(lab => {
            return {
              ...lab,
              annotations: []
            }
          })
        }else {
          labels.forEach(label => {
            const targetIndex = (label.annotations || []).findIndex((anno => anno.id == targetId))
            // 目标annotation在当前label时，移除对应的annotation
            if(targetIndex > -1) {
              label.annotations.splice(targetIndex, 1)
            }
          })
        }
        const loading = this.$GLoading('正在删除标注...')
        return saveAnnotationData(this.record.id, {
          image,
          dataset,
          labels: targetId == 'all' ? sendLabels : labels
        }).then(res => {
          if(res.code == 0) {
            this.$message.success('删除成功')
          }
        }).finally(() => {
          loading.close()
        })
      },
      close() {
        this.$emit('update:isShow', false)
      }
    },
  }
</script>

<style lang="less" scoped>
#annotator {
  position: relative;
  font-family: Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: rgba(218, 234, 255, 1); //annotator的底色
  overflow: hidden;
}

/deep/ .ant-modal-wrap {
  z-index: 1200;
}

/deep/ .full-modal .ant-modal {
  width: 100% !important;
  height: 100vh;
  overflow: hidden;
  top: 0;
  margin: 0;
  padding: 0;
}
/deep/ .full-modal .ant-modal-header {
  // border-radius: 0;
  // background-color: rgba(167, 205, 255, 1);
  padding: 0;
  border: none;
  // border-radius: 0 0 8px 8px;
}

/deep/ .full-modal .ant-modal-content {
  height: 100vh;
  border-radius: 0;
}

/deep/ .full-modal .ant-modal-body {
  height: 100%;
  padding: 0;
  background-color: rgba(218, 234, 255);
}

/deep/ .full-modal .ant-modal-close-x {
  color: #ffffff;
}
</style>