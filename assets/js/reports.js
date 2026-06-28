(function () {
	"use strict";

	var reportTypesPromise = null;

	function setButtonBusy(button, isBusy, busyText, defaultText) {
		button.disabled = isBusy;
		button.textContent = isBusy ? busyText : defaultText;
	}

	function getReportTypes() {
		if (!reportTypesPromise) {
			reportTypesPromise = window.AutosApi.request("/reports/types").then(function (response) {
				return Array.isArray(response.report_types) ? response.report_types : [];
			});
		}

		return reportTypesPromise;
	}

	function getReportMessage(error) {
		var code = window.AutosApi.getErrorCode(error);

		if (code === "REPORT_ALREADY_EXISTS") {
			return "Sua denúncia já foi registrada.";
		}

		if (code === "CANNOT_REPORT_OWN_CONTENT") {
			return "Você não pode denunciar seu próprio conteúdo.";
		}

		return window.AutosApi.getErrorMessage(error);
	}

	function updateAuthNote(note, error) {
		if (!note) {
			return;
		}

		note.hidden = !(error && error.status === 401);
	}

	function createOption(value, text) {
		var option = document.createElement("option");
		option.value = value;
		option.textContent = text;

		return option;
	}

	function populateTypes(select, status) {
		if (select.dataset.loaded === "true") {
			return Promise.resolve();
		}

		window.AutosApi.setStatus(status, "Carregando tipos de denúncia...", "loading");

		return getReportTypes().then(function (reportTypes) {
			window.AutosApi.clearElement(select);
			select.appendChild(createOption("", "Selecione o motivo"));

			reportTypes.forEach(function (reportType) {
				select.appendChild(createOption(String(reportType.id), reportType.nome || "Motivo de denúncia"));
			});

			select.dataset.loaded = "true";
			window.AutosApi.setStatus(status, "", "loaded");
		}).catch(function (error) {
			window.AutosApi.setStatus(status, window.AutosApi.getErrorMessage(error), "error");
		});
	}

	function buildReportPath(targetType, targetId) {
		if (targetType === "comment") {
			return "/reports/comments/" + encodeURIComponent(targetId);
		}

		return "/reports/posts/" + encodeURIComponent(targetId);
	}

	function createReportBox(options) {
		var targetType = options.targetType;
		var targetId = options.targetId;
		var label = targetType === "comment" ? "Denunciar comentário" : "Denunciar post";
		var wrapper = document.createElement("div");
		wrapper.className = "report-box";

		var toggle = document.createElement("button");
		toggle.className = "btn btn-link report-toggle";
		toggle.type = "button";
		toggle.textContent = label;
		toggle.setAttribute("aria-expanded", "false");

		var panel = document.createElement("form");
		panel.className = "report-form";
		panel.hidden = true;

		var selectLabel = document.createElement("label");
		selectLabel.className = "form-label";
		selectLabel.textContent = "Motivo";

		var select = document.createElement("select");
		select.className = "form-select";
		select.required = true;
		select.appendChild(createOption("", "Selecione o motivo"));

		var descriptionLabel = document.createElement("label");
		descriptionLabel.className = "form-label";
		descriptionLabel.textContent = "Descrição opcional";

		var description = document.createElement("textarea");
		description.className = "form-control";
		description.maxLength = 300;
		description.rows = 3;
		description.placeholder = "Inclua detalhes úteis para a análise, se desejar.";

		var submit = document.createElement("button");
		submit.className = "btn btn-outline-primary";
		submit.type = "submit";
		submit.textContent = "Enviar denúncia";

		var status = document.createElement("div");
		status.className = "api-state";
		status.setAttribute("aria-live", "polite");

		var note = document.createElement("p");
		note.className = "form-hint";
		note.textContent = "Para denunciar, entre na sua conta.";
		note.hidden = true;

		panel.append(selectLabel, select, descriptionLabel, description, submit, note, status);
		wrapper.append(toggle, panel);

		toggle.addEventListener("click", function () {
			var isHidden = panel.hidden;
			panel.hidden = !isHidden;
			toggle.setAttribute("aria-expanded", isHidden ? "true" : "false");

			if (isHidden) {
				populateTypes(select, status);
			}
		});

		panel.addEventListener("submit", function (event) {
			event.preventDefault();

			if (!select.value) {
				window.AutosApi.setStatus(status, "Escolha um motivo para enviar a denúncia.", "error");
				return;
			}

			setButtonBusy(submit, true, "Enviando...", "Enviar denúncia");
			updateAuthNote(note, null);
			window.AutosApi.setStatus(status, "Enviando denúncia...", "loading");

			window.AutosApi.request(buildReportPath(targetType, targetId), {
				auth: true,
				credentials: "include",
				method: "POST",
				body: {
					tipo_denuncia_id: Number(select.value),
					descricao: description.value.trim() || null
				}
			}).then(function (response) {
				updateAuthNote(note, null);
				window.AutosApi.setStatus(status, response.message || "Denúncia registrada com sucesso.", "success");
				panel.reset();
			}).catch(function (error) {
				updateAuthNote(note, error);
				window.AutosApi.setStatus(status, getReportMessage(error), "error");
			}).finally(function () {
				setButtonBusy(submit, false, "Enviando...", "Enviar denúncia");
			});
		});

		return wrapper;
	}

	window.AutosReports = {
		createReportBox: createReportBox
	};
})();
