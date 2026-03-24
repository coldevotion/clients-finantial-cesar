"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeType = void 0;
var NodeType;
(function (NodeType) {
    NodeType["TRIGGER"] = "trigger";
    NodeType["SEND_MESSAGE"] = "send_message";
    NodeType["WAIT_RESPONSE"] = "wait_response";
    NodeType["CONDITION"] = "condition";
    NodeType["DELAY"] = "delay";
    NodeType["WEBHOOK_CALL"] = "webhook_call";
    NodeType["ASSIGN_TAG"] = "assign_tag";
    NodeType["END"] = "end";
})(NodeType || (exports.NodeType = NodeType = {}));
