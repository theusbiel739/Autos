(function () {
	const stateMessages = {
		loading: {
			icon: "bi-arrow-repeat",
			title: "Carregando informações administrativas",
			text: "Aguarde enquanto os dados autorizados são carregados.",
			className: ""
		},
		error: {
			icon: "bi-exclamation-triangle",
			title: "Não foi possível carregar os dados",
			text: "Não foi possível carregar as informações administrativas agora.",
			className: "is-error"
		},
		empty: {
			icon: "bi-inbox",
			title: "Nenhum item encontrado",
			text: "Não há denúncias ou registros administrativos para mostrar.",
			className: "is-empty"
		},
		restricted: {
			icon: "bi-shield-lock",
			title: "Acesso restrito",
			text: "O acesso é validado pelo servidor e pelas permissões administrativas.",
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

			feedback.textContent = button.dataset.adminAction + " Nenhuma ação foi enviada ao servidor.";
		});
	});
})();
