
import { isNil } from 'lodash';
import { reactive, watch, ref } from 'vue';

const BaseModal = {
    name: 'BaseModal',
    inheritAttrs: false,
    model: {
        prop: 'visible',
        event: 'change',
    },
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
        width: {
            type: String,
            default: '600px',
        },
        okText: {
            type: String,
            default: '确定',
        },
        cancelText: {
            type: String,
            default: '取消',
        },
        footer: Function,
        showCancel: {
            type: Boolean,
            default: true,
        },
        showOk: {
            type: Boolean,
            default: true,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            dialogRef: null,
            state: {
                sVisible: !isNil(this.visible) ? this.visible : false,
            },
        }
    },
    methods: {
        handleCancel(e) {
            this.emit('cancel', e);
            this.emit('change', false);
        },
        chandleOk(e) {
            this.emit('ok', e);
        },
        handleClose(e) {
            // 这里只针对状态变更进行控制，只转发 element close 事件
            this.emit('close', e);
            this.emit('change', false);
        },
        render(h) {
            const renderFooter = () => {
                return h('div', { class: 'modal-footer' }, [
                    this.showCancel && h('el-button', {
                        attrs: { id: 'cancel' },
                        on: { click: this.handleCancel }
                    }, this.cancelText),
                    this.showOk && h('el-button', {
                        attrs: { id: 'ok', type: 'primary', disabled: this.disabled, loading: this.loading },
                        on: { click: this.handleOk }
                    }, this.okText)
                ]);
            };

            // footer
            const footer = this.$slots.footer || renderFooter();

            const dialogProps = {
                props: {
                    closeOnClickModal: false,
                    appendToBody: true,
                    visible: this.state.sVisible,
                    ...this.$props,
                    ...this.$attrs,
                },
                on: {
                    close: this.handleClose,
                    // 转发 el-dialog 事件
                    ...this.$listeners,
                },
                ref: "dialogRef"
            };

            return h('el-dialog', dialogProps, [
                this.$slots.default,
                h('div', { slot: 'footer' }, footer)
            ]);
        }
    },
    watch: {
        visible: {
            handle(val){
                Object.assign(this.state, {
                    sVisible: val,
                });
            }
        }
    },

};

export default BaseModal;