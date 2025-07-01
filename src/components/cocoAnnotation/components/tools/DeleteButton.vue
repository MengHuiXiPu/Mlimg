<template>
  <div>
    <div class="mb8" :style="{ color: iconColor }" @click="clickFunc">
      <i
        v-tooltip.right="text"
        class="fa fa-x fa-trash-o icon"
        :class="{ 'disabled-style': isDisabled }"
      ></i>
      <span class="text-desc">{{ text }}</span>
    </div>
    <div
      class="modal fade"
      id="exampleModal"
      tabindex="-1"
      role="dialog"
      aria-hidden="true"
      data-backdrop="static"
      data-keyboard="false"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <span class="modal-title" id="exampleModalLabel">{{ $t('dataCenter.delImageConfirm') }}</span>
          </div>
          <!-- <div class="modal-body">Are you sure to delete this item?</div> -->
          <div class="modal-footer">
            <a-button
              class="btn-secondary"
              data-dismiss="modal"
            >
              {{ $t('dataCenter.cancel') }}
            </a-button>
            <a-button type="parimary" class="btn-primary" @click="confirmDel">
              {{ $t('dataCenter.ok') }}
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import JQuery from "jquery";
import button from "../../mixins/toolBar/button";
import axios from "axios";
import { mapMutations } from "vuex";
let $ = JQuery;
export default {
  name: "DeleteButton",
  mixins: [button],
  inject: ["modalInstance"],
  props: {
    image: {
      type: Object,
      required: true,
    },
    isDisabled: {
      type: Boolean,
      required: false
    }
  },
  data() {
    return {
      name: "Delete Image",
      text: this.$t('dataCenter.delImage'),
      icon: "fa-trash-o",
    };
  },
  methods: {
    ...mapMutations(["setGroupLoading"]),
    clickFunc() {
      if (this.isDisabled) {
        return
      }
      this.click()
    },
    execute() {
      $("#exampleModal").modal("show");
    },
    confirmDel() {
      this.setGroupLoading(this.image.id);
      axios
        .delete(
          `/api/v1/datacenter/dataListFileDetail/removeMultiPicture?dlId=${this.$parent.dataset.id}&ids=${this.image.id}`
        )
        .then(() => {
          this.modalInstance.deleteImg(this.image.id);
          $("#exampleModal").modal("hide")
        });
    },
  },
};
</script>

<style scoped>
.mb8 {
  cursor: pointer;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}
.disabled-style {
  cursor: not-allowed;
}
.text-desc {
  margin-left: 10px;
  font-size: 9px;
}
.icon {
  font-size: 20px;
}
.modal-title {
  font-size: 16px;
}
.btn-primary, .btn-secondary {
  font-size: 16px;
}
</style>
