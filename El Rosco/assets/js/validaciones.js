const Validador = {
    // Validar formato de contraseña (ej: 1 mayúscula, 1 número, 1 especial)
    esContrasenaSegura: function (contrasena) {
        const regex = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
        return regex.test(contrasena);
    },

    // Validar campos vacíos
    estaVacio: function (valor) {
        return valor.trim() === "";
    },

    // Validar formato de email
    esCorreoValido: function (correo) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(correo);
    }
};