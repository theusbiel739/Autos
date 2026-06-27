(function () {
	"use strict";

	function getApiBaseUrl() {
		var hostname = window.location.hostname;
		var localHostname = hostname === "127.0.0.1" || hostname === "localhost";

		if (localHostname) {
			return window.location.protocol + "//" + hostname + ":3001/api";
		}

		return "/api";
	}

	var API_BASE_URL = getApiBaseUrl();

	function createError(status, fallbackMessage, payload) {
		var message = fallbackMessage;

		if (payload && typeof payload.message === "string" && payload.message.trim()) {
			message = payload.message;
		}

		var error = new Error(message);
		error.name = "AutosApiError";
		error.status = status;
		error.payload = payload || null;
		error.friendlyMessage = getFriendlyMessage(status);

		return error;
	}

	function getFriendlyMessage(status) {
		if (status === 400) {
			return "Dados inválidos. Confira as informações e tente novamente.";
		}

		if (status === 401) {
			return "Você precisa entrar na sua conta para realizar esta ação.";
		}

		if (status === 403) {
			return "Você não tem permissão para realizar esta ação.";
		}

		if (status === 404) {
			return "Conteúdo não encontrado.";
		}

		if (status === 409) {
			return "Esta ação já foi registrada.";
		}

		return "Não foi possível carregar os dados agora. Tente novamente em instantes.";
	}

	function getErrorCode(error) {
		return error && error.payload && typeof error.payload.error === "string" ? error.payload.error : "";
	}

	function getErrorMessage(error, fallbackMessage) {
		if (!error) {
			return fallbackMessage || getFriendlyMessage(0);
		}

		if (error.friendlyMessage && error.message && error.friendlyMessage !== error.message) {
			return error.friendlyMessage + " " + error.message;
		}

		return error.friendlyMessage || error.message || fallbackMessage || getFriendlyMessage(0);
	}

	function getErrorDetails(error) {
		if (!error || !error.payload || !Array.isArray(error.payload.details)) {
			return [];
		}

		return error.payload.details
			.map(function (item) {
				return item && item.message ? item.message : "";
			})
			.filter(Boolean);
	}

	function formatDate(value) {
		if (!value) {
			return "";
		}

		var date = new Date(value);

		if (Number.isNaN(date.getTime())) {
			return "";
		}

		return new Intl.DateTimeFormat("pt-BR", {
			day: "2-digit",
			month: "short",
			year: "numeric"
		}).format(date);
	}

	function setStatus(element, message, type) {
		if (!element) {
			return;
		}

		element.className = "api-state";
		element.textContent = message || "";

		if (type) {
			element.classList.add("is-" + type);
		}
	}

	function clearElement(element) {
		while (element && element.firstChild) {
			element.removeChild(element.firstChild);
		}
	}

	async function request(path, options) {
		var requestOptions = options || {};
		var fetchOptions = {
			method: requestOptions.method || "GET",
			headers: {
				Accept: "application/json"
			}
		};

		fetchOptions.credentials = requestOptions.credentials || (requestOptions.auth === true ? "include" : "same-origin");

		if (requestOptions.body !== undefined) {
			fetchOptions.headers["Content-Type"] = "application/json";
			fetchOptions.body = JSON.stringify(requestOptions.body);
		}

		try {
			var response = await fetch(API_BASE_URL + path, fetchOptions);
			var text = await response.text();
			var payload = text ? JSON.parse(text) : null;

			if (!response.ok) {
				throw createError(response.status, getFriendlyMessage(response.status), payload);
			}

			return payload;
		} catch (error) {
			if (error && error.name === "AutosApiError") {
				throw error;
			}

			throw createError(0, getFriendlyMessage(0), null);
		}
	}

	window.AutosApi = {
		clearElement: clearElement,
		formatDate: formatDate,
		getErrorCode: getErrorCode,
		getErrorDetails: getErrorDetails,
		getErrorMessage: getErrorMessage,
		getFriendlyMessage: getFriendlyMessage,
		request: request,
		setStatus: setStatus
	};
})();
