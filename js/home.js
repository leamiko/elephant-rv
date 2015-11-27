define(function(require, exports, module) {
	mui.init({
		swipeBack:true //启用右滑关闭功能
	});
	var slider = mui("#slider");
	slider.slider({interval: 5000});

	var utils = require('../libs/utils.js');
	var pageHepler = require('../common/page-helper');
	
	pageHepler.init({
		handler: self
	});
});