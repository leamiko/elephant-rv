define(function(require, exports, module) {
	//关闭back、menu按键监听，这样侧滑主界面会自动获得back和memu的按键事件，仅在主界面处理按键逻辑即可；
	mui.init({
		keyEventBind: {
			backbutton: false,
			menubutton: false
		}
	});
	var main = null;
	mui.plusReady(function () {
		main = plus.webview.currentWebview().opener();
	})
	
	function closeMenu () {
		mui.fire(main,"menu:swiperight");
	}
	
	//左滑显示出来的菜单，只需监听右滑，然后将菜单关闭即可；在该菜单上左滑，不做任何操作；
	window.addEventListener("swiperight",closeMenu);
	
	var utils = require('../libs/utils.js');
	var pageHepler = require('../common/page-helper');
	
	pageHepler.init({
		handler: self
	});
});