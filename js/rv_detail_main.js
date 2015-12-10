define(function(require, exports, module) {
	var url;
	var guid;
	
	var utils = require('../libs/utils.js');
	var pageHepler = require('../common/page-helper');

	pageHepler.init({
		handler: self
	});
	
	(function($) {
		var Intent = null,
			main = null;
		// H5 plus事件处理
		$.plusReady(function() {
			Intent = plus.android.importClass("android.content.Intent");
			main = plus.android.runtimeMainActivity();
		});
		var s = exports;

		s.createInnerList = function() {
			mui.plusReady(function() {
				plus.webview.currentWebview().append(plus.webview.getWebviewById('rv_detail'));
			});
		};

		s.createInnerList();
		document.getElementById("share").addEventListener('tap', function(event) {
				event.stopPropagation();
				var intent = new Intent(Intent.ACTION_SEND);
				intent.setType("text/plain");
				console.log("url is " + url);
				intent.putExtra(Intent.EXTRA_TEXT, url);
				intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
				main.startActivity(Intent.createChooser(intent, "系统分享"));
		});
		var regex = /\((.*)\)/;
		html5sql.openDatabase("kr", "36Kr", 5 * 1024 * 1024);
		document.addEventListener('mui.view.beforeshow', function(event) {
			//console.log("id:" + event.detail.guid);
			kr.getNewsByGuid(decodeURIComponent(event.detail.guid), function(news) {
				console.log("item is " + JSON.stringify(news));
				guid = event.detail.guid;
				url = news.url;
			});
		});

	})(mui);
});