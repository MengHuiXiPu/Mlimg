/*
 * @Author: lichao.sun 
 * @Date: 2025-01-13 17:00:54 
 * @Last Modified by: lichao.sun
 * @Last Modified time: 2025-02-17 15:48:28
 * @description: step2 label映射配置,会被mixin到DatasetLabelSelect中
 */


import { validateNameWithHyphen } from '@/utils';
import { mapState } from 'vuex';
export default {
  data() {
    //校验输入的mainLabel不能重复
    const validateMainLabel = (rule, value, callback) => {
      if (value) {
        const mainLabels = this.labelRule.map(item => item.mainLabel);
        const mainLabelList = mainLabels.filter(item => item == value);
        if (mainLabelList?.length > 1) {
          callback(new Error('映射后Label不能重复'));
        }
        callback();
      }
    };
    return {
      // 用于配置label映射规则
      labelRule: [{
        mainLabel: "",
        originalLabel: [
          // ""
        ],
        // 表示是全部还是自定义数量, 前端使用，保存时去除
        _isAll: true,
        limit: -1
      }],
      mappingFormRules: {
        mainLabel: [
          { required: true, message: '请输入映射后Label', trigger: ["blur", "change"], },
          { validator: validateNameWithHyphen, trigger: ["blur", "change"] },
          { validator: validateMainLabel, trigger: ["blur"] }
        ],
        originalLabel: [{
          required: true, message: '请选择原始Label', trigger: 'change'
        }],
        limit: [
          // { validator: validLimit, trigger: ["blur", "change"]}
          { required: true, message: '请输入训练样本数限制', trigger: ["blur", "change"], }
        ]
      },
    }
  },
  computed: {
    ...mapState({
      step: state => state.model.step,
    }),
    // 锁定编辑状态
    readOnly() {
      return this.modelInfoRecord.taskStatus === 1
    },
    // 过滤掉已经存在于labelrule的originalLabel中的selectType
    calcSelectedTypeList() {
      return this.selectedTypeList.filter(item => {
        return !this.labelRule.some(rule => {
          return rule.originalLabel.includes(item.value)
        })
      })
    },
    // 只是为了实现表单验证
    labelRuleObj() {
      return {
        labelRule: this.labelRule
      }
    },
  },
  methods: {
    /**
    * @public
    * @description 转换并采集标签映射配置到store，因为他妈的这个傻逼代码，在后面几步保存时也需要这个信息
    * 在step2中点击下一步时调用
    */
    collectLabelMapData() {
      return new Promise((resolve, reject) => {
        let labelRule = [] // 用于保存最终的labelRule
        if (this.step.labelMapConfig.needLabelMap) { //需要label映射时，先校验表单
          this.$refs.refMappingForm.validate(valid => {
            if (valid) {
              // 采集需要映射的label配置信息
              const needMapRes = this.labelRule.map(label => {
                return {
                  mainLabel: label.mainLabel,
                  originalLabel: label.originalLabel,
                  // 如果是全选，则为-1，否则就是填写的limit值
                  limit: label._isAll ? -1 : label.limit,
                }
              })
              // 采集不需要采集的label配置信息
              const needNotMapRes = (this.calcSelectedTypeList || []).filter(item => item._isChecked).map(label => {
                return {
                  mainLabel: label.value,
                  originalLabel: [label.value],
                  // 如果是全选，则为-1，否则就是填写的limit值
                  limit: label._isAll ? -1 : label.limit,
                }
              })
              labelRule = [...needMapRes, ...needNotMapRes]
              // 提交到store中
              this.$store.commit('setLabelMapConfig', {
                labelRule,
              })
              resolve(labelRule)
            } else {
              reject("请检查映射表单填写是否符合规范")
            }
          })
        } else { //不需要label映射时 从selectedTypeList中取数据即可
          let illegalLabel = "" //标志是否校验通过,存在时不通过
          labelRule = this.form.selectedType.map(label => {
            const currentLabel = this.selectedTypeList.find(item => item.value === label)
            if (!currentLabel._isAll && !currentLabel.limit) { //自定义数量，但是又没有输入具体的数量
              illegalLabel = currentLabel.value
            }
            return {
              mainLabel: label,
              originalLabel: [], //空
              // 如果是全选，则为-1，否则就是填写的limit值
              limit: currentLabel._isAll ? -1 : currentLabel.limit,
            }
          })
          if (illegalLabel) {
            this.$message.warning(`请检查标签：${illegalLabel}的训练样本数`)
            return reject(`请检查标签：${illegalLabel}的训练样本数`)
          }
          // console.log("labelRule", labelRule)
          this.$store.commit('setLabelMapConfig', {
            labelRule,
          })
          resolve(labelRule)
        }
      })
    },
    // 实时计算样本总量
    calcPictureCount(labels) {
      if (!labels?.length) return 0
      return labels.reduce((total, label) => {
        const labelInfo = this.selectedTypeList.find(item => item.value === label)
        if (labelInfo) {
          total += labelInfo.number
        }
        return total
      }, 0)
    },

    // 新增映射关系配置
    handleAddLabelMapItem() {
      this.labelRule.push({
        mainLabel: "",
        originalLabel: [],
        // 表示是全部还是自定义数量, 前端使用，保存时去除
        _isAll: true,
        limit: -1
      })
    },
    // 删除映射关系配置项
    handleDeleteLabelMapItem(index) {
      this.labelRule.splice(index, 1)
    },
  },
}