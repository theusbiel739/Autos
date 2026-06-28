(function () {
	"use strict";

	var CACHE_NAME = "autos-static-v13";
	var STATIC_ASSETS = [
		"/",
		"/index.html",
		"/aprender.html",
		"/noticias.html",
		"/comunidade.html",
		"/sobre.html",
		"/login.html",
		"/cadastro.html",
		"/post.html",
		"/admin.html",
		"/manifest.json",
		"/assets/css/home.css",
		"/assets/css/pages.css",
		"/assets/js/api.js",
		"/assets/js/auth.js",
		"/assets/js/community.js",
		"/assets/js/news.js",
		"/assets/js/post.js",
		"/assets/js/adminPanel.js",
		"/assets/js/pwa.js",
		"/assets/js/reports.js",
		"/assets/img/brand/autos-logo.png",
		"/assets/img/brand/pecinha-mascote.png",
		"/assets/img/brand/pecinha-sentado.png",
		"/assets/img/brand/pecinha-sentado-triste.png",
		"/assets/icons/icon-192.png",
		"/assets/icons/icon-512.png",
		"/images/pexels-tara-winstead-8386122.jpg"
	];
	var STATIC_ASSET_SET = new Set(STATIC_ASSETS);

	function isApiRequest(url) {
		return url.pathname.indexOf("/api/") === 0;
	}

	function isCacheableRequest(request) {
		if (request.method !== "GET") {
			return false;
		}

		var url = new URL(request.url);

		if (url.origin !== self.location.origin || isApiRequest(url)) {
			return false;
		}

		return STATIC_ASSET_SET.has(url.pathname);
	}

	function cacheFirst(request) {
		return caches.match(request).then(function (cachedResponse) {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(request).then(function (networkResponse) {
				if (!networkResponse || !networkResponse.ok || networkResponse.type !== "basic") {
					return networkResponse;
				}

				return caches.open(CACHE_NAME).then(function (cache) {
					cache.put(request, networkResponse.clone());
					return networkResponse;
				});
			});
		});
	}

	self.addEventListener("install", function (event) {
		event.waitUntil(
			caches.open(CACHE_NAME).then(function (cache) {
				return cache.addAll(STATIC_ASSETS);
			})
		);
		self.skipWaiting();
	});

	self.addEventListener("activate", function (event) {
		event.waitUntil(
			caches.keys().then(function (cacheNames) {
				return Promise.all(
					cacheNames.map(function (cacheName) {
						if (cacheName !== CACHE_NAME) {
							return caches.delete(cacheName);
						}

						return Promise.resolve();
					})
				);
			}).then(function () {
				return self.clients.claim();
			})
		);
	});

	self.addEventListener("fetch", function (event) {
		if (!isCacheableRequest(event.request)) {
			return;
		}

		event.respondWith(cacheFirst(event.request));
	});
})();
