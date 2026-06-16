(function () {
	"use strict";

	if (!("serviceWorker" in navigator)) {
		return;
	}

	window.addEventListener("load", function () {
		navigator.serviceWorker.register("/service-worker.js").catch(function () {
			// O PWA é progressivo: a navegação principal continua funcionando sem service worker.
		});
	});
})();
