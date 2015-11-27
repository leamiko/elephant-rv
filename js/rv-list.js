define(function(require, exports, module) {

	mui.init();

	var utils = require('../libs/utils.js');
	var pageHepler = require('../common/page-helper');

	var self = exports;

	self.createInnerList = function() {
		mui.plusReady(function() {
			plus.webview.currentWebview().append(plus.webview.create('rv-list-inner.html', 'rv-list-inner', {
				top: "44px", 
				bottom: "0px"
			})); 
		}); 
	};
	self.createInnerList();

	pageHepler.init({
		handler: self
	});

});