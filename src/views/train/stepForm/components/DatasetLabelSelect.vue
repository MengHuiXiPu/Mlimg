<template>    
  <a-form-model
      v-if="dlId.length !== 0"
      :model="form"
      ref="ruleForm"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :rules="rules"
      layout="horizontal"
      style="min-width: 500px; margin: 20px 0;width: 100%">
      <a-form-model-item label="验证集划分比例" prop="splitRatio" v-if="dlItem && dlItem.length">
        <a-input-number
          :disabled="modelInfoRecord.taskStatus === 1"
          v-model="form.splitRatio"
          :min="0"
          :max="100"
          placeholder="请输入验证集占比"
          :formatter="value => `${value}%`"
          :parser="value => value.replace('%', '')"
        />
      </a-form-model-item>
    <!-- 是否需要label映射 -->
    <a-form-model-item v-if="dlItem && dlItem.length">
      <span slot="label">是否需要label映射
        <a-tooltip title="增加Label映射规则，将转换样本的Label信息参与训练">
          <a-icon type="question-circle-o" style="vertical-align: 2px;"/>
        </a-tooltip>
      </span>
      <a-radio-group v-model="step.labelMapConfig.needLabelMap" :disabled="readOnly">
        <a-radio :value="false">否</a-radio>
        <a-radio :value="true">是</a-radio>
      </a-radio-group>
    </a-form-model-item>
    <!-- 不需要label映射时 -->
    <template v-if="dlItem && dlItem.length && !step.labelMapConfig.needLabelMap">
    <!-- 筛选区 -->
    <a-form-model-item v-if="dlItem && dlItem.length" class="threeline" label="每个类别样本数量：">
      <a-checkbox :indeterminate="indeterminate" :checked="checkAll" @change="onCheckAllChange" :disabled="modelInfoRecord.taskStatus === 1">
          全选
        </a-checkbox>
        <a-checkbox @change="changenum(10)" v-model="ten" :disabled="modelInfoRecord.taskStatus === 1">
          大于10
        </a-checkbox>
        <a-checkbox  @change="changenum(30)" v-model="thirty" :disabled="modelInfoRecord.taskStatus === 1">
          大于30
        </a-checkbox>
        <span>&nbsp;&nbsp;&nbsp;自定义最小数量：</span>
        <a-input-number  v-model="customFilterNumber" size="small" :min="1" style="margin-top: 8px;"/>
        <a-button size="small" style="margin-top: 8px;" type="primary" @click="handleCustomFilter">筛选</a-button>
      </a-form-model-item>
    <!-- 数据集label列表 -->
    <!-- <a-form-model-item label="" prop="selectedType"> -->
      <a-row>
        <a-col :span="17" class="label-text">标签名称<span style="color: #E6A23C;font-size: 13px;">&nbsp;&nbsp;仅支持选择已标注的数据进入训练</span>
        </a-col>
        <a-col :span="6" class="label-text">训练样本数限制
          <a-tooltip title="将随机抽取设定的样本数量进行训练，通过限制样本数量，避免Label样本量的不均衡问题，将有效提升模型在各Label的表现">
            <a-icon type="question-circle-o" style="vertical-align: 2px;"/>
          </a-tooltip>
        </a-col>
      </a-row>
      <div style="width: 100%;display:flex;">
        <a-checkbox-group
          v-if="dlItem && dlItem.length"
          :disabled="modelInfoRecord.taskStatus === 1"
          style="width: 72%"
          v-model="form.selectedType"
          :options="selectedTypeList"
          @change="onChange">

          <span slot="label" slot-scope="option">
            <span class="numberShow">
              <span class="left" :title="`${option.value} (${option.number})`">{{ `${option.value} (${option.number})` }}</span>
              <a-progress class="right" :percent="option.percent" :show-info="false"/>
            </span>
          </span>
        </a-checkbox-group>
        <div>
          <div v-for="option in selectedTypeList" :key="option.value">
            <!-- 选中的lable才可以配置 -->
            <a-select size="small" v-model="option._isAll" style="width: 80px;margin:2px 5px;" :disabled="readOnly || !form.selectedType.includes(option.value)">
              <a-select-option :value="true">全部</a-select-option>
              <a-select-option :value="false">自定义</a-select-option>
            </a-select>
            <a-input-number v-show="!option._isAll" v-model="option.limit" size="small" :min="1" :max="option.number" :disabled="readOnly || !form.selectedType.includes(option.value)"/>
          </div> 
        </div>
      </div>
    <!-- </a-form-model-item> -->
    </template>
    <!-- 需要label映射时显示，配置label映射的区域 -->
    <template v-if="dlItem && dlItem.length && step.labelMapConfig.needLabelMap">
      <a-row :gutter="16" class="mr-hor-5">
        <a-col :span="4" class="label-text">映射后Label</a-col>
        <a-col :span="7" class="label-text">原始的Label</a-col>
        <a-col :span="3" class="label-text">样本总量</a-col>
        <a-col :span="10" class="label-text">训练样本数限制
          <a-tooltip title="将随机抽取设定的样本数量进行训练，通过限制样本数量，避免Label样本量的不均衡问题，将有效提升模型在各Label的表现">
            <a-icon type="question-circle-o" style="vertical-align: 2px;"/>
          </a-tooltip></a-col>
      </a-row>
      <a-form-model ref="refMappingForm" :model="labelRuleObj" :rules="mappingFormRules" label-width="0">
        <a-row :gutter="16" class="mr-hor-5" v-for="(mapObj,index) in labelRuleObj.labelRule" :key="index">
          <a-col :span="4">
            <a-form-model-item label="" :prop="`labelRule.${index}.mainLabel`" :rules="mappingFormRules.mainLabel">
              <a-input v-model="mapObj.mainLabel" :disabled="readOnly"></a-input>
            </a-form-model-item>
          </a-col>
          <a-col :span="7">
            <a-form-model-item label="" :prop="`labelRule.${index}.originalLabel`" :rules="mappingFormRules.originalLabel">
              <a-select :disabled="readOnly" mode="multiple" v-model="mapObj.originalLabel">
                <a-select-option :value="item.value" v-for="item in calcSelectedTypeList" :key="item.key">{{ item.value }}</a-select-option>
              </a-select>
            </a-form-model-item>
          </a-col>
          <a-col :span="3" style="line-height: 40px">{{ calcPictureCount(mapObj.originalLabel) }}</a-col>
          <a-col :span="10">
            <a-form-model-item  label="" :prop="`labelRule.${index}.limit`" :rules="mappingFormRules.limit">
              <a-select style="width: 90px;margin:2px 5px;" :disabled="readOnly" v-model="mapObj._isAll" @change="() => { mapObj.limit = mapObj._isAll ? -1 : 1 }">
                <a-select-option :value="true">全部</a-select-option>
                <a-select-option :value="false">自定义</a-select-option>
              </a-select>
              <a-input-number :min="1" :max="calcPictureCount(mapObj.originalLabel)" v-model="mapObj.limit" :precision="0" :disabled="readOnly" v-if="!mapObj._isAll" />
              <a-button type="link" :disabled="readOnly" @click="handleDeleteLabelMapItem(index)" v-if="labelRule.length>1">删除</a-button>
            </a-form-model-item>
          </a-col>
        </a-row>
        <a-row>
          <a-button type="link" @click="handleAddLabelMapItem" :disabled="readOnly"><a-icon type="plus" style="vertical-align:baseline;"/>新增Label映射</a-button>
        </a-row>
      </a-form-model>
      <el-divider v-show="calcSelectedTypeList.length"></el-divider>
      <!-- 未配置映射的标签 -->
      <div v-if="calcSelectedTypeList.length" class="unmap-box">
        <div class="unmap-box-header">未配置映射关系的Label：</div>
        <a-row :gutter="16" class="mr-hor-5">
          <a-col :span="11" class="label-text">标签名称</a-col>
          <a-col :span="3" class="label-text">样本总量</a-col>
          <a-col :span="9" class="label-text">训练样本数限制
            <a-tooltip title="将随机抽取设定的样本数量进行训练，通过限制样本数量，避免Label样本量的不均衡问题，将有效提升模型在各Label的表现">
              <a-icon type="question-circle-o" style="vertical-align: 2px;"/>
            </a-tooltip></a-col>
        </a-row>
        <a-row v-for="(option,index) in calcSelectedTypeList" :key="index" :gutter="16">
          <a-col :span="11" class="label-text"><a-checkbox :title="`${option.value}`" v-model="option._isChecked">{{ `${option.value}` }}</a-checkbox></a-col>
          <a-col :span="3" class="label-text" style="">{{option.number}}</a-col>
          <a-col :span="9">
            <a-select size="small" v-model="option._isAll" style="width: 80px;margin:2px 5px;" :disabled="readOnly || !option._isChecked">
              <a-select-option :value="true">全部</a-select-option>
              <a-select-option :value="false">自定义</a-select-option>
            </a-select>
            <a-input-number :min="1" :max="option.number" v-model="option.limit" :precision="0" :disabled="readOnly|| !option._isChecked" size="small" v-if="!option._isAll"/>
          </a-col>
        </a-row>
      </div>
    </template>
  </a-form-model>
</template>

<script>
import { getCategoryInfo, selectDatasetSeNoAddMinMustAdd } from "@/api/modelManage";
import _ from 'lodash';
import lableMapMixin from "./labelMap.mixin.js";
export default {
  name: "DatasetLabelSelect",
  mixins: [lableMapMixin],
  data() {
    return {
      form: {
        selectedType: [],
        splitRatio: 20,
      },
      ten: false,
      thirty: false,
      customFilterNumber: 1,  //自定义筛选最小数
      selectedTypeList: [],//储存可以被选中加入预测类别的code列表
      labelSelectedInitialFlag: true, // 标签是否首次加载， 当调用渲染选中列表时，变更为false
      rules: {
        selectedType: [{
          type: 'array', required: true, message: '请选择类别名称!', trigger: 'change'
        }],
        splitRatio: [{
          required: true, message: '请设置验证集划分比例!', trigger: 'change'
        }]
      },
      indeterminate: false,
      // checkAll: false,
      illegal: false,
      sortType: 2,
      wrongcodelist: [],//不能被选中的code
      maxCount: 0, // 数据集最大标签数目

      mincount: 0,
      mustcodelist: [],
      mustmincount: 0,
    }
  },
  computed: {
    dlId() {
      return this.$store.state.model.step.dlId;
    },
    dlItem() {
      return this.$store.state.model.step.dlItem
    },
    currentModel() {
      return this.$store.state.model.currentModel;
    },
    modelInfoRecord() {
      return this.$store.state.model.modelInfoRecord;
    },
    checkAll() {
      return this.form.selectedType?.length === this.selectedTypeList.length
    }
  },
  watch: {
    dlItem(newV, oldV) {
      this.getCategoryInfo()
    },
    form: {
      handler(value) {
        this.$store.commit('setSelectedType', value.selectedType);
        this.$store.commit('setSplitRatio', value.splitRatio);
      },
      deep: true
    }
  },
  activated() {
    this.labelSelectedInitialFlag = true

    // let params = this.$store.state.model.step.dlId;//从vuex的model组件中获取数据集编号step.imagesId
    // params = params + "?imagesId=" + this.$store.state.model.step.imagesId;//添加算法ID
    // console.log("params: ", params)
    // console.log("this.$store.state.model.step.imagesId: ", this.$store.state.model.step.imagesId)
    // selectDatasetSeNoAddMinMustAdd(params).then(res => {//读取算法对训练数据的要求
    //   //console.log(res);
    //   if (res.code == 0) {//校验码为0表示正确
    //     this.wrongcodelist = res.data.noAddCode || [];//读取不应加入训练集的数据列表
    //     this.mincount = res.data.min_count;//所有被选中code的数据数量必须达到的最小值
    //     if (res.data.type == "segmentation") {//分割：segmentation 分类：classification
    //       this.mustcodelist = res.data.mustAddCode;//必须被选中的code
    //       this.mustmincount = res.data.mustAddCodeMinCount;//必选code的数据数量必须达到的最小值
    //     }
    //     //console.log("wrongcodelist:" + this.wrongcodelist + "  mincount:" + this.mincount + "  this.mustcodelist:" + this.mustcodelist + " this.mustmincount:" + this.mustmincount);
    //   }
    // })
  },
  mounted() {
    console.log("DatasetLabelSelect this.modelInfoRecord", this.modelInfoRecord)
    this.$nextTick(() => {
      this.checkAllLabel()
      // this.checkAll = true
    })
  },
  methods: {
    changenum(value) {
      if (this.ten && value === 10) {
        this.thirty = false
        this.filterselect(10)
        return
      }
      if (this.thirty && value === 30) {
        this.ten = false
        this.filterselect(30)
        return
      }
      this.checkAllLabel()
    },
    filterselect(value) {
      let list = this.selectedTypeList.filter(item => item.number > value)
      // this.form.selectedType = list.map(item => item.value)
      this.$set(this.form, 'selectedType', list.map(item => item.value))
    },
    handleCustomFilter() {
      // 取消>30  >10的勾选（与之互斥）
      this.thirty = this.ten = false
      this.filterselect(this.customFilterNumber - 1)
    },
    async getCategoryInfo() {//获取类别信息
      // const params = this.$store.state.model.step.dlId.join(",")
      console.log("getCategoryInfo params: ", this.$store.state.model.step.dlItem);
      // const responseData = await getCategoryInfo(params)//调用接口，根据数据集数组查询分类信息
      if (this.$store.state.model.step.dlItem && this.$store.state.model.step.dlItem.length) {//code=0，表示成功返回
        let data = []
        this.$store.state.model.step.dlItem.forEach((item, index) => {
          // 只有【已标注】图像才能被选择进入训练，这里的取值字段由 (categoryList, categoryNum)变更为 (existMarkCategoryList,existMarkCategoryNum)
          let existMarkCategoryList = (item.existMarkCategoryList || "").split(",")
          let existMarkCategoryNum = (item.existMarkCategoryNum || "").split(",")
          console.log(existMarkCategoryList, existMarkCategoryNum);
          if (existMarkCategoryList.length) {
            for (let i = 0; i < existMarkCategoryList.length; i++) {
              data.push({
                fileCategory: existMarkCategoryList[i],
                count: Number(existMarkCategoryNum[i]),
              })
            }
          }
        })
        console.log(data);
        data = Object.values(data.reduce((acc, curr) => {
          acc[curr.fileCategory] = acc[curr.fileCategory] || { fileCategory: curr.fileCategory, count: 0 };
          acc[curr.fileCategory].count += curr.count;
          return acc;
        }, {}));
        this.maxCount = 0;  // 统计数量最多的类别，用于进度条展示
        data.forEach((item, index) => {
          if (item.count > this.maxCount) {
            this.maxCount = item.count;
          }
        })
        // log你大爷，一打开控制台满屏的log信息
        // console.log(this.maxCount);
        // console.log("totalList: ", this.maxCount)
        this.selectedTypeList = data.map((item, index) => {
          const needLabelMap = this.step?.labelMapConfig?.needLabelMap || false
          const labelRule = this.step?.labelMapConfig?.labelRule || []
          let labelRuleItem = labelRule.find(rule => rule.mainLabel === item.fileCategory)
          // 判断是否勾选，需求要选择数据集后默认选中label, 存在说明已保存在labelRule中, 勾选
          let _isChecked = labelRuleItem ? true : false
          // // 如果是新勾选数据集，新增加了标签，要默认勾选
          // const exist = (this.selectedTypeList || []).find(ty => ty.value === item.fileCategory)
          if (!needLabelMap) {
            _isChecked = true
          }
          return {
            value: item.fileCategory,
            number: item.count,
            percent: 100 * item.count / this.maxCount, // 根据当前类别占最多类别的比例
            key: index,
            isMark: false,
            // 添加这两个属性用于配置映射数量
            _isAll: labelRuleItem ? labelRuleItem.limit === -1 : true,
            // mainlabel在没配置映射时  就是原始标签
            _isChecked: _isChecked,  //设置勾选状态
            limit: labelRuleItem ? labelRuleItem.limit : 1,
          }//遍历api返回结果，转换为selectedTypeList数组
        })
        // 他之前这样处理，同名的类别只显示前者，数量也不会叠加，修改为同标签名数量叠加合并（见上面）
        //  this.selectedTypeList = _.uniqBy(selectedTypeList, 'value');
        // /////////设置勾选\\\\\\\\\\\\\\
        if (this.labelSelectedInitialFlag && this.dlItem?.length && this.modelInfoRecord?.selectedType) {  //存在已保存的已选择类别，要勾选上
          this.$set(this.form, 'selectedType', this.modelInfoRecord?.selectedType.split(','))
        } else {  //根据条件过滤来设置选中
          // this.$set(this.form, 'selectedType', this.selectedTypeList.map(item => item.value))
          if (this.ten) {
            this.filterselect(10)
          } else if (this.thirty) {
            this.filterselect(30)
          } else {
            this.$set(this.form, 'selectedType', this.selectedTypeList.map(item => item.value))
          }
        }
        this.labelSelectedInitialFlag = false
        // this.selectedTypeList = this.selectedTypeList.map(item => {
        //   if(item.value === "SDF" || item.value === "SFA"){
        //     item.isMark = true;
        //   }
        //   return item;
        // })
        this.sortChange()//排序
        // 默认全选所有类别，需要
        this.$nextTick(() => {
          this.indeterminate = false
        })
        if (this.form.selectedType.length === this.selectedTypeList.length) {//比较被选中的类别数量和全部类别数量，更新全选按钮状态
          this.indeterminate = false
        } else if (this.form.selectedType.length > 0) {
          this.indeterminate = true
        } else {
          this.indeterminate = false
        }
        // 反显映射关系
        if (Array.isArray(this.step?.labelMapConfig?.labelRule)) {
          //需要映射时 将信息update到labelRule。
          // (不需要时，将信息update到selectedTypeList，见getCategoryInfo方法的上部分)
          const needShowSavedInfo = this.step?.labelMapConfig?.needLabelMap === true && this.modelInfoRecord?.needLabelMap === true  //和接口保存的一致时，则反显
          if (needShowSavedInfo) {  //需要反显接口保存的映射关系
            this.labelRule = (this.step?.labelMapConfig?.labelRule || []).filter(item => item.mainLabel && item.originalLabel && item.originalLabel?.length).map(item => {
              return {
                mainLabel: item.mainLabel,
                originalLabel: item.originalLabel || [],
                _isAll: item.limit === -1 ? true : false,
                limit: item.limit
              }
            }).filter((item => {
              // 因为对部分label做映射时，originalLabel只有一个元素，就是labelname,且和mainLabel相同，此时放在映射的下方
              return !(item.originalLabel?.length == 1 && item.originalLabel[0] === item.mainLabel)
            }))
          }
          // else {  //重置清空映射关系
          //   this.labelRule = [{
          //     mainLabel: "",
          //     originalLabel: [
          //       // ""
          //     ],
          //     // 表示是全部还是自定义数量, 前端使用，保存时去除
          //     _isAll: true,
          //     limit: -1
          //   }]
          // }
        }
      }
    },
    // 全选
    checkAllLabel() {
      this.$set(this.form, 'selectedType', this.selectedTypeList.map(item => item.value))
    },
    onCheckAllChange(e) {//改变全选复选框状态时，更新类别复选框状态
      this.ten = false
      this.thirty = false
      this.$set(this.form, 'selectedType', e.target.checked ? this.selectedTypeList.map(item => item.value) : [])
      Object.assign(this, {//赋值更新全选框状态
        indeterminate: false,
        checkAll: e.target.checked,
      });
      this.$refs.ruleForm.validateField('selectedType')
      if (e.target.checked == false)
        return;
      // this.illegal = false;
      // for (let i = 0; i < this.selectedTypeList.length; i++) {
      //   for (let j = 0; j < this.wrongcodelist.length; j++) {
      //     if (this.selectedTypeList[i].value == this.wrongcodelist[j]) {//若有错误的数据被选中，则数据非法，输出提示
      //       this.wrongcodelistchecked = this.selectedTypeList[i].value;
      //       this.illegal = true;
      //       break;
      //     }
      //   }
      // }
    },
    sortChange() {//排序预测类别复选框
      if (this.sortType === 1) {//若sortType=1，则按字母顺序排序
        const typeList = this.selectedTypeList.map(item => item.value).sort()
        this.selectedTypeList = typeList.map(item => {
          return {
            value: item,
            number: this.selectedTypeList.filter(code => code.value === item)[0].number,
            percent: this.selectedTypeList.filter(code => code.value === item)[0].percent,
          }
        })
      } else {//若sortType!=1，则按各类型数量排序
        this.selectedTypeList = this.selectedTypeList.sort((a, b) => {
          return b.number - a.number
        })
      }
    },
    onChange(checkedList) {//改变类别复选框状态时，更新全选复选框状态
      // this.indeterminate = !!checkedList.length && checkedList.length < this.selectedTypeList.length;
      this.indeterminate = checkedList.length && checkedList.length < this.selectedTypeList.length;
      // this.checkAll = checkedList.length === this.selectedTypeList.length;

      //检查是否有非法数据被添加进数据集
      // this.illegal = false;
      // for (let i = 0; i < checkedList.length; i++) {
      //   for (let j = 0; j < this.wrongcodelist.length; j++) {
      //     if (checkedList[i] == this.wrongcodelist[j]) {//若有错误的数据被选中，则数据非法，输出提示
      //       this.wrongcodelistchecked = checkedList[i];
      //       this.illegal = true;
      //       break;
      //     }
      //   }
      // }
    },
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
.numberShow {
  display: inline-block;
  min-width: 300px;
  width: calc(100% - 50px);
  // width: calc(100% - 50px);
}
.left {
  display: inline-block;
  width: 120px;
  // 文本超出省略
  vertical-align: sub;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.right {
  width: calc(100% - 120px) !important;
}
/deep/ .threeline {
  .ant-form-item-children {
    display: flex;
  }
}
/deep/ .ant-checkbox-wrapper {
  display: block;
  height: 28px; //和右侧的配置框高度保持一致
}
/deep/ .ant-form-item-label {
  text-align: left;
}
/deep/ .ant-col-6 {
  width: 160px;
}
/deep/ .ant-col-18 {
  width: calc(100% - 160px);
}
/deep/ .ant-form label {
  font-size: @descFontSize!important;
}
/deep/ .ant-form-item {
  margin-bottom: 0;
}
/deep/ .ant-progress-outer {
  width: calc(100% - 80px) !important;
  height: 20px;
}
/deep/ .ant-progress-inner {
  background-color: transparent;
  height: 16px;
}
/deep/ .ant-progress-inner .ant-progress-bg {
  //background-color: transparent;
  height: 16px !important;
}
/deep/ .ant-progress-inner {
  border-radius: 0;
}
/deep/ .ant-progress-status-success .ant-progress-bg {
  background-color: #1890ff !important;
  border-radius: 5px !important;
}
.mr-hor-5 {
  margin: 5px 0;
}
.ant-row .label-text {
  font-size: 15px;
  color: #333;
  margin-bottom: 5px;
}
.unmap-box {
  &-header {
    color: #333;
    font-size: 15px;
    margin-bottom: 10px;
  }
  /deep/ .ant-checkbox-wrapper {
    display: inline-block;
  }
}
</style>