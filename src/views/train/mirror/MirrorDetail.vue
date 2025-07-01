<template>
  <div class="page-content">
    <a-spin :spinning="loading">
      <div class="content">
        <!-- <back-title url="/train/mirror" /> -->
        <a-descriptions :title="detailData.imageName" class="header scrollbar">
          <a-descriptions-item label="算法类型">{{
            detailData.tagType
          }}</a-descriptions-item>
          <a-descriptions-item label="算法目录">{{
            detailData.storedDirName
          }}</a-descriptions-item>
          <a-descriptions-item label="创建用户">{{
            detailData.createBy
          }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{
            detailData.createTime | moment
          }}</a-descriptions-item>
          <a-descriptions-item label="算法说明">{{
            detailData.imagesDescribe
          }}</a-descriptions-item>
          <a-descriptions-item label="算法版本">{{
            detailData.versionLabel
          }}</a-descriptions-item>
        </a-descriptions>

        <a-tabs
          default-active-key="1"
          @change="callback"
          v-if="$route.query.key != '3'"
        >
          <a-tab-pane key="1" tab="算法参数">
            <div class="mirror-params-list">
              <a-tree
                showLine
                :tree-data="algorithmParam"
                :replace-fields="replaceFields"
                @select="selectParamChange"
              ></a-tree>
            </div>
            <a-input
              type="textarea"
              v-model="algorithmParamValue"
              :disabled="suanfaDis"
              class="text-area algorithmParam"
              @blur="changeAlgorithmParam"
            ></a-input>
          </a-tab-pane>
          <a-tab-pane key="2" tab="业务参数" force-render>
            <a-input
              v-model="detailData.businessParam"
              type="textarea"
              :disabled="suanfaDis"
              class="text-area"
              @blur="confirmJSON"
            ></a-input>
            <p v-if="showJSONError" style="color: red">
              当前参数不符合JSON规范，请重新填写
            </p>
          </a-tab-pane>
          <a-icon
            type="edit"
            class="edit-icon"
            v-show="suanfaDis"
            slot="tabBarExtraContent"
            @click="editClick"
          />
          <div v-show="!suanfaDis" slot="tabBarExtraContent">
            <a-button
              @click="confirmClick"
              type="primary"
              style="margin-right: 10px"
              :loading="editLoading"
              >确定</a-button
            >
            <a-button @click="cancelClick">取消</a-button>
          </div>
        </a-tabs>
      </div>
    </a-spin>
  </div>
</template>

