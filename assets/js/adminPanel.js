(function () {
	"use strict";

	var REPORT_LIMIT = 20;
	var ALLOWED_STATUSES = ["pendente", "em_analise", "resolvida", "rejeitada"];
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

	function formatStatus(status) {
		var labels = {
			pendente: "Pendente",
			em_analise: "Em análise",
			resolvida: "Resolvida",
			rejeitada: "Rejeitada"
		};

		return labels[status] || "Pendente";
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
		getElement("sync-news-button").addEventListener("click", handleNewsSync);
	}

	function init() {
		if (!window.AutosApi) {
			return;
		}

		bindEvents();
		setStatus(getElement("admin-global-status"), "Carregando dados administrativos...", "loading");
		Promise.all([loadReports("post"), loadReports("comment")]).then(function () {
			if (!state.hasLoadError) {
				setStatus(getElement("admin-global-status"), "", "loaded");
			}
		});
	}

	document.addEventListener("DOMContentLoaded", init);
})();
