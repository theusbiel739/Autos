(function () {
	"use strict";

	function getPostTitle(post) {
		var content = post.conteudo || "Post da comunidade";

		if (content.length <= 58) {
			return content;
		}

		return content.slice(0, 58).trim() + "...";
	}

	function createMetaText(post) {
		var parts = [];

		if (post.autor && post.autor.nome_exibicao) {
			parts.push("Publicado por " + post.autor.nome_exibicao);
		}

		if (post.criado_em) {
			parts.push(window.AutosApi.formatDate(post.criado_em));
		}

		return parts.join(" - ");
	}

	function setButtonState(button, isBusy) {
		button.disabled = isBusy;
		button.setAttribute("aria-busy", isBusy ? "true" : "false");
	}

	function setLikeButtonLabel(button, isLiked, total) {
		button.dataset.liked = isLiked ? "true" : "false";
		button.innerHTML = "";

		var icon = document.createElement("i");
		icon.className = isLiked ? "bi bi-heart-fill" : "bi bi-heart";
		icon.setAttribute("aria-hidden", "true");

		button.append(icon, " ", isLiked ? "Remover curtida" : "Curtir", " (" + total + ")");
	}

	async function toggleLike(button, feedback) {
		var postId = button.dataset.postId;
		var isLiked = button.dataset.liked === "true";
		var total = Number(button.dataset.total || "0");

		setButtonState(button, true);
		window.AutosApi.setStatus(feedback, "Atualizando curtida...", "loading");

		try {
			var response = await window.AutosApi.request("/posts/" + postId + "/likes", {
				auth: true,
				credentials: "include",
				method: isLiked ? "DELETE" : "POST"
			});
			var like = response.like || {};
			var nextTotal = Number(like.total || 0);
			var nextLiked = Boolean(like.liked);

			button.dataset.total = String(nextTotal);
			setLikeButtonLabel(button, nextLiked, nextTotal);
			window.AutosApi.setStatus(feedback, response.message || "Curtida atualizada.", "success");
		} catch (error) {
			window.AutosApi.setStatus(feedback, window.AutosApi.getErrorMessage(error), "error");
		} finally {
			setButtonState(button, false);
		}
	}

	function createPostCard(post, feedback) {
		var column = document.createElement("div");
		column.className = "col-lg-6";

		var article = document.createElement("article");
		article.className = "post-card h-100";

		if (post.categoria && post.categoria.nome) {
			var category = document.createElement("span");
			category.className = "badge-soft";
			category.textContent = post.categoria.nome;
			article.appendChild(category);
		}

		if (post.marcador && post.marcador.nome) {
			var marker = document.createElement("span");
			marker.className = "badge-soft";
			marker.textContent = post.marcador.nome;
			article.appendChild(marker);
		}

		var title = document.createElement("h3");
		title.textContent = getPostTitle(post);

		var meta = document.createElement("p");
		meta.className = "post-meta";
		meta.textContent = createMetaText(post) || "Publicação da comunidade";

		var content = document.createElement("p");
		content.textContent = post.conteudo || "";

		var actions = document.createElement("div");
		actions.className = "post-actions";
		actions.setAttribute("aria-label", "Ações do post");

		var likeButton = document.createElement("button");
		likeButton.className = "btn btn-outline-primary";
		likeButton.type = "button";
		likeButton.dataset.postId = String(post.id);
		likeButton.dataset.total = String(post.curtidas && post.curtidas.total ? post.curtidas.total : 0);
		setLikeButtonLabel(likeButton, false, Number(likeButton.dataset.total));
		likeButton.addEventListener("click", function () {
			toggleLike(likeButton, feedback);
		});

		var detailsLink = document.createElement("a");
		detailsLink.className = "btn btn-outline-primary";
		detailsLink.href = "post.html?id=" + encodeURIComponent(post.id);
		detailsLink.innerHTML = '<i class="bi bi-chat" aria-hidden="true"></i> Ver comentários';

		actions.append(likeButton, detailsLink);
		article.append(title, meta, content, actions);
		column.appendChild(article);

		return column;
	}

	async function loadCommunityPosts() {
		var list = document.querySelector("[data-posts-list]");
		var status = document.querySelector("[data-posts-status]");
		var feedback = document.querySelector("[data-community-feedback]");

		if (!list || !status || !feedback || !window.AutosApi) {
			return;
		}

		window.AutosApi.clearElement(list);
		window.AutosApi.setStatus(status, "Carregando posts...", "loading");
		window.AutosApi.setStatus(feedback, "", "loaded");

		try {
			var response = await window.AutosApi.request("/posts");
			var posts = Array.isArray(response.posts) ? response.posts : [];

			if (posts.length === 0) {
				window.AutosApi.setStatus(status, "Ainda não há posts publicados.", "empty");
				return;
			}

			window.AutosApi.setStatus(status, "", "loaded");
			posts.forEach(function (post) {
				list.appendChild(createPostCard(post, feedback));
			});
		} catch (error) {
			window.AutosApi.setStatus(status, window.AutosApi.getErrorMessage(error), "error");
		}
	}

	document.addEventListener("DOMContentLoaded", loadCommunityPosts);
})();
