function Mixin() {
}

Mixin.prototype = {
  environment: function () {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.MixinContext) {
      return 'iOS';
    }
    if (window.MixinContext && window.MixinContext.getContext) {
      return 'Android';
    }
    return undefined;
  },

  conversationId: function () {
    return "4482a2e7-9b28-4999-b9b4-6173aa41e107";
    switch (this.environment()) {
      case 'iOS':
        var ctx = prompt('MixinContext.getContext()');
        return JSON.parse(ctx).conversation_id;
      case 'Android':
        var ctx = window.MixinContext.getContext();
        return JSON.parse(ctx).conversation_id;
      default:
        return undefined;
    }
  },
};

export default Mixin;