<script>
import { getImageManageById, editImageManage } from "@/api/imageManage";
export default {
  name: "MirrorDetail",
  data() {
    return {
      suanfaDis: true,
      loading: false,
      tabelKey: "1",
      detailData: {},
      selectObj: {},
      algorithmParam: [],
      algorithmParamValue: "",
      showJSONError: false,
      paramsConfig: null,
      businessParamConfig: null,
      editLoading: false,
      replaceFields: {
        children: "childreans",
        title: "name",
      },
    };
  },
  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.loading = true;
      getImageManageById(to.query.id).then((data) => {
        vm.detailData = data.data;
        vm.loading = false;
        vm.businessParamConfig = data.data.businessParam;
        if (data.data.algorithmParam)
          vm.getActiveParams(data.data.algorithmParam);
      });
    });
  },
  methods: {
    callback(key) {
      this.tabelKey = key;
    },
    cancelClick() {
      this.algorithmParam = JSON.parse(JSON.stringify(this.paramsConfig));
      this.selectParamChange(null, {
        node: { dataRef: this.selectObj },
      });
      this.detailData.businessParam = this.businessParamConfig;
      this.suanfaDis = true;
      this.showJSONError = false;
    },
    editClick() {
      this.suanfaDis = false;
    },
    isValidJSON(text) {
      try {
        JSON.parse(text);
        return true;
      } catch (error) {
        return false;
      }
    },
    async confirmClick() {
      if (this.showJSONError) {
        return false;
      }
      if (!this.isValidJSON(this.algorithmParamValue)) {
        this.$message.error("算法参数格式不正确!")
        return false;
      }
      this.editLoading = true;
      if (this.algorithmParam[0].content.includes("config_dir")) {
        let index = this.algorithmParam[0].content.indexOf("config_dir");
        let tmpStr = this.algorithmParam[0].content
          .substring(index + 1, this.algorithmParam[0].content.length)
          .split("'")[1];
        this.algorithmParam[1].name = tmpStr;
      }
      this.$set(
        this.detailData,
        "algorithmParam",
        JSON.stringify(this.algorithmParam)
      );
      const data = await editImageManage(this.detailData);
      if (data.code === 0) {
        this.businessParamConfig = this.detailData.businessParam;
        this.paramsConfig = JSON.parse(this.detailData.algorithmParam);
        this.$message.success("修改成功！");
      }
      this.suanfaDis = true;
      // console.log("data: ", data);
      this.editLoading = false;
    },
    selectParamChange(selectedKeys, obj) {
      this.selectObj = { ...obj.node.dataRef };
      if (this.selectObj.type !== 2) return false;
      this.algorithmParamValue = this.selectObj.content;
    },
    getActiveParams(data) {
      const _data = JSON.parse(data).map((item, index) => {
        if (item.type) {
          let children = null;
          if (item.type === 1) {
            children = item.childreans.map((child, childIndex) => {
              return {
                ...child,
                key: `${index}-${childIndex}-${child.name}`,
              };
            });
          }
          return {
            ...item,
            childreans: children,
            key: `${index}-${item.name}`,
          };
        } else {
          const child = Object.keys(item)[0];
          return {
            name: child,
            type: 2,
            content: item[child],
            key: `${index}-${child}`,
          };
        }
      });
      this.paramsConfig = JSON.parse(JSON.stringify(_data));
      this.algorithmParam = JSON.parse(JSON.stringify(_data));
    },
    changeAlgorithmParam() {
      this.algorithmParam.forEach((item) => {
        if (item.key === this.selectObj.key) {
          item.content = this.algorithmParamValue;
        } else if (item.childreans) {
          item.childreans.forEach((child) => {
            if (child.key === this.selectObj.key) {
              child.content = this.algorithmParamValue;
            }
          });
        }
      });
    },
    confirmJSON(e) {
      const val = e.target.value;
      if (!val) {
        // 当前参数为空时
        this.showJSONError = false;
      } else {
        if (!isNaN(val)) {
          this.showJSONError = true;
          return false;
        }
        try {
          const jsonString = JSON.parse(val);
        } catch (err) {
          this.showJSONError = true;
          return false;
        }
        this.showJSONError = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.page-content {
  display: flex;
  flex-direction: column;
  /deep/ .ant-spin-nested-loading {
    flex: 1;
    .ant-spin-container {
      height: 100%;
      .content {
        height: 100%;
        display: flex;
        flex-direction: column;
        .ant-tabs {
          flex: 1;
          .ant-tabs-content {
            height: calc(100% - 78px);
            .ant-tabs-tabpane {
              height: 100%;
              .mirror-params-list {
                height: 100%;
              }
              .text-area {
                height: 100%;
              }
            }
          }
        }
      }
    }
  }
}
.scrollbar {
  &::-webkit-scrollbar {
    cursor: pointer;
    width: 6px;
    height: 8px;
    background-color: #fff;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    border: solid transparent;
    cursor: pointer;
  }
  &::-webkit-scrollbar-track {
    background-color: #fff;
  }
}
.content {
  .header {
    overflow: auto;
    max-height: 220px;
  }
  /deep/ .ant-tabs-nav .ant-tabs-tab {
    /*主要内容标签样式*/
    // padding: 20px 0 4px 20px;
    margin-right: 0;
    font-size: 14px;
    line-height: 42px;
    font-weight: 500;
    font-family: "微软雅黑", sans-serif;
    padding: unset;
    background: #f2f2f2;
    padding: 0px 16px;
    height: 42px;
    margin-right: 16px;
    border-radius: 8px;
    min-width: 116px;
    text-align: center;
    &.ant-tabs-tab-active {
      background: #1990ff;
      color: #fff;
    }
  }
  /deep/ .ant-tabs-nav .ant-tabs-ink-bar {
    display: none !important;
  }
  /deep/ .ant-tabs-bar {
    border: unset;
  }
  .ant-descriptions {
    padding: 12px;
    background: #fff;
    border-radius: 16px;
    margin-top: 12px;
    margin-bottom: 16px;
  }
  .mirror-params-list {
    background: #fff;
    border-radius: 16px;
  }
  .text-area {
    .scrollbar();
    background: #fff;
  }
  .title {
    font-size: 20px;
    color: #09102f;
    font-weight: 500;
    margin-bottom: 10px;
  }
  .content-header {
    display: flex;
    justify-content: space-between;
    .left {
      display: flex;
      flex-direction: column;
    }
  }
}
.ant-tabs-tabpane {
  .text-area {
    height: 59vh;
    margin: 10px 0px;
    &.algorithmParam {
      width: calc(100% - 210px);
    }
  }
}
.edit-icon {
  font-size: 16px;
  margin-right: 30px;
}
.mirror-params-list {
  margin-top: 10px;
  width: 200px;
  float: left;
  height: 59vh;
  margin-right: 10px;
  overflow-y: auto;
  border-right: 1px solid #e8e8e8;
}
/deep/ .ant-tree li .ant-tree-node-content-wrapper {
  text-overflow: ellipsis;
  overflow: hidden;
  width: calc(100% - 24px);
  &.ant-tree-node-selected {
    background: #0072c6;
    color: #fff;
  }
}
.ant-input[disabled] {
  color: #000;
}
</style>
