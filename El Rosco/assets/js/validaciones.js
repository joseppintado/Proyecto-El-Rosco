const Validador = {
    // Validar formato de contraseña (ej: 1 mayúscula, 1 número, 1 especial)
    esPasswordSegura: function (password) {
        const regex = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
        return regex.test(password);
    },

    // Validar campos vacíos
    estaVacio: function (valor) {
        return valor.trim() === "";
    },

    // Validar formato de email
    esEmailValido: function (email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
};