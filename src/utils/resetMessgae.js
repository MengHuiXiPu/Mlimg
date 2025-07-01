/*
 * @Author: lichao.sun 
 * @Date: 2024-04-29 15:12:56 
 * @Last Modified by: lichao.sun
 * @Last Modified time: 2024-04-29 15:15:48
 * @description: 只能同时弹出一个el-message提示框
 */

import { Message } from 'element-ui';
let messageInstance = null;
const resetMessage = (options) => {
    if(messageInstance) {
        messageInstance.close()
    }
    messageInstance = Message(options)
};
['error','success','info','warning'].forEach(type => {
    resetMessage[type] = options => {
        if(typeof options === 'string' || !options) {
            options = {
                message:options || "error"
            }
        }
        options.type = type
        return resetMessage(options)
    }
})
export const message = resetMessage

