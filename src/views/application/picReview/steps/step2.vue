<template>
  <div class="step2-container">
    <h6 style="margin-bottom: 10px;"><i style="color: #f5222d">*&nbsp;</i>算法与业务Code码映射规则</h6>
    <div class="step2-config-content scrollbar">
      <el-row style="margin: 10px 0;padding: 0 20px;">
        <el-col :span="4" >算法输出Code</el-col>
        <el-col :span="2" style="text-align: center">映射为</el-col>
        <el-col :span="4">业务Code</el-col>
        <el-col :span="4" :offset="2"><el-link type="primary" @click="callBatchImportModal" :underline="false" :disabled="readOnly">批量导入映射规则</el-link></el-col>
      </el-row>
      <el-form ref="refMappingForm" :model="state" :rules="mappingFormRules" label-width="0">
        <el-row v-for="(rule, index) in state.codeMappings" :key="index" style="margin-bottom: 15px;padding: 0 20px;">
          <el-col :span="4">
            <el-form-item label="" :prop="`codeMappings.${index}.key`" :rules="mappingFormRules.key">
              <el-select v-model="rule.key" allow-create filterable  default-first-option placeholder="" :disabled="readOnly" style="width: 100%">
                <el-option  :label="outputCode" :value="outputCode" v-for="outputCode in outputCodes" :key="outputCode"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="2">
            <el-form-item label="">
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="" :prop="`codeMappings.${index}.value`" :rules="mappingFormRules.value">
              <el-select v-model="rule.value" allow-create filterable  default-first-option placeholder="" :disabled="readOnly" style="width: 100%">
                <el-option  :label="businessCode" :value="businessCode" v-for="businessCode in businessCodes" :key="businessCode"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-if="state.codeMappings.length > 1" :offset="1"> 
            <!-- <el-button type="text" icon="el-icon-delete" size="large" style="font-size: 18px;padding: 6px;" @click="deleteMapItem(index)" :disabled="readOnly"></el-button> -->
            <el-link type="primary" @click="deleteMapItem(index)" :disabled="readOnly" :underline="false" >删除</el-link>
          </el-col>
        </el-row>
      </el-form>
      <el-row style="margin: -10px 15px">
        <el-link type="primary" @click="handAddMapItem" :underline="false" icon="el-icon-plus" :disabled="readOnly">增加新的字段</el-link>
      </el-row>
    </div>
    <!-- 批量导入规则 -->
    <a-modal :visible="batchImportVisible" title="批量导入Code码映射关系" :maskClosable="false" 
      @ok="handleBatchImport" @cancel="batchImportVisible=false" destroyOnClose
      okText="批量导入"
    >
      <p style= "color: #E6A23C">每一行代表一个映射规则，算法code与业务code通过逗号分割；</p>
      <a-textarea
        :placeholder="`示例:  \n code1,OK \n code2,NG`"
        :auto-size="{ minRows: 10, maxRows: 16 }"
        v-model="batchRulesString" class="batch-rules-textarea"
      />
    </a-modal>
  </div>
</template>

<script>
import { getBuiltInConfig } from "@/api/picReview";
import { validateAlphabetNumHyphenUnderline } from '@/utils';
export default {
  name: "step2",
  props: {
    state: {
      type: Object,
      default: () => ({})
    },
    setState: {
      type: Function,
      default: () => { }
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    //校验输入的key不能与已有的key重复 
    const validateKey = (rule, value, callback) => {
      if (value) {
        const keys = this.state.codeMappings.map(item => item.key);
        const keylist = keys.filter(item => item == value);
        if (keylist?.length > 1) {
          callback(new Error('算法code不能重复'));
        }
      }
      callback();
    };
    return {
      batchImportVisible: false,
      batchRulesString: "",
      // // 映射规则列表
      // codeMappings: [
      //   {
      //     key: "",
      //     value: ""
      //   },
      // ],
      businessCodes: [], // 业务code列表
      outputCodes: [], // 算法输出code列表
      mappingFormRules: {
        key: [
          { required: true, message: "请配置算法输出Code", trigger: "blur" },
          { validator: validateAlphabetNumHyphenUnderline, trigger: ["blur", "change"] },
          { validator: validateKey, trigger: ["blur", "change"] },
        ],
        value: [
          { required: true, message: "请配置业务Code", trigger: "blur" },
          { validator: validateAlphabetNumHyphenUnderline, trigger: ["blur", "change"] }
        ]
      }

    }
  },
  methods: {
    callBatchImportModal() {
      this.batchRulesString = ""
      this.batchImportVisible = true
      // this.$nextTick(() => {
      //   this.$refs.batchRulesString.focus()
      // })
    },
    handleBatchImport() {
      if (!this.batchRulesString) return this.$message.warning("请输入批量导入规则！")
      const parseResult = this.parseInputToCodeMappings(this.batchRulesString);
      if (parseResult.error) {
        this.$message.error(parseResult.error);
        return;
      }
      // this.setState("codeMappings", this.state.codeMappings.concat(parseResult.codeMappings))
      this.setState("codeMappings", parseResult.codeMappings)
      this.batchImportVisible = false
    },
    parseInputToCodeMappings(input) {
      // 初始化结果数组和已存在的 key 集合
      const codeMappings = [];
      const keysSet = new Set();
      // 分割输入内容为行数组
      const lines = input.split("\n");
      // 遍历行
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim(); // 去除首尾空格
        if (line === "") continue; // 跳过空行
        const parts = line.split(","); // 按逗号分割
        if (parts.length !== 2) {
          // 如果格式不对，抛出异常提醒
          return { error: `第 ${i + 1} 行输入格式不正确，请确保每行格式为 "key,value"` };
        }
        const key = parts[0].trim();
        const value = parts[1].trim();
        if (!key || !value) {
          // 检查是否为空字符串
          return { error: `第 ${i + 1} 行输入有空值，请确保每行包含有效的 key 和 value` };
        }

        if (keysSet.has(key)) {
          // 如果 key 已经存在，抛出异常
          return { error: `第 ${i + 1} 行的 key "${key}" 已存在，请确保每个 key 唯一` };
        }
        // 如果通过校验，将 key 添加到集合中，并将映射存入结果
        keysSet.add(key);
        codeMappings.push({ key, value });
      }

      return { codeMappings }; // 返回结果
    },
    // 增加新的映射规则
    handAddMapItem() {
      this.state.codeMappings.push({
        key: "",
        value: ""
      })
    },
    // 删除某条映射规则
    deleteMapItem(index) {
      this.state.codeMappings.splice(index, 1)
    },
    /**
     * @public
     */
    next({ resolve, reject }) {
      this.$refs.refMappingForm.validate(valid => {
        if (valid) {
          resolve()
        } else {
          reject()
        }
      })
    }
  },
  created() {
    getBuiltInConfig().then(res => {
      this.businessCodes = res.data?.businessCodes || []
    })
  }
}
</script>

<style lang="less" scoped>
.step2-container {
  // max-height: 100%;
  height: 100%;
  overflow: auto;
  width: 100%;
  padding-top: 10px;
  .step2-config-content {
    padding: 5px 10px;
    border-radius: 5px;
    background-color: #fff;
    height: calc(100% - 40px);
    overflow: auto;
  }
}
/deep/ .ant-modal-body {
  padding-top: 5px;
}
// .batch-rules-textarea {
//   &::placeholder {
//     white-space: pre-wrap;
//   }
//   ::-webkit-input-placeholder {
//     white-space: pre-wrap;
//   }
// }
// .batch-rules-textarea::placeholder {
//   white-space: pre-line !important; /* 使换行符生效 */
// }
</style>