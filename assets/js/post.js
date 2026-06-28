(function () {
	"use strict";

	var currentPostId = "";
	var commentsContainer = null;
	var commentsStatus = null;

	function getPostId() {
		var params = new URLSearchParams(window.location.search);
		var postId = params.get("id");

		return postId && /^[1-9][0-9]*$/.test(postId) ? postId : "";
	}

	function createMetaText(item) {
		var parts = [];

		if (item.autor && item.autor.nome_exibicao) {
			parts.push("Publicado por " + item.autor.nome_exibicao);
		}

		if (item.criado_em) {
			parts.push(window.AutosApi.formatDate(item.criado_em));
		}

		return parts.join(" - ");
	}

	function setLikeButtonLabel(button, isLiked, total) {
		button.dataset.liked = isLiked ? "true" : "false";

		var icon = document.createElement("i");
		icon.className = isLiked ? "bi bi-heart-fill" : "bi bi-heart";
		icon.setAttribute("aria-hidden", "true");

		button.replaceChildren(icon, " ", isLiked ? "Remover curtida" : "Curtir", " (" + total + ")");
	}

	async function toggleLike(button, feedback) {
		var postId = button.dataset.postId;
		var isLiked = button.dataset.liked === "true";

		button.disabled = true;
		window.AutosApi.setStatus(feedback, "Atualizando sua curtida...", "loading");

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
			window.AutosApi.setStatus(feedback, window.AutosApi.getErrorMessage(error), "error");
		} finally {
			button.disabled = false;
		}
	}

	function appendReportBox(container, targetType, targetId) {
		if (!window.AutosReports || !targetId) {
			return;
		}

		container.appendChild(window.AutosReports.createReportBox({
			targetId: targetId,
			targetType: targetType
		}));
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
		appendReportBox(actions, "post", post.id);
		article.append(badges, title, meta, content, actions);
		container.appendChild(article);
	}

	function renderComments(comments, container, status) {
		window.AutosApi.clearElement(container);

		if (comments.length === 0) {
			window.AutosApi.setStatus(status, "Ainda não há comentários publicados neste post.", "empty");
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

			var actions = document.createElement("div");
			actions.className = "comment-actions";
			appendReportBox(actions, "comment", comment.id);

			article.append(meta, content, actions);
			container.appendChild(article);
		});
	}

	async function loadComments() {
		window.AutosApi.setStatus(commentsStatus, "Carregando comentários...", "loading");

		var commentsResponse = await window.AutosApi.request("/posts/" + currentPostId + "/comments");
		var comments = Array.isArray(commentsResponse.comments) ? commentsResponse.comments : [];
		renderComments(comments, commentsContainer, commentsStatus);
	}

	function renderCommentErrors(status, message, details) {
		window.AutosApi.setStatus(status, message, "error");

		if (!details.length) {
			return;
		}

		var list = document.createElement("ul");
		list.className = "form-feedback-list";

		details.forEach(function (detail) {
			var item = document.createElement("li");
			item.textContent = detail;
			list.appendChild(item);
		});

		status.appendChild(list);
	}

	function bindCommentForm() {
		var form = document.querySelector("[data-comment-form]");

		if (!form) {
			return;
		}

		var status = form.querySelector("[data-comment-form-status]");
		var textarea = form.querySelector("[name='conteudo']");
		var button = form.querySelector("button[type='submit']");

		form.addEventListener("submit", async function (event) {
			event.preventDefault();

			var conteudo = textarea ? textarea.value.trim() : "";

			if (!conteudo) {
				renderCommentErrors(status, "Escreva um comentário antes de enviar.", []);
				return;
			}

			if (conteudo.length > 300) {
				renderCommentErrors(status, "O comentário deve ter no máximo 300 caracteres.", []);
				return;
			}

			button.disabled = true;
			button.textContent = "Enviando...";
			window.AutosApi.setStatus(status, "Publicando comentário...", "loading");

			try {
				var response = await window.AutosApi.request("/posts/" + currentPostId + "/comments", {
					auth: true,
					credentials: "include",
					method: "POST",
					body: {
						conteudo: conteudo
					}
				});

				window.AutosApi.setStatus(status, response.message || "Comentário publicado com sucesso.", "success");
				form.reset();
				await loadComments();
			} catch (error) {
				renderCommentErrors(status, window.AutosApi.getErrorMessage(error), window.AutosApi.getErrorDetails(error));
			} finally {
				button.disabled = false;
				button.textContent = "Publicar comentário";
			}
		});
	}

	async function loadPostDetail() {
		currentPostId = getPostId();
		var postContainer = document.querySelector("[data-post-detail]");
		var postStatus = document.querySelector("[data-post-status]");
		commentsContainer = document.querySelector("[data-comments-list]");
		commentsStatus = document.querySelector("[data-comments-status]");
		var feedback = document.querySelector("[data-post-feedback]");

		if (!postContainer || !postStatus || !commentsContainer || !commentsStatus || !feedback || !window.AutosApi) {
			return;
		}

		if (!currentPostId) {
			window.AutosApi.setStatus(postStatus, "Conteúdo não encontrado.", "error");
			window.AutosApi.setStatus(commentsStatus, "", "loaded");
			return;
		}

		window.AutosApi.setStatus(postStatus, "Carregando post...", "loading");
		window.AutosApi.setStatus(commentsStatus, "Carregando comentários...", "loading");
		window.AutosApi.setStatus(feedback, "", "loaded");

		try {
			var postResponse = await window.AutosApi.request("/posts/" + currentPostId);
			renderPost(postResponse.post, postContainer, feedback);
			window.AutosApi.setStatus(postStatus, "", "loaded");
			await loadComments();
		} catch (error) {
			window.AutosApi.clearElement(postContainer);
			window.AutosApi.clearElement(commentsContainer);
			window.AutosApi.setStatus(postStatus, window.AutosApi.getErrorMessage(error), "error");
			window.AutosApi.setStatus(commentsStatus, "", "loaded");
		}
	}

	document.addEventListener("DOMContentLoaded", function () {
		bindCommentForm();
		loadPostDetail();
	});
})();
