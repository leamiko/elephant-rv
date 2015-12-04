define(function(require, exports, module) {
	(function($) {
		var Intent = null,
			main = null;
		// H5 plus事件处理
		$.plusReady(function() {
			Intent = plus.android.importClass("android.content.Intent");
			main = plus.android.runtimeMainActivity();
		});
		document.getElementById("share").addEventListener('tap', function(event) {
			event.stopPropagation();
			var intent = new Intent(Intent.ACTION_SEND);
			intent.setType("text/plain");
			intent.putExtra(Intent.EXTRA_TEXT, '123213');
			intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
			main.startActivity(Intent.createChooser(intent, "系统分享"));
		});
	})(mui);
});