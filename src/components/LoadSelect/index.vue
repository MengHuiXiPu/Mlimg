<!-- load-select.vue -->
<template>
  <el-select
    :value="value"
    v-loadmore="loadMore"
    @focus="focus"
    filterable
    remote
    :filter-method="handleSearch"
    :loading="loading"
    clearable
    v-bind="$attrs"
    v-on="$listeners"
    @change="getSelectedModel"
    @clear="clear"
  >
    <el-option
        v-for="option in data"
        :label="calcLabel(option)"
        :value="option[dictValue]"
        :key="option[dictValue]"
    ></el-option>
    <!-- 此处加载中的value可以随便设置，只要不与其他数据重复即可 -->
    <el-option v-if="hasMore" disabled label="加载中..." value="-1.1111111"></el-option>
    <el-option v-if="data?.length == 0" disabled label="无数据" value="-2.1111111"></el-option>
  </el-select>
</template>

<script>
import debounce from 'lodash.debounce'
export default {
  name: 'load-select',
  directives: {
    loadmore: {
      bind(el, binding, vnode) {
        const SELECTWRAP = el.querySelector(
            ".el-select-dropdown .el-select-dropdown__wrap"
        );
        SELECTWRAP.addEventListener("scroll", function () {
            // scrollTop 这里可能因为浏览器缩放存在小数点的情况，导致了滚动到底部时
            // scrollHeight 减去滚动到底部时的scrollTop ，依然大于clientHeight 导致无法请求更多数据
            // 这里将scrollTop向上取整 保证滚到底部时，触发调用
            const CONDITION = this.scrollHeight - Math.ceil(this.scrollTop) <= this.clientHeight;
            // el.scrollTop !== 0 当输入时，如果搜索结果很少，以至于没看到滚动条，那么此时的CONDITION计算结果是true，会执行bind.value()，此时不应该执行，否则搜索结果不匹配
            if (CONDITION && this.scrollTop !== 0) {
                binding.value();
            }
        });
      },
    }
  },
  props: {
    value: {
        default: ""
    },
    //value对应的完整选择项 对象
    valueObj: {
        type: Object,
        default: () => ({})
    },
    // 下拉列表数据
    data: {
        type: Array,
        default: () => []
    },
    dictLabel: {
        type: String,
        default: "modelName"
    },
    //参见calcLabel
    dictComposeLabel: {
        type: String,
        default: ""
    },
    dictValue: {
        type: String,
        default: "id"
    },
    // 调用页数的接口
    request: {
        type: Function,
        default: () => {}
    },
    // 传入的页码
    page: {
        type: [Number, String],
        default: 1
    },
    // 是否还有更多数据
    hasMore: {
        type: Boolean,
        default: true
    }
  },
  computed: {
    
  },
  data() {
    return {
        // 存储关键字用
        keyword: "", 
        loading: false
    };
  },
  methods: {
    getSelectedModel(value) {
        // 获取完整的模型信息
        const res = this.data.find(model => model.id === value)
        this.$emit('update:valueObj', res || {})
    },
    calcLabel(option) {
        if(this.dictComposeLabel) {
           return option[this.dictLabel] +"-"+option[this.dictComposeLabel]
        }else {
            return option[this.dictLabel] 
        }
    },
    // 请求下一页的数据
    loadMore() {
        // 如果没有更多数据，则不请求
        if (!this.hasMore) {
            return
        }
        // 如果intercept属性为true则不请求数据，
        if (this.loadMore.intercept) {
            return
        }
        this.loadMore.intercept = true;
        this.request({
            page: this.page + 1,
            more: true,
            keyword: this.keyword
        }).finally(() => {
            this.loadMore.intercept = false
        });
    },
    // 选中下拉框没有数据时，自动请求第一页的数据
    focus() {
        if (!this.data.length || !this.value) {
            this.loading = true
            this.request({ page: 1 }).finally(() => {
                this.loading = false
            })
        }
        // 检索后，没有选择而是直接关掉select panel，此时应重置keyword，因为loadmore方法里从this.keyword读取检索信息去查询
        if(!this.value) {
            this.keyword = ''
        }
    },
    /**
     * @public
     * 手动调用加载第一页数据，用于反显时（当前反显的实现方式是，将上次选择的数据插入data第一条，然后去加载第一页data）
     */
    _loadFirstPageData() {
        this.loading = true
        this.request({ page: 1 }).finally(() => {
            this.loading = false
        })
    },
    // 关键字搜索
    handleSearch: debounce(function (keyword) {
        this.keyword = keyword
        this.loading = true
        this.request({ page: 1, keyword }).finally(() => {
            this.loading = false
        });
        }, 800),
    // 删除选中时，如果请求了关键字，则清除关键字再请求第一页的数据
    clear() {
        if (this.keyword) {
            this.keyword = ""
            this.request({ page: 1 })
        }
    }
  }
};
</script>
