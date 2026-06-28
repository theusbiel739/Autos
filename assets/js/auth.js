(function () {
	"use strict";

	var currentUser = null;

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

	function dispatchAuthChanged() {
		document.dispatchEvent(new CustomEvent("autos:auth-changed", {
			detail: {
				user: currentUser
			}
		}));
	}

	function setUser(user) {
		currentUser = user || null;
		renderAuthState();
		dispatchAuthChanged();
	}

	function getUser() {
		return currentUser;
	}

	function setHidden(elements, shouldHide) {
		elements.forEach(function (element) {
			element.hidden = shouldHide;
		});
	}

	function renderAuthState() {
		var isLoggedIn = Boolean(currentUser);

		setHidden(Array.prototype.slice.call(document.querySelectorAll("[data-auth-guest]")), isLoggedIn);
		setHidden(Array.prototype.slice.call(document.querySelectorAll("[data-auth-user]")), !isLoggedIn);
	}

	async function loadSession(options) {
		var loadOptions = options || {};

		if (!window.AutosApi) {
			renderAuthState();
			return null;
		}

		try {
			var response = await window.AutosApi.request("/auth/me", {
				auth: true,
				credentials: "include"
			});

			setUser(response.user || null);
			return currentUser;
		} catch (error) {
			if (!loadOptions.silent && error && error.status !== 401) {
				throw error;
			}

			setUser(null);
			return null;
		}
	}

	function closeMobileMenu() {
		var menu = document.getElementById("menuPrincipal");

		if (!menu || !menu.classList.contains("show")) {
			return;
		}

		if (window.bootstrap && window.bootstrap.Collapse) {
			window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
			return;
		}

		menu.classList.remove("show");
		var toggler = document.querySelector(".navbar-toggler[aria-controls='menuPrincipal']");

		if (toggler) {
			toggler.setAttribute("aria-expanded", "false");
		}
	}

	function bindMobileMenu() {
		var menu = document.getElementById("menuPrincipal");
		var toggler = document.querySelector(".navbar-toggler[data-bs-target='#menuPrincipal']");

		if (!menu || !toggler) {
			return;
		}

		toggler.addEventListener("click", function () {
			if (window.bootstrap && window.bootstrap.Collapse) {
				return;
			}

			var willShow = !menu.classList.contains("show");
			menu.classList.toggle("show", willShow);
			toggler.setAttribute("aria-expanded", willShow ? "true" : "false");
		});

		menu.querySelectorAll("a, button").forEach(function (item) {
			item.addEventListener("click", closeMobileMenu);
		});
	}

	async function handleLogout(button) {
		var defaultText = button ? button.textContent : "";

		if (button) {
			setButtonBusy(button, true, "Saindo...", defaultText);
		}

		try {
			await window.AutosApi.request("/auth/logout", {
				auth: true,
				credentials: "include",
				method: "POST"
			});
		} catch (error) {
			if (error && error.status !== 401) {
				throw error;
			}
		} finally {
			setUser(null);

			if (button) {
				setButtonBusy(button, false, "Saindo...", defaultText);
			}
		}
	}

	function bindLogoutButtons() {
		document.querySelectorAll("[data-auth-logout]").forEach(function (button) {
			button.addEventListener("click", function (event) {
				event.preventDefault();
				handleLogout(button).catch(function () {
					setUser(null);
				});
			});
		});
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
			errors.push("Confirme que você tem 18 anos ou mais para interagir na comunidade.");
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
		window.AutosApi.setStatus(status, "Verificando seus dados de acesso...", "loading");

		try {
			var response = await window.AutosApi.request("/auth/login", {
				auth: true,
				credentials: "include",
				method: "POST",
				body: {
					email: getTrimmedValue(form, "#email"),
					senha: getValue(form, "#senha")
				}
			});

			var sessionUser = await loadSession();

			if (!sessionUser) {
				window.AutosApi.setStatus(status, "Recebemos o login, mas não foi possível confirmar a sessão. Tente entrar novamente.", "error");
				return;
			}

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
		window.AutosApi.setStatus(status, "Criando sua conta...", "loading");

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

	window.AutosAuth = {
		getUser: getUser,
		loadSession: loadSession,
		setUser: setUser,
		clearUser: function () {
			setUser(null);
		}
	};

	document.addEventListener("DOMContentLoaded", function () {
		renderAuthState();
		bindMobileMenu();
		bindLogoutButtons();
		bindAuthForms();
		loadSession({ silent: true });
	});
})();
