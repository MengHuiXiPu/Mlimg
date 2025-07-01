<template>
  <div class="output-item-wrap">
    <el-row
      type="flex"
      align="middle"
      v-for="(item, index) in items"
      :key="index"
      style="margin-bottom: 8px"
    >
      <el-col v-if="item.controlType === 'struct'" :span="4" class="single-line-ellipsis">{{ item.varName }}</el-col>
      <el-col v-else :span="10" class="single-line-ellipsis">{{ item.varName }}</el-col>
      <el-col :span="18">
        <template v-if="item.controlType === 'struct'">
          <div class="struct-border">
            <item
              :items="item.struct"
            />
          </div>
        </template>
        <template v-else-if="item.varType === 'raw'">
          <div class="vertical-center">
            <el-tooltip v-if="typeof(item.value) ==='string' && (item.value.endsWith('.npy') || item.value.endsWith('.onxx'))" :content="item.value">
              <span >{{ item.value.slice(-16) }}</span>
            </el-tooltip>
            <!-- <el-image
                fit="contain" style="width: 176px; height: 99px"
                :src="item.value"
                :preview-src-list="[item.value]"
                @click="openImageViewer"
                ref="imageRef"
                v-else
            >
            
            <div slot="error" style="text-align: center;line-height: 99px;font-size: 28px;">
              <i class="el-icon-picture-outline"></i>
            </div>
            </el-image> -->
            <image-viewer width="120px"  height ="90px" :src="item.value" v-else :url-list="[item.value]"></image-viewer>
          </div>
        </template>
        <template v-else>
          <div class="vertical-center">
            <span style="margin-right: 8px">
               {{item.value}}
            </span>
          </div>
        </template>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import ImageViewer from "@/components/ImageViewer/index.js"
export default {
  name: "item",
  props: {
    items: Object,
  },
  components: {
    ImageViewer,
  },
  inject: ["G6Instance"],
  data() {
    return {
      showViewer: false
    };
  },
  methods: {
    openImageViewer() {
      // this.$refs.imageRef.showViewer = true
      this.showViewer = true
      console.log(this.showViewer)
    },
    extractVarNames(data) {
      const result = [];
      const traverse = (node, parentPath = "") => {
        if (node.varName) {
          const fullPath = parentPath
            ? `${parentPath}.${node.varName}`
            : node.varName;
          result.push(fullPath);
        }

        if (node.struct) {
          node.struct.forEach((childNode) => {
            traverse(
              childNode,
              parentPath ? `${parentPath}.${node.varName}` : node.varName
            );
          });
        }
      };
      data.forEach((node) => {
        traverse(node);
      });

      return result;
    },
  },
};
</script>

<style scoped>
.single-line-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vertical-center {
  display: flex;
  align-items: center;
}
.struct-border {
  padding: 4px;
  border: 1px solid #e9e9e9;
}
.output-item-wrap{
  padding: 0 5px;
}
</style>
