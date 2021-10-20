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
    return "03db3b29-793c-4cf6-a3bd-7c583630cbb3";
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
