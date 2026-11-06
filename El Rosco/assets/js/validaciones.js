const Validador = {
    // Validamos el formato de la contraseña (ej: 1 mayúscula, 1 número, 1 carácter especial y tener al menos 8 caracteres)
    esContrasenaSegura: function (contrasena) {
        const regex = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
        return regex.test(contrasena);
    },

    // Validamos el nombre de usuario: 3 a 20 caracteres, solo letras, números o guion bajo
    esNombreUsuarioValido: function (nombre) {
        const regex = /^[A-Za-z0-9_]{3,20}$/;
        return regex.test(nombre);
    },

    // Validamos si los campos están vacíos
    estaVacio: function (valor) {
        return valor.trim() === "";
    },

    // Validamos el formato del correo
    esCorreoValido: function (correo) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(correo);
    }
};