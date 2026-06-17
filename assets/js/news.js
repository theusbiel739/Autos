(function () {
	"use strict";

	function createNewsCard(newsItem, titleTag) {
		var column = document.createElement("div");
		column.className = "col-lg-4";

		var article = document.createElement("article");
		article.className = "content-card h-100";

		var source = document.createElement("p");
		source.className = "card-category";
		source.textContent = newsItem.fonte_nome || "Notícia";

		var title = document.createElement(titleTag || "h3");
		title.className = titleTag === "h2" ? "h3" : "";
		title.textContent = newsItem.titulo || "Notícia sem título";

		var summary = document.createElement("p");
		summary.textContent = newsItem.resumo || "Resumo não informado.";

		var date = document.createElement("p");
		date.className = "card-meta";
		date.textContent = window.AutosApi.formatDate(newsItem.publicada_em) || "Data não informada";

		var link = document.createElement("a");
		link.className = "read-link";
		link.href = newsItem.url_original || "#";
		link.textContent = "Ler notícia original";

		if (newsItem.url_original) {
			link.target = "_blank";
			link.rel = "noopener noreferrer";
		}

		article.append(source, title, summary, date, link);
		column.appendChild(article);

		return column;
	}

	function getNewsLimit(list) {
		var limit = Number(list.dataset.newsLimit || "3");

		return Number.isInteger(limit) && limit > 0 ? limit : 3;
	}

	async function loadNewsSection() {
		var list = document.querySelector("[data-news-list]");
		var status = document.querySelector("[data-news-status]");

		if (!list || !status || !window.AutosApi) {
			return;
		}

		var limit = getNewsLimit(list);
		var isFullPage = list.dataset.newsPage === "true";

		window.AutosApi.clearElement(list);
		window.AutosApi.setStatus(status, "Carregando notícias...", "loading");

		try {
			var response = await window.AutosApi.request("/news?limit=" + encodeURIComponent(limit));
			var news = Array.isArray(response.news) ? response.news : [];

			if (news.length === 0) {
				window.AutosApi.setStatus(status, "Ainda não há notícias publicadas.", "empty");
				return;
			}

			window.AutosApi.setStatus(status, "", "loaded");
			news.forEach(function (newsItem) {
				list.appendChild(createNewsCard(newsItem, isFullPage ? "h2" : "h3"));
			});
		} catch (error) {
			window.AutosApi.setStatus(status, window.AutosApi.getErrorMessage(error), "error");
		}
	}

	document.addEventListener("DOMContentLoaded", loadNewsSection);
})();
