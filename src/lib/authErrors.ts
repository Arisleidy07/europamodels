export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  const messages: Record<string, string> = {
    "auth/invalid-email": "El correo electrónico no tiene un formato válido.",
    "auth/missing-email": "Escribe tu correo electrónico.",
    "auth/missing-password": "Escribe tu contraseña.",
    "auth/invalid-credential": "El correo o la contraseña son incorrectos.",
    "auth/user-not-found": "No existe una cuenta con este correo electrónico.",
    "auth/wrong-password": "La contraseña es incorrecta.",
    "auth/user-disabled": "Esta cuenta está desactivada. Contacta al administrador.",
    "auth/too-many-requests":
      "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.",
    "auth/network-request-failed":
      "No se pudo conectar. Revisa tu conexión a internet e inténtalo de nuevo.",
    "auth/operation-not-allowed":
      "El inicio de sesión con correo y contraseña no está habilitado.",
    "auth/internal-error":
      "Ocurrió un problema al iniciar sesión. Inténtalo de nuevo.",
    "auth/weak-password": "La contraseña no cumple los requisitos de seguridad.",
    "auth/requires-recent-login":
      "Por seguridad, cierra sesión y vuelve a iniciarla antes de continuar.",
    "auth/expired-action-code": "El enlace de acceso venció. Solicita uno nuevo.",
    "auth/invalid-action-code": "El enlace de acceso no es válido.",
    "auth/popup-closed-by-user": "Se cerró la ventana antes de completar el acceso.",
    "auth/popup-blocked":
      "El navegador bloqueó la ventana de acceso. Permite ventanas emergentes.",
    "auth/cancelled-popup-request": "Se canceló el intento de acceso anterior.",
    "auth/account-exists-with-different-credential":
      "Ya existe una cuenta con este correo usando otro método de acceso.",
  };

  if (messages[code]) return messages[code];

  if (error instanceof Error && !error.message.includes("Firebase")) {
    return error.message;
  }

  return "No se pudo completar el acceso. Revisa los datos e inténtalo de nuevo.";
}

export function validateEmail(email: string): string | undefined {
  const value = email.trim();

  if (!value) return "Escribe tu correo electrónico.";
  if (/\s/.test(value)) return "El correo no puede contener espacios.";
  if (!value.includes("@")) return "Al correo le falta el símbolo @.";

  const parts = value.split("@");
  if (parts.length !== 2) return "El correo debe contener un solo símbolo @.";

  const [local, domain] = parts;
  if (!local) return "Escribe la parte del correo que va antes de @.";
  if (!domain) return "Escribe el dominio que va después de @.";
  if (!domain.includes(".")) {
    return "El dominio está incompleto. Incluye una terminación como .com.";
  }
  if (domain.startsWith(".") || domain.endsWith(".")) {
    return "El dominio del correo no tiene un formato válido.";
  }
  if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value)) {
    return "El correo electrónico no tiene un formato válido.";
  }

  const extension = domain.split(".").pop() || "";
  if (extension.length < 2) {
    return "La terminación del dominio está incompleta, por ejemplo .com.";
  }

  return undefined;
}
