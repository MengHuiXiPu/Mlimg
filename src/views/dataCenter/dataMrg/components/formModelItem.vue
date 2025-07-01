<template>
  <div>
    <a-form-model-item label="模型选择" prop="modelSelect">
      <load-select
        class="modelSelect"
        placeholder=""
        v-model="modelConfig.selectedModelId"
        :valueObj="modelConfig.selectedModel"
        :data="modelConfig.modelList"
        :page="modelConfig.pageNo"
        :hasMore="modelConfig.hasMore"
        :request="getModelList"
        :dictComposeLabel="'imageTagType'"
        :dictLabel="'modelName'"
        @update:valueObj="handleSelectModelChange"
      ></load-select>
    </a-form-model-item>
    <a-form-model-item label="数据集选择" prop="datasetSelect">
      <load-select
        class="modelSelect"
        placeholder=""
        v-model="datasetConfig.selectedDatasetId"
        :valueObj="datasetConfig.selectedDataset"
        :data="datasetConfig.datasetList"
        :page="datasetConfig.pageNo"
        :hasMore="datasetConfig.hasMore"
        :request="getdatasetList"
        :dictComposeLabel="'dlTagType'"
        :dictLabel="'dlName'"
        @update:valueObj="handleSelectDatasetChange"
      ></load-select>
    </a-form-model-item>
  </div>
</template>
<script>
import { getModelTableList } from "@/api/modelManage.js";
import { getDataSetList } from "@/api/dataCenter.js";
import loadSelect from "@/components/LoadSelect/index";

export default {
  name: "formModelItem",
  components: {
    loadSelect,
  },
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
    dlType: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      modelConfig: {
        selectedModelId: "",
        selectedModel: {},
        pageNo: 1,
        modelList: [],
        hasMore: true,
      },
      datasetConfig: {
        selectedDatasetId: "",
        selectedDataset: {},
        pageNo: 1,
        datasetList: [],
        hasMore: true,
      },
    };
  },
  methods: {
    // 获取模型列表
    getModelList({ page = 1, more = false, keyword = "" } = {}) {
      return new Promise((resolve, reject) => {
        getModelTableList({
          limit: 10,
          pageNo: page,
          modelName: keyword.trim(),
          modelType: 1,
          taskStatus: 2, //已完成训练的模型
        })
          .then((res) => {
            if (res.code != 0) {
              reject();
              return this.$message.error("模型加载失败");
            }
            if (more) {
              // 如果是加载更多，则合并之前的数据
              this.modelConfig.modelList = [
                ...this.modelConfig.modelList,
                ...res.data.records.filter(item => item.taskStatus === 2),
              ];
            } else {
              // 表示可以正常使用的数据集
              this.modelConfig.modelList = res.data.records.filter(item => item.taskStatus === 2 );
            }
            console.log(this.modelConfig.modelList);
            // 更新pageNo
            this.modelConfig.pageNo = page;
            // 判断hasMore的值
            this.modelConfig.hasMore =
              res.data?.total > this.modelConfig.modelList.length;
            resolve();
          })
          .catch((err) => {
            this.$message.error(
              err?.response?.data?.msg || err?.response?.data?.message
            );
            reject(err?.response?.data);
          });
      });
    },
    handleSelectModelChange(obj) {
      this.modelConfig.selectedModel = obj;
      this.$emit("update:modelSelect", obj || {});
    },
    // 获取数据集列表
    getdatasetList({ page = 1, more = false, keyword = "" } = {}) {
      return new Promise((resolve, reject) => {
        getDataSetList({
          limit: 20,
          pageNo: page,
          modelName: keyword.trim(),
          dlType: this.dlType,
        })
          .then((res) => {
            if (res.code != 0) {
              reject();
              return this.$message.error("数据集加载失败");
            }
            if (more) {
              // 如果是加载更多，则合并之前的数据
              this.datasetConfig.datasetList = [
                ...this.datasetConfig.datasetList,
                ...res.data.records,
              ];
            } else {
              this.datasetConfig.datasetList = res.data.records;
            }
            // 更新pageNo
            this.datasetConfig.pageNo = page;
            // 判断hasMore的值
            this.datasetConfig.hasMore =
              res.data?.total > this.datasetConfig.datasetList.length;
            resolve();
          })
          .catch((err) => {
            this.$message.error(
              err?.response?.data?.msg || err?.response?.data?.message
            );
            reject(err?.response?.data);
          });
      });
    },
    handleSelectDatasetChange(obj) {
      this.datasetConfig.selectedDataset = obj;
      this.$emit("update:datasetSelect", obj || {});
    },
  },
};
</script>
<style scoped lang="less">
.modelSelect {
  width: 100%;
}
</style>
