(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyAwgOrvq2QGUEPObgkAPXyG_KyJ3l-305w",
    authDomain: "reduzsim-2a6f2.firebaseapp.com",
    projectId: "reduzsim-2a6f2",
    appId: "1:350622536875:web:ed0f9bf3f11b32c894d3ee",
  };

  const form = document.getElementById("cloudLoginForm");
  const emailInput = document.getElementById("cloudLoginEmail");
  const passwordInput = document.getElementById("cloudLoginPassword");
  const submitButton = document.getElementById("cloudLoginButton");
  const submitLabel = submitButton.querySelector("[data-submit-label]");
  const message = document.getElementById("cloudLoginMessage");
  const rememberInput = document.getElementById("rememberAccess");
  const togglePasswordButton = document.getElementById("togglePasswordButton");
  const forgotPasswordButton = document.getElementById("forgotPasswordButton");
  const showPasswordIcon = togglePasswordButton.querySelector('[data-password-icon="show"]');
  const hidePasswordIcon = togglePasswordButton.querySelector('[data-password-icon="hide"]');
  const next = safeNext(new URLSearchParams(window.location.search).get("next"));
  const rememberPreferenceKey = "reduzsim-login-persistence";

  restoreRememberPreference();
  rememberInput.addEventListener("change", saveRememberPreference);
  togglePasswordButton.addEventListener("click", togglePasswordVisibility);

  if (!window.firebase?.initializeApp) {
    showMessage("Não foi possível carregar o acesso seguro. Atualize a página.", true);
    submitButton.disabled = true;
    forgotPasswordButton.disabled = true;
    return;
  }

  const app = window.firebase.apps?.length
    ? window.firebase.app()
    : window.firebase.initializeApp(firebaseConfig);
  const auth = app.auth();
  let exchangingSession = false;

  auth.onAuthStateChanged((user) => {
    if (user && !exchangingSession) establishServerSession(user);
  });

  forgotPasswordButton.addEventListener("click", sendPasswordReset);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    setBusy(true);
    showMessage("Verificando acesso...");

    try {
      await auth.setPersistence(
        rememberInput.checked
          ? window.firebase.auth.Auth.Persistence.LOCAL
          : window.firebase.auth.Auth.Persistence.SESSION,
      );
      saveRememberPreference();
      const credential = await auth.signInWithEmailAndPassword(
        emailInput.value.trim().toLowerCase(),
        passwordInput.value,
      );
      await establishServerSession(credential.user);
    } catch (error) {
      console.error(error);
      showMessage(loginErrorMessage(error), true);
      setBusy(false);
    }
  });

  async function sendPasswordReset() {
    const email = emailInput.value.trim().toLowerCase();
    emailInput.value = email;
    if (!email || !emailInput.checkValidity()) {
      showMessage("Informe um e-mail válido para redefinir a senha.", true);
      emailInput.focus();
      return;
    }

    forgotPasswordButton.disabled = true;
    showMessage("Enviando instruções de redefinição...");
    try {
      await auth.sendPasswordResetEmail(email);
      showMessage("Se o e-mail estiver cadastrado, enviaremos as instruções de redefinição.");
    } catch (error) {
      console.error(error);
      const code = String(error?.code || "");
      if (code.includes("user-not-found")) {
        showMessage("Se o e-mail estiver cadastrado, enviaremos as instruções de redefinição.");
      } else if (code.includes("too-many-requests")) {
        showMessage("Muitas tentativas. Aguarde alguns minutos e tente novamente.", true);
      } else if (code.includes("network-request-failed")) {
        showMessage("Não foi possível conectar ao Firebase.", true);
      } else {
        showMessage("Não foi possível enviar a redefinição agora.", true);
      }
    } finally {
      forgotPasswordButton.disabled = false;
    }
  }

  async function establishServerSession(user) {
    if (exchangingSession) return;
    exchangingSession = true;
    setBusy(true);
    showMessage("Abrindo o sistema...");

    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch("/auth/session", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        await auth.signOut().catch(() => {});
        throw new Error(payload.error || "Este usuário não está autorizado.");
      }
      window.location.replace(next);
    } catch (error) {
      console.error(error);
      exchangingSession = false;
      showMessage(error.message || "Não foi possível abrir o sistema.", true);
      setBusy(false);
    }
  }

  function setBusy(busy) {
    submitButton.disabled = busy;
    emailInput.disabled = busy;
    passwordInput.disabled = busy;
    rememberInput.disabled = busy;
    togglePasswordButton.disabled = busy;
    forgotPasswordButton.disabled = busy;
    submitLabel.textContent = busy ? "Entrando..." : "Entrar";
  }

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
  }

  function loginErrorMessage(error) {
    const code = String(error?.code || "");
    if (
      code.includes("wrong-password")
      || code.includes("invalid-credential")
      || code.includes("user-not-found")
    ) {
      return "E-mail ou senha incorretos.";
    }
    if (code.includes("invalid-email")) {
      return "Informe um e-mail válido.";
    }
    if (code.includes("too-many-requests")) {
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    }
    if (code.includes("network-request-failed")) {
      return "Não foi possível conectar ao Firebase.";
    }
    return "Não foi possível entrar. Confira os dados e tente novamente.";
  }

  function togglePasswordVisibility() {
    const reveal = passwordInput.type === "password";
    passwordInput.type = reveal ? "text" : "password";
    togglePasswordButton.setAttribute("aria-pressed", String(reveal));
    togglePasswordButton.setAttribute("aria-label", reveal ? "Ocultar senha" : "Mostrar senha");
    togglePasswordButton.title = reveal ? "Ocultar senha" : "Mostrar senha";
    showPasswordIcon.hidden = reveal;
    hidePasswordIcon.hidden = !reveal;
    passwordInput.focus();
  }

  function restoreRememberPreference() {
    try {
      rememberInput.checked = window.localStorage.getItem(rememberPreferenceKey) !== "session";
    } catch {
      rememberInput.checked = true;
    }
  }

  function saveRememberPreference() {
    try {
      window.localStorage.setItem(
        rememberPreferenceKey,
        rememberInput.checked ? "local" : "session",
      );
    } catch {
      // The selected Firebase persistence still applies when localStorage is unavailable.
    }
  }

  function safeNext(value) {
    const candidate = String(value || "/").trim();
    if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/";
    if (candidate.startsWith("/auth/") || candidate.startsWith("/login")) return "/";
    return candidate.slice(0, 1200);
  }
})();

