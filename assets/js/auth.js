(function () {
	"use strict";

	function getTrimmedValue(form, selector) {
		var field = form.querySelector(selector);

		return field ? field.value.trim() : "";
	}

	function getValue(form, selector) {
		var field = form.querySelector(selector);

		return field ? field.value : "";
	}

	function setButtonBusy(button, isBusy, busyText, defaultText) {
		button.disabled = isBusy;
		button.textContent = isBusy ? busyText : defaultText;
	}

	function renderErrorList(status, message, details) {
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

	function validateLogin(form) {
		var errors = [];

		if (!getTrimmedValue(form, "#email")) {
			errors.push("Informe seu e-mail.");
		}

		if (!getTrimmedValue(form, "#senha")) {
			errors.push("Informe sua senha.");
		}

		return errors;
	}

	function validateRegister(form) {
		var errors = [];
		var password = getValue(form, "#senha");
		var confirmPassword = getValue(form, "#confirmar-senha");
		var legalAge = form.querySelector("#maioridade");
		var terms = form.querySelector("#termos");

		if (getTrimmedValue(form, "#nome").length < 2) {
			errors.push("Informe um nome de exibição com pelo menos 2 caracteres.");
		}

		if (!getTrimmedValue(form, "#email")) {
			errors.push("Informe um e-mail válido.");
		}

		if (password.length < 8) {
			errors.push("A senha deve ter pelo menos 8 caracteres.");
		}

		if (password !== confirmPassword) {
			errors.push("A confirmação de senha não confere.");
		}

		if (!legalAge || !legalAge.checked) {
			errors.push("Confirme que você tem 18 anos ou mais.");
		}

		if (!terms || !terms.checked) {
			errors.push("Aceite os termos de uso e diretrizes da comunidade.");
		}

		return errors;
	}

	async function handleLogin(form, status) {
		var button = form.querySelector("button[type='submit']");
		var errors = validateLogin(form);

		if (errors.length > 0) {
			renderErrorList(status, "Confira os campos antes de entrar.", errors);
			return;
		}

		setButtonBusy(button, true, "Entrando...", "Entrar");
		window.AutosApi.setStatus(status, "Enviando dados de acesso...", "loading");

		try {
			var response = await window.AutosApi.request("/auth/login", {
				auth: true,
				method: "POST",
				body: {
					email: getTrimmedValue(form, "#email"),
					senha: getValue(form, "#senha")
				}
			});

			window.AutosApi.setStatus(status, response.message || "Login realizado com sucesso.", "success");
			form.reset();
			window.location.assign("index.html");
		} catch (error) {
			renderErrorList(status, error.friendlyMessage + " " + error.message, window.AutosApi.getErrorDetails(error));
		} finally {
			setButtonBusy(button, false, "Entrando...", "Entrar");
		}
	}

	async function handleRegister(form, status) {
		var button = form.querySelector("button[type='submit']");
		var errors = validateRegister(form);

		if (errors.length > 0) {
			renderErrorList(status, "Confira os campos antes de criar sua conta.", errors);
			return;
		}

		setButtonBusy(button, true, "Criando conta...", "Criar conta");
		window.AutosApi.setStatus(status, "Enviando cadastro...", "loading");

		try {
			var response = await window.AutosApi.request("/auth/register", {
				method: "POST",
				body: {
					nome_exibicao: getTrimmedValue(form, "#nome"),
					email: getTrimmedValue(form, "#email"),
					senha: getValue(form, "#senha"),
					confirmar_senha: getValue(form, "#confirmar-senha"),
					maior_18: Boolean(form.querySelector("#maioridade").checked),
					aceite_termos: Boolean(form.querySelector("#termos").checked)
				}
			});

			window.AutosApi.setStatus(status, response.message || "Cadastro realizado com sucesso.", "success");
			form.reset();
		} catch (error) {
			renderErrorList(status, error.friendlyMessage + " " + error.message, window.AutosApi.getErrorDetails(error));
		} finally {
			setButtonBusy(button, false, "Criando conta...", "Criar conta");
		}
	}

	function bindAuthForms() {
		var loginForm = document.querySelector("[data-login-form]");
		var registerForm = document.querySelector("[data-register-form]");

		if (!window.AutosApi) {
			return;
		}

		if (loginForm) {
			var loginStatus = loginForm.querySelector("[data-form-status]");

			loginForm.addEventListener("submit", function (event) {
				event.preventDefault();
				handleLogin(loginForm, loginStatus);
			});
		}

		if (registerForm) {
			var registerStatus = registerForm.querySelector("[data-form-status]");

			registerForm.addEventListener("submit", function (event) {
				event.preventDefault();
				handleRegister(registerForm, registerStatus);
			});
		}
	}

	document.addEventListener("DOMContentLoaded", bindAuthForms);
})();
