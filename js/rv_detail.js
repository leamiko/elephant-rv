define(function(require, exports, module) {
	//var coverEl = document.querySelector("#kr-article-cover");
	var timeEl = document.getElementById("kr-article-time");
	var titleEl = document.getElementById("rv-detail-title");
	var articleEl = document.getElementById("kr-article-article");
	var footerEl = document.getElementById("footer");
	var guid = '';
	
	mui.init({
		beforeback: function() {
			setTimeout(function() {
				//coverEl.replaceChild(document.createElement('img'), coverEl.querySelector('img'));
				articleEl.innerHTML = '';
				titleEl.innerText = '';
				//footerEl.classList.remove('mui-active');
				document.body.classList.add('kr-overlay');
			}, 200);
		}
	});
	
	var utils = require('../libs/utils.js');
	var pageHepler = require('../common/page-helper');

	pageHepler.init({
		handler: self
	});
	
/*	document.body.addEventListener('tap', function() {
		footerEl.classList.toggle('mui-active');
	});*/
/*	mui('#kr-article-article').on('tap', 'a', function() {
		var url = this.href;
		var protocol = /^([\w-]+:)\/\//.test(url) ? RegExp.$1 : '';
		if (protocol === 'http:' || protocol === 'https:') { //外部链接
			var browserMainWebview = plus.webview.getWebviewById('browser_main');
			var browserWebview = plus.webview.getWebviewById('browser');
			mui.fire(browserMainWebview, 'mui.view.beforeshow');
			browserWebview.loadURL(url);
			browserMainWebview.show('slide-in-bottom', 200);
		}
	});*/
	(function($) {
		var regex = /\((.*)\)/;
		html5sql.openDatabase("kr", "36Kr", 5 * 1024 * 1024);
		document.addEventListener('mui.view.beforeshow', function(event) {
			//if (!event.detail.guid) return;
			if (event.detail.$$type === 'back') {
				setTimeout(function() {
					document.body.classList.remove('kr-overlay');
				}, 500);
				return;
			}
			document.body.classList.add('kr-overlay');
			//console.log("id:" + event.detail.guid);
			kr.getNewsByGuid(decodeURIComponent(event.detail.guid), function(news) {
				console.log("item is " + JSON.stringify(news));
				guid = event.detail.guid;
				//coverEl.querySelector('img').src = news.image || 'img/blank_big.jpg';
				//titleEl.innerText = news.title;
				//console.log("news aaa:" + JSON.stringify(news));
				//var author = news.author || '';
				//timeEl.innerText = kr.format(news.pubDate);
				titleEl.innerText = news.title;
				articleEl.innerHTML = news.description;
				window.scrollTo(0, 0);
				setTimeout(function() {
					document.body.classList.remove('kr-overlay');
				}, 290);
			});
		});
		var Intent = null,
			main = null;
		// H5 plus事件处理
		$.plusReady(function() {
			Intent = plus.android.importClass("android.content.Intent");
			main = plus.android.runtimeMainActivity();
		});

	})(mui);
});