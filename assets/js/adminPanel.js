(function () {
	"use strict";

	var REPORT_LIMIT = 20;
	var ALLOWED_STATUSES = ["pendente", "em_analise", "resolvida", "rejeitada"];
	var ALLOWED_SOURCE_STATUSES = ["ativa", "inativa"];
	var state = {
		post: {
			page: 1,
			status: "",
			reports: [],
			hasNextPage: false
		},
		comment: {
			page: 1,
			status: "",
			reports: [],
			hasNextPage: false
		},
		hasLoadError: false,
		newsSources: [],
		selectedReport: null
	};

	function getElement(id) {
		return document.getElementById(id);
	}

	function getKindLabel(kind) {
		return kind === "comment" ? "comentário" : "post";
	}

	function getKindTitle(kind) {
		return kind === "comment" ? "Comentário" : "Post";
	}

	function getReportTarget(report) {
		if (!report) {
			return null;
		}

		return report.target_type === "comment" ? report.comment : report.post;
	}

	function getReporterName(report) {
		return report && report.denunciante && report.denunciante.nome_exibicao
			? report.denunciante.nome_exibicao
			: "Não informado";
	}

	function getAuthorName(report) {
		var target = getReportTarget(report);

		return target && target.autor && target.autor.nome_exibicao
			? target.autor.nome_exibicao
			: "Não informado";
	}

	function getTargetContent(report) {
		var target = getReportTarget(report);

		return target && target.conteudo ? target.conteudo : "Conteúdo indisponível.";
	}

	function getReportTypeName(report) {
		return report && report.tipo_denuncia && report.tipo_denuncia.nome
			? report.tipo_denuncia.nome
			: "Tipo não informado";
	}

	function normalizeStatus(status) {
		return ALLOWED_STATUSES.indexOf(status) >= 0 ? status : "pendente";
	}

	function normalizeSourceStatus(status) {
		return ALLOWED_SOURCE_STATUSES.indexOf(status) >= 0 ? status : "inativa";
	}

	function formatStatus(status) {
		var labels = {
			pendente: "Pendente",
			em_analise: "Em análise",
			resolvida: "Resolvida",
			rejeitada: "Rejeitada"
		};

		return labels[status] || "Pendente";
	}

	function formatSourceStatus(status) {
		return normalizeSourceStatus(status) === "ativa" ? "Ativa" : "Inativa";
	}

	function formatDateTime(value) {
		if (!value) {
			return "Não informado";
		}

		var date = new Date(value);

		if (Number.isNaN(date.getTime())) {
			return "Não informado";
		}

		return new Intl.DateTimeFormat("pt-BR", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		}).format(date);
	}

	function truncateText(value, maxLength) {
		var text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

		if (!text) {
			return "Conteúdo indisponível.";
		}

		return text.length > maxLength ? text.slice(0, maxLength - 1) + "..." : text;
	}

	function setStatus(element, message, type) {
		if (!window.AutosApi || !element) {
			return;
		}

		window.AutosApi.setStatus(element, message, type);
	}

	function clearElement(element) {
		if (!window.AutosApi || !element) {
			return;
		}

		window.AutosApi.clearElement(element);
	}

	function createCell(text) {
		var cell = document.createElement("td");
		cell.textContent = text;

		return cell;
	}

	function createStatusBadge(status) {
		var badge = document.createElement("span");
		badge.className = "badge-soft admin-status-badge admin-status-" + normalizeStatus(status);
		badge.textContent = formatStatus(status);

		return badge;
	}

	function createSourceStatusBadge(status) {
		var normalizedStatus = normalizeSourceStatus(status);
		var badge = document.createElement("span");

		badge.className = "badge-soft admin-status-badge admin-source-status-" + normalizedStatus;
		badge.textContent = formatSourceStatus(normalizedStatus);

		return badge;
	}

	function createDetailItem(label, value) {
		var item = document.createElement("article");
		var title = document.createElement("span");
		var content = document.createElement("p");

		title.textContent = label;
		content.textContent = value || "Não informado";
		item.append(title, content);

		return item;
	}

	function createQuery(params) {
		var query = new URLSearchParams();

		Object.keys(params).forEach(function (key) {
			if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
				query.set(key, params[key]);
			}
		});

		return query.toString();
	}

	function requestAdmin(path, options) {
		return window.AutosApi.request(path, Object.assign({}, options || {}, {
			auth: true,
			credentials: "include"
		}));
	}

	function getFriendlyAdminMessage(error) {
		if (error && error.status === 401) {
			return "Login necessário. Entre na sua conta para acessar o painel administrativo.";
		}

		if (error && error.status === 403) {
			return "Acesso restrito a moderadores e administradores.";
		}

		return window.AutosApi.getErrorMessage(error);
	}

	function getElements(kind) {
		var prefix = kind === "comment" ? "comment" : "post";

		return {
			body: getElement(prefix + "-reports-body"),
			status: getElement(prefix + "-reports-status"),
			pageLabel: getElement(prefix + "-page-label"),
			prevButton: document.querySelector("[data-page-action='" + prefix + "-prev']"),
			nextButton: document.querySelector("[data-page-action='" + prefix + "-next']")
		};
	}

	function updateMetrics() {
		var postReports = state.post.reports;
		var commentReports = state.comment.reports;
		var pendingCount = postReports.concat(commentReports).filter(function (report) {
			return report.status === "pendente";
		}).length;

		getElement("metric-post-reports").textContent = String(postReports.length);
		getElement("metric-comment-reports").textContent = String(commentReports.length);
		getElement("metric-pending-reports").textContent = String(pendingCount);
	}

	function renderReportRows(kind) {
		var elements = getElements(kind);
		var reports = state[kind].reports;

		clearElement(elements.body);

		if (!reports.length) {
			var emptyRow = document.createElement("tr");
			var emptyCell = document.createElement("td");

			emptyCell.colSpan = 6;
			emptyCell.textContent = "Nenhuma denúncia encontrada para este filtro.";
			emptyRow.appendChild(emptyCell);
			elements.body.appendChild(emptyRow);
			setStatus(elements.status, "Nenhuma denúncia encontrada.", "empty");
		} else {
			reports.forEach(function (report) {
				var row = document.createElement("tr");
				var statusCell = document.createElement("td");
				var actionCell = document.createElement("td");
				var actionButton = document.createElement("button");

				actionButton.className = "btn btn-outline-primary btn-sm";
				actionButton.type = "button";
				actionButton.innerHTML = '<i class="bi bi-eye" aria-hidden="true"></i> Ver';
				actionButton.addEventListener("click", function () {
					loadReportDetail(kind, report.id);
				});

				statusCell.appendChild(createStatusBadge(report.status));
				actionCell.appendChild(actionButton);
				row.append(
					createCell(String(report.id)),
					createCell(getReportTypeName(report)),
					createCell(truncateText(getTargetContent(report), 90)),
					statusCell,
					createCell(formatDateTime(report.criado_em)),
					actionCell
				);
				elements.body.appendChild(row);
			});

			setStatus(elements.status, "", "loaded");
		}

		elements.pageLabel.textContent = "Página " + state[kind].page;
		elements.prevButton.disabled = state[kind].page <= 1;
		elements.nextButton.disabled = !state[kind].hasNextPage;
		updateMetrics();
	}

	function getSourceFormData() {
		return {
			nome: getElement("news-source-name").value.trim(),
			url_site: getElement("news-source-site-url").value.trim(),
			url_rss: getElement("news-source-rss-url").value.trim(),
			status: getElement("news-source-status-select").value
		};
	}

	function resetSourceForm() {
		getElement("news-source-id").value = "";
		getElement("news-source-form").reset();
		getElement("news-source-status-select").value = "ativa";
		getElement("news-source-form-title").textContent = "Nova fonte RSS";
		getElement("news-source-form-note").textContent = "Informe os dados da fonte para cadastrar uma nova origem de notícias.";
		getElement("news-source-submit").innerHTML = '<i class="bi bi-save" aria-hidden="true"></i> Salvar fonte';
		setStatus(getElement("news-source-form-feedback"), "", "loaded");
	}

	function fillSourceForm(source) {
		getElement("news-source-id").value = String(source.id);
		getElement("news-source-name").value = source.nome || "";
		getElement("news-source-site-url").value = source.url_site || "";
		getElement("news-source-rss-url").value = source.url_rss || "";
		getElement("news-source-status-select").value = normalizeSourceStatus(source.status);
		getElement("news-source-form-title").textContent = "Editar fonte RSS";
		getElement("news-source-form-note").textContent = "Atualize os dados permitidos para esta fonte.";
		getElement("news-source-submit").innerHTML = '<i class="bi bi-save" aria-hidden="true"></i> Atualizar fonte';
		setStatus(getElement("news-source-form-feedback"), "", "loaded");
	}

	function renderNewsSourceRows() {
		var body = getElement("news-sources-body");
		var sources = state.newsSources;

		clearElement(body);

		if (!sources.length) {
			var emptyRow = document.createElement("tr");
			var emptyCell = document.createElement("td");

			emptyCell.colSpan = 6;
			emptyCell.textContent = "Nenhuma fonte RSS cadastrada.";
			emptyRow.appendChild(emptyCell);
			body.appendChild(emptyRow);
			setStatus(getElement("news-sources-status"), "Nenhuma fonte RSS cadastrada.", "empty");
			return;
		}

		sources.forEach(function (source) {
			var row = document.createElement("tr");
			var rssLink = document.createElement("a");
			var rssCell = document.createElement("td");
			var statusCell = document.createElement("td");
			var actionCell = document.createElement("td");
			var actions = document.createElement("div");
			var editButton = document.createElement("button");
			var statusButton = document.createElement("button");
			var nextStatus = normalizeSourceStatus(source.status) === "ativa" ? "inativa" : "ativa";

			rssLink.href = source.url_rss;
			rssLink.rel = "noopener noreferrer";
			rssLink.target = "_blank";
			rssLink.textContent = truncateText(source.url_rss, 48);
			rssCell.appendChild(rssLink);
			statusCell.appendChild(createSourceStatusBadge(source.status));

			editButton.className = "btn btn-outline-primary btn-sm";
			editButton.type = "button";
			editButton.innerHTML = '<i class="bi bi-pencil-square" aria-hidden="true"></i> Editar';
			editButton.addEventListener("click", function () {
				fillSourceForm(source);
			});

			statusButton.className = "btn btn-outline-primary btn-sm";
			statusButton.type = "button";
			statusButton.innerHTML = normalizeSourceStatus(source.status) === "ativa"
				? '<i class="bi bi-pause-circle" aria-hidden="true"></i> Desativar'
				: '<i class="bi bi-play-circle" aria-hidden="true"></i> Ativar';
			statusButton.addEventListener("click", function () {
				updateNewsSourceStatus(source.id, nextStatus);
			});

			actions.className = "admin-actions";
			actions.append(editButton, statusButton);
			actionCell.appendChild(actions);
			row.append(
				createCell(String(source.id)),
				createCell(source.nome || "Não informado"),
				rssCell,
				statusCell,
				createCell(formatDateTime(source.atualizado_em || source.criado_em)),
				actionCell
			);
			body.appendChild(row);
		});

		setStatus(getElement("news-sources-status"), "", "loaded");
	}

	function loadNewsSources() {
		setStatus(getElement("news-sources-status"), "Carregando fontes RSS...", "loading");

		return requestAdmin("/admin/news-sources").then(function (response) {
			state.newsSources = Array.isArray(response.sources) ? response.sources : [];
			renderNewsSourceRows();
		}).catch(function (error) {
			state.hasLoadError = true;
			state.newsSources = [];
			renderNewsSourceRows();
			setStatus(getElement("news-sources-status"), getFriendlyAdminMessage(error), "error");
			setStatus(getElement("admin-global-status"), getFriendlyAdminMessage(error), "error");
		});
	}

	function loadReports(kind) {
		var elements = getElements(kind);
		var reportState = state[kind];
		var endpointKind = kind === "comment" ? "comments" : "posts";
		var query = createQuery({
			page: reportState.page,
			limit: REPORT_LIMIT,
			status: reportState.status
		});

		setStatus(elements.status, "Carregando denúncias de " + getKindLabel(kind) + "s...", "loading");
		elements.prevButton.disabled = true;
		elements.nextButton.disabled = true;

		return requestAdmin("/admin/reports/" + endpointKind + "?" + query).then(function (response) {
			reportState.reports = Array.isArray(response.reports) ? response.reports : [];
			reportState.hasNextPage = reportState.reports.length === REPORT_LIMIT;
			renderReportRows(kind);
		}).catch(function (error) {
			state.hasLoadError = true;
			reportState.reports = [];
			reportState.hasNextPage = false;
			renderReportRows(kind);
			setStatus(elements.status, getFriendlyAdminMessage(error), "error");
			setStatus(getElement("admin-global-status"), getFriendlyAdminMessage(error), "error");
		});
	}

	function renderReportDetail(report) {
		var detail = getElement("report-detail");
		var typeBadge = getElement("selected-report-type");
		var kind = report.target_type === "comment" ? "comment" : "post";
		var target = getReportTarget(report);

		clearElement(detail);
		typeBadge.textContent = "Denúncia de " + getKindLabel(kind);
		detail.append(
			createDetailItem("ID da denúncia", String(report.id)),
			createDetailItem("Tipo da denúncia", getReportTypeName(report)),
			createDetailItem("Descrição", report.descricao || "Sem descrição adicional."),
			createDetailItem("Status", formatStatus(report.status)),
			createDetailItem("Data", formatDateTime(report.criado_em)),
			createDetailItem("Autor do conteúdo", getAuthorName(report)),
			createDetailItem("Denunciante", getReporterName(report)),
			createDetailItem("ID do conteúdo", target && target.id ? String(target.id) : "Não informado"),
			createDetailItem("Conteúdo denunciado", getTargetContent(report))
		);

		state.selectedReport = report;
		getElement("selected-report-id").value = String(report.id);
		getElement("selected-report-kind").value = kind;
		getElement("status-select").value = normalizeStatus(report.status);
		getElement("status-select").disabled = false;
		getElement("status-note").value = "";
		getElement("status-note").disabled = false;
		getElement("status-submit").disabled = false;
	}

	function loadReportDetail(kind, reportId) {
		var endpointKind = kind === "comment" ? "comments" : "posts";

		setStatus(getElement("detail-status"), "Carregando detalhe da denúncia...", "loading");
		setStatus(getElement("status-update-feedback"), "", "loaded");

		return requestAdmin("/admin/reports/" + endpointKind + "/" + encodeURIComponent(reportId)).then(function (response) {
			if (!response.report) {
				throw new Error("Resposta sem denúncia.");
			}

			renderReportDetail(response.report);
			setStatus(getElement("detail-status"), "", "loaded");
		}).catch(function (error) {
			setStatus(getElement("detail-status"), getFriendlyAdminMessage(error), "error");
		});
	}

	function handleFilterChange(kind, value) {
		state[kind].status = value;
		state[kind].page = 1;
		loadReports(kind);
	}

	function handlePageChange(kind, direction) {
		if (direction === "prev" && state[kind].page > 1) {
			state[kind].page -= 1;
		}

		if (direction === "next" && state[kind].hasNextPage) {
			state[kind].page += 1;
		}

		loadReports(kind);
	}

	function handleStatusUpdate(event) {
		event.preventDefault();

		var reportId = getElement("selected-report-id").value;
		var kind = getElement("selected-report-kind").value;
		var status = getElement("status-select").value;
		var note = getElement("status-note").value.trim();
		var submitButton = getElement("status-submit");
		var endpointKind = kind === "comment" ? "comments" : "posts";

		if (!reportId || (kind !== "post" && kind !== "comment")) {
			setStatus(getElement("status-update-feedback"), "Selecione uma denúncia antes de atualizar.", "error");
			return;
		}

		if (ALLOWED_STATUSES.indexOf(status) < 0) {
			setStatus(getElement("status-update-feedback"), "Status inválido. Escolha uma opção permitida.", "error");
			return;
		}

		submitButton.disabled = true;
		setStatus(getElement("status-update-feedback"), "Atualizando status da denúncia...", "loading");

		requestAdmin("/admin/reports/" + endpointKind + "/" + encodeURIComponent(reportId) + "/status", {
			method: "PATCH",
			body: {
				status: status,
				observacao: note || null
			}
		}).then(function (response) {
			var message = response.message || "Status da denúncia atualizado com sucesso.";

			setStatus(getElement("status-update-feedback"), message, "success");

			if (response.report) {
				renderReportDetail(response.report);
			}

			return loadReports(kind);
		}).catch(function (error) {
			setStatus(getElement("status-update-feedback"), getFriendlyAdminMessage(error), "error");
		}).finally(function () {
			submitButton.disabled = false;
		});
	}

	function handleNewsSourceSubmit(event) {
		event.preventDefault();

		var sourceId = getElement("news-source-id").value;
		var submitButton = getElement("news-source-submit");
		var data = getSourceFormData();
		var isEditing = Boolean(sourceId);
		var path = isEditing
			? "/admin/news-sources/" + encodeURIComponent(sourceId)
			: "/admin/news-sources";
		var method = isEditing ? "PATCH" : "POST";

		if (ALLOWED_SOURCE_STATUSES.indexOf(data.status) < 0) {
			setStatus(getElement("news-source-form-feedback"), "Status inválido. Escolha uma opção permitida.", "error");
			return;
		}

		submitButton.disabled = true;
		setStatus(getElement("news-source-form-feedback"), "Salvando fonte RSS...", "loading");

		requestAdmin(path, {
			method: method,
			body: data
		}).then(function (response) {
			var message = response.message || "Fonte RSS salva com sucesso.";

			resetSourceForm();
			setStatus(getElement("news-source-form-feedback"), message, "success");
			return loadNewsSources();
		}).catch(function (error) {
			setStatus(getElement("news-source-form-feedback"), getFriendlyAdminMessage(error), "error");
		}).finally(function () {
			submitButton.disabled = false;
		});
	}

	function updateNewsSourceStatus(sourceId, status) {
		setStatus(getElement("news-sources-status"), "Atualizando status da fonte RSS...", "loading");

		return requestAdmin("/admin/news-sources/" + encodeURIComponent(sourceId) + "/status", {
			method: "PATCH",
			body: {
				status: status
			}
		}).then(function (response) {
			setStatus(
				getElement("news-sources-status"),
				response.message || "Status da fonte RSS atualizado com sucesso.",
				"success"
			);
			return loadNewsSources();
		}).catch(function (error) {
			setStatus(getElement("news-sources-status"), getFriendlyAdminMessage(error), "error");
		});
	}

	function renderSyncErrors(errors) {
		var container = getElement("sync-errors");

		clearElement(container);

		if (!errors.length) {
			container.hidden = true;
			return;
		}

		var title = document.createElement("h3");
		var list = document.createElement("ul");

		title.textContent = "Fontes com erro";
		errors.forEach(function (error) {
			var item = document.createElement("li");
			var source = error.fonte_nome || ("Fonte " + (error.fonte_id || ""));
			var message = error.message || "Não foi possível sincronizar esta fonte.";

			item.textContent = source + ": " + message;
			list.appendChild(item);
		});

		container.append(title, list);
		container.hidden = false;
	}

	function handleNewsSync() {
		var button = getElement("sync-news-button");

		button.disabled = true;
		setStatus(getElement("sync-status"), "Sincronizando notícias RSS...", "loading");
		getElement("sync-result").hidden = true;
		getElement("sync-errors").hidden = true;

		requestAdmin("/admin/news/sync", {
			method: "POST"
		}).then(function (result) {
			var sources = Number(result.sources_processed) || 0;
			var created = Number(result.created_count) || 0;
			var duplicates = Number(result.duplicate_count) || 0;
			var errors = Array.isArray(result.errors) ? result.errors : [];
			var statusMessage = sources === 0
				? "Nenhuma fonte RSS ativa foi encontrada para sincronização."
				: "Sincronização concluída.";

			getElement("sync-sources").textContent = String(sources);
			getElement("sync-created").textContent = String(created);
			getElement("sync-duplicates").textContent = String(duplicates);
			getElement("sync-result").hidden = false;
			getElement("metric-rss-sync").textContent = String(created);
			getElement("metric-rss-note").textContent = sources + " fonte(s), " + duplicates + " duplicada(s).";
			renderSyncErrors(errors);
			setStatus(getElement("sync-status"), statusMessage, errors.length ? "error" : "success");
		}).catch(function (error) {
			setStatus(getElement("sync-status"), getFriendlyAdminMessage(error), "error");
		}).finally(function () {
			button.disabled = false;
		});
	}

	function bindEvents() {
		document.querySelectorAll("[data-report-filter]").forEach(function (select) {
			select.addEventListener("change", function () {
				handleFilterChange(select.dataset.reportFilter, select.value);
			});
		});

		document.querySelectorAll("[data-page-action]").forEach(function (button) {
			button.addEventListener("click", function () {
				var parts = button.dataset.pageAction.split("-");
				handlePageChange(parts[0], parts[1]);
			});
		});

		getElement("status-form").addEventListener("submit", handleStatusUpdate);
		getElement("news-source-form").addEventListener("submit", handleNewsSourceSubmit);
		getElement("news-source-clear-button").addEventListener("click", resetSourceForm);
		getElement("sync-news-button").addEventListener("click", handleNewsSync);
	}

	function init() {
		if (!window.AutosApi) {
			return;
		}

		bindEvents();
		resetSourceForm();
		setStatus(getElement("admin-global-status"), "Carregando dados administrativos...", "loading");
		Promise.all([loadReports("post"), loadReports("comment"), loadNewsSources()]).then(function () {
			if (!state.hasLoadError) {
				setStatus(getElement("admin-global-status"), "", "loaded");
			}
		});
	}

	document.addEventListener("DOMContentLoaded", init);
})();
