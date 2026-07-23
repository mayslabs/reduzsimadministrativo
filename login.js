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
  const message = document.getElementById("cloudLoginMessage");
  const next = safeNext(new URLSearchParams(window.location.search).get("next"));

  if (!window.firebase?.initializeApp) {
    showMessage("Não foi possível carregar o acesso seguro. Atualize a página.", true);
    submitButton.disabled = true;
    return;
  }

  const app = window.firebase.apps?.length
    ? window.firebase.app()
    : window.firebase.initializeApp(firebaseConfig);
  const auth = app.auth();
  let exchangingSession = false;

  auth.setPersistence(window.firebase.auth.Auth.Persistence.SESSION).catch((error) => {
    console.error(error);
    showMessage("O navegador não permitiu criar uma sessão segura.", true);
  });

  auth.onAuthStateChanged((user) => {
    if (user && !exchangingSession) establishServerSession(user);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setBusy(true);
    showMessage("Verificando acesso...");

    try {
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
    if (code.includes("too-many-requests")) {
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    }
    if (code.includes("network-request-failed")) {
      return "Não foi possível conectar ao Firebase.";
    }
    return "Não foi possível entrar. Confira os dados e tente novamente.";
  }

  function safeNext(value) {
    const candidate = String(value || "/").trim();
    if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/";
    if (candidate.startsWith("/auth/") || candidate.startsWith("/login")) return "/";
    return candidate.slice(0, 1200);
  }
})();

