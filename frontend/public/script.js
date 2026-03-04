const card = document.getElementById("card");
const goRegister = document.getElementById("goRegister");
const goLogin = document.getElementById("goLogin");
const roleSelect = document.getElementById("roleSelect");
const adminCodeInput = document.getElementById("adminCode");

goRegister.addEventListener("click", () => card.classList.add("active"));
goLogin.addEventListener("click", () => card.classList.remove("active"));

roleSelect.addEventListener("change", () => {
  adminCodeInput.style.display = roleSelect.value === "admin" ? "block" : "none";
});

const API_URL = 'http://localhost:3000/api';
function showNotification(message, isError = false) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = 'notification show';
  notification.classList.toggle('error', isError);

  setTimeout(() => {
    notification.className = 'notification';
  }, 3000);
}
async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const rol = roleSelect.value;
  const adminCode = adminCodeInput.value;

  if (rol === "admin" && adminCode !== "codigoadmin123") {
    return showNotification("Código de administrador incorrecto.", true);
  }

  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: username, email, password, rol: rol === 'admin' ? 'Admin' : 'User' }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Error al registrarse.");

    showNotification("¡Registro exitoso! Redirigiendo al login...");
    setTimeout(() => {
      document.getElementById("registerForm").reset();
      adminCodeInput.style.display = "none";
      goLogin.click(); 
    }, 2000);
  } catch (error) {
    showNotification(error.message, true);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  console.log("Iniciando handleLogin..."); // 1. ¿Se ejecuta la función?
  const email = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    console.log("Respuesta del servidor (response):", response); // 2. ¿Cómo es la respuesta?

    const result = await response.json();
    console.log("Datos JSON de la respuesta (result):", result); // 3. ¿Qué datos contiene?

    if (!response.ok) {
      throw new Error(result.message || "Error al iniciar sesión.");
    }

    sessionStorage.setItem('loggedInUser', JSON.stringify(result.data));
    console.log("Datos guardados en sessionStorage:", result.data); // 4. ¿Qué se guarda?

    // Comprobamos que 'data' y 'data.rol' existan antes de usarlos
    if (result.data && result.data.rol) {
      console.log("Rol del usuario:", result.data.rol); // 5. ¿Cuál es el rol?
      if (result.data.rol.toLowerCase() === "admin") {
        console.log("Redirigiendo a dashboard_admin.html...");
        window.location.href = "/dashboard_admin.html";
      } else {
        console.log("Redirigiendo a dashboard_user.html...");
        window.location.href = "/dashboard_user.html";
      }
    } else {
      // Si no hay rol, no podemos redirigir.
      console.error("La respuesta del servidor no contiene 'data' o 'data.rol'.");
      showNotification("Respuesta inesperada del servidor.", true);
    }
  } catch (error) {
    console.error("Error capturado en handleLogin:", error); // 6. ¿Hubo algún error?
    showNotification(error.message, true);
  }
}
document.getElementById("registerForm").addEventListener("submit", handleRegister);
document.getElementById("loginForm").addEventListener("submit", handleLogin);
