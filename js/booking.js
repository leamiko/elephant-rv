/**
 * ctrip - ctrip hotel
 * @version v0.0.1
 * @link http://www.dcloud.io
 * @license MIT
 */
define(function(require,i,e)
{
	//mui.init({});
	//var t=require("../common/page-helper"),n=require("../controls/price-detail/main"),o=require("../controls/booking-date/main"),c=i;
	console.log('book.js');
	(function($) {
		document.addEventListener('mui.view.beforeshow', function(event) {
			console.log(event.detail.news.title);
			for(var p in event.detail.news)
			{
				var eId = document.getElementById(p);
				if(eId)
				{
					eId.innerText = event.detail.news[p];
				}
				console.log(p);
			}
			//var title = document.getElementById("title");
			//title.innerText = event.detail.news.title;
			//var gearbox = document.getElementById("gearbox");
		});
	})(mui);
});