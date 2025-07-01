<template>
  <div
    class="modal fade"
    tabindex="-1"
    role="dialog"
    :id="type + '_modal'"
    aria-hidden="true"
    data-backdrop="static"
    data-keyboard="false"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">选择分类：</h5>
        </div>
        <div class="modal-body">
          <input
            style="
              color: black;
              width: 80%;
              padding-left: 10px;
              margin: 0 auto 5px;
              border: none;
              outline: none;
              border-bottom: 1px solid #000;
            "
            :value="selectedCategoryName"
            disabled
          />

          <div style="overflow: hidden">
            <!-- <select class="form-control" v-model="selectedCategory">
                  <option
                    v-for="option in categoriesList"
                    :key="option.text"
                    :value="option.value"
                  >
                    {{ option.text }}
                  </option>
                </select> -->
            <!-- <el-radio-group v-model="selectedCategory">
                  <el-radio
                    v-for="option in categoriesList"
                    :key="option.value"
                    :label="option.value"
                    style="margin-top: 13px; margin-right: 15px"
                    >{{ option.text }}</el-radio
                  >
                </el-radio-group> -->
            <ul class="category-ul" @click="handleCategory">
              <li
                v-for="option in categoriesList"
                :key="option.value"
                class="category-li"
                :class="{ active: activeItem == option.value }"
                :data-value="option.value"
                :data-text="option.text"
              >
                {{ option.text }}
              </li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-primary"
            @click="handleConfirm"
            :disabled="!isFormValid"
            data-dismiss="modal"
            style="font-size: 14px"
          >
            保存
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            data-dismiss="modal"
            @click="handleCancel"
            style="font-size: 14px"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import JQuery from "jquery";

let $ = JQuery;
export default {
  props: {
    type: {
      type: String,
      default: "",
    },
    categoriesList: {
      type: Array,
      default: [],
    },
  },
  data() {
    return {
      categoriesListCopy: [],
      selectedCategory: "",
      selectedCategoryName: "",
      activeItem: null,
    };
  },
  computed: {
    isFormValid() {
      return this.selectedCategory !== "";
    },
  },
  methods: {
    show() {
      $(`#${this.type}_modal`).modal("show");
    },
    hide() {
      $(`#${this.type}_modal`).modal("hide");
    },
    handleConfirm() {
      // console.log(this.selectedCategory);
      this.$emit("on-confirm", this.selectedCategory);
    },
    handleCancel() {
      this.$emit("on-cancel");
      this.selectedCategoryName = "";
    },
    handleCategory(event) {
      const clickedLi = event.target.closest(".category-li");
      if (clickedLi) {
        const value = parseInt(clickedLi.dataset.value);
        this.selectedCategory = value;
        this.selectedCategoryName = clickedLi.dataset.text;
        this.activeItem = value;
      }
    },
    change(event) {
      const inputValue = event.target.value.trim();
      if (inputValue.length === 0) {
        this.categoriesListCopy = this.categoriesList;
      } else {
        this.categoriesListCopy = this.categoriesList.filter((item) => {
          return item.text.includes(inputValue);
        });
      }
    },
  },
  mounted() {
    this.categoriesListCopy = this.categoriesList;
  },
};
</script>

<style lang="scss">
::v-deep.el-radio__label {
  padding-left: 5px !important;
}
.category-ul {
  width: 80%;
  height: 200px;
  overflow-y: auto;
  list-style: none;
  border: 1px solid gray;
  padding: 0;
  margin: 0 auto;
}
.category-li {
  padding-left: 15px;
  height: 20px;
  line-height: 20px;
  color: black;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}
.category-li:hover {
  background-color: #d9d9d9;
}
.active {
  background-color: #d9d9d9;
}
</style>
