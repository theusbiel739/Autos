(function () {
	const stateMessages = {
		loading: {
			icon: "bi-arrow-repeat",
			title: "Carregando informações administrativas",
			text: "Estado visual para uso futuro durante consultas autorizadas pela API.",
			className: ""
		},
		error: {
			icon: "bi-exclamation-triangle",
			title: "Não foi possível carregar os dados",
			text: "Mensagem demonstrativa para falhas futuras de comunicação com a API.",
			className: "is-error"
		},
		empty: {
			icon: "bi-inbox",
			title: "Nenhum item encontrado",
			text: "Estado visual para quando não houver denúncias ou registros administrativos.",
			className: "is-empty"
		},
		restricted: {
			icon: "bi-shield-lock",
			title: "Acesso restrito",
			text: "A proteção real deve ser validada pelo back-end e pelos endpoints administrativos.",
			className: "is-restricted"
		}
	};

	const statePanel = document.querySelector("#admin-state-panel");
	const stateTitle = document.querySelector("#admin-state-title");
	const stateText = document.querySelector("#admin-state-text");
	const feedback = document.querySelector("#admin-feedback");

	function updateState(stateName) {
		const state = stateMessages[stateName];

		if (!state || !statePanel || !stateTitle || !stateText) {
			return;
		}

		const icon = statePanel.querySelector("i");

		statePanel.classList.remove("is-error", "is-empty", "is-restricted");

		if (state.className) {
			statePanel.classList.add(state.className);
		}

		if (icon) {
			icon.className = "bi " + state.icon;
			icon.setAttribute("aria-hidden", "true");
		}

		stateTitle.textContent = state.title;
		stateText.textContent = state.text;
	}

	document.querySelectorAll("[data-admin-state]").forEach(function (button) {
		button.addEventListener("click", function () {
			updateState(button.dataset.adminState);
		});
	});

	document.querySelectorAll("[data-admin-action]").forEach(function (button) {
		button.addEventListener("click", function () {
			if (!feedback) {
				return;
			}

			feedback.textContent = button.dataset.adminAction + " Nenhuma API foi chamada.";
		});
	});
})();
