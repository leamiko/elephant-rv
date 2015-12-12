/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require, i, e) {
	mui.init({
		subpages: [{
			"url": '/app/booking.html',
			"id": 'booking.html',
			"styles": {
				"top": "45px",
				"bottom": "51px"
			}
		}]
	});
	var news;
	document.addEventListener('mui.view.beforeshow', function(event) {
			console.log(event.detail.news.title);
				//var bookingWebview = plus.webview.getWebviewById('booking.html');
				//触发子窗口变更新闻详情
				//console.log(bookingWebview);
				news = event.detail.news;
		});
	mui.plusReady(function() {
		var bookingWebview = plus.webview.currentWebview().children()[0];
		/*mui.preload({
			"url": '/app/booking.html',
			"id": 'booking.html',
			"styles": {
				"top": '45px',
				"bottom": '51px'
			}, //窗口参数
		});
			"extras": {} //自定义扩展参数*/
		//var t=require("../common/page-helper"),n=require("../controls/price-detail/main"),o=require("../controls/booking-date/main"),c=i;
		console.log('book_main.js');
		console.log(news);
				//var title = document.getElementById("title");
				//title.innerText = event.detail.news.title;
				//var gearbox = document.getElementById("gearbox");
		mui.fire(bookingWebview, 'mui.view.beforeshow', {
					news: news
				});
	});
});