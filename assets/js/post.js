(function () {
	"use strict";

	function getPostId() {
		var params = new URLSearchParams(window.location.search);
		var postId = params.get("id");

		return postId && /^[1-9][0-9]*$/.test(postId) ? postId : "";
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

		button.disabled = true;
		window.AutosApi.setStatus(feedback, "Atualizando curtida...", "loading");

		try {
			var response = await window.AutosApi.request("/posts/" + postId + "/likes", {
				auth: true,
				credentials: "include",
				method: isLiked ? "DELETE" : "POST"
			});
			var like = response.like || {};

			setLikeButtonLabel(button, Boolean(like.liked), Number(like.total || 0));
			window.AutosApi.setStatus(feedback, response.message || "Curtida atualizada.", "success");
		} catch (error) {
			window.AutosApi.setStatus(feedback, error.friendlyMessage + " " + error.message, "error");
		} finally {
			button.disabled = false;
		}
	}

	function renderPost(post, container, feedback) {
		window.AutosApi.clearElement(container);

		var article = document.createElement("article");
		article.className = "post-card post-detail-card";

		var badges = document.createElement("div");

		if (post.categoria && post.categoria.nome) {
			var category = document.createElement("span");
			category.className = "badge-soft";
			category.textContent = post.categoria.nome;
			badges.appendChild(category);
		}

		if (post.marcador && post.marcador.nome) {
			var marker = document.createElement("span");
			marker.className = "badge-soft";
			marker.textContent = post.marcador.nome;
			badges.appendChild(marker);
		}

		var title = document.createElement("h2");
		title.className = "h3";
		title.textContent = "Post da comunidade";

		var meta = document.createElement("p");
		meta.className = "post-meta";
		meta.textContent = createMetaText(post) || "Publicação da comunidade";

		var content = document.createElement("p");
		content.className = "post-content";
		content.textContent = post.conteudo || "";

		var actions = document.createElement("div");
		actions.className = "post-actions";
		actions.setAttribute("aria-label", "Ações do post");

		var likeButton = document.createElement("button");
		likeButton.className = "btn btn-outline-primary";
		likeButton.type = "button";
		likeButton.dataset.postId = String(post.id);
		setLikeButtonLabel(likeButton, false, Number(post.curtidas && post.curtidas.total ? post.curtidas.total : 0));
		likeButton.addEventListener("click", function () {
			toggleLike(likeButton, feedback);
		});

		actions.appendChild(likeButton);
		article.append(badges, title, meta, content, actions);
		container.appendChild(article);
	}

	function renderComments(comments, container, status) {
		window.AutosApi.clearElement(container);

		if (comments.length === 0) {
			window.AutosApi.setStatus(status, "Nenhum comentário publicado neste post.", "empty");
			return;
		}

		window.AutosApi.setStatus(status, "", "loaded");

		comments.forEach(function (comment) {
			var article = document.createElement("article");
			article.className = "comment-card";

			var meta = document.createElement("p");
			meta.className = "post-meta";
			meta.textContent = createMetaText(comment) || "Comentário da comunidade";

			var content = document.createElement("p");
			content.textContent = comment.conteudo || "";

			article.append(meta, content);
			container.appendChild(article);
		});
	}

	async function loadPostDetail() {
		var postId = getPostId();
		var postContainer = document.querySelector("[data-post-detail]");
		var postStatus = document.querySelector("[data-post-status]");
		var commentsContainer = document.querySelector("[data-comments-list]");
		var commentsStatus = document.querySelector("[data-comments-status]");
		var feedback = document.querySelector("[data-post-feedback]");

		if (!postContainer || !postStatus || !commentsContainer || !commentsStatus || !feedback || !window.AutosApi) {
			return;
		}

		if (!postId) {
			window.AutosApi.setStatus(postStatus, "Conteúdo não encontrado.", "error");
			window.AutosApi.setStatus(commentsStatus, "", "loaded");
			return;
		}

		window.AutosApi.setStatus(postStatus, "Carregando post...", "loading");
		window.AutosApi.setStatus(commentsStatus, "Carregando comentários...", "loading");
		window.AutosApi.setStatus(feedback, "", "loaded");

		try {
			var postResponse = await window.AutosApi.request("/posts/" + postId);
			renderPost(postResponse.post, postContainer, feedback);
			window.AutosApi.setStatus(postStatus, "", "loaded");

			var commentsResponse = await window.AutosApi.request("/posts/" + postId + "/comments");
			var comments = Array.isArray(commentsResponse.comments) ? commentsResponse.comments : [];
			renderComments(comments, commentsContainer, commentsStatus);
		} catch (error) {
			window.AutosApi.clearElement(postContainer);
			window.AutosApi.clearElement(commentsContainer);
			window.AutosApi.setStatus(postStatus, error.friendlyMessage, "error");
			window.AutosApi.setStatus(commentsStatus, "", "loaded");
		}
	}

	document.addEventListener("DOMContentLoaded", loadPostDetail);
})();
