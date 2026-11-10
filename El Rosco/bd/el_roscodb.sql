-- usamos utf8mb4 para que las tildes y la ñ se guarden bien sin importar la configuración del cliente
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS el_roscodb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE el_roscodb;

-- tabla de Usuarios
CREATE TABLE usuarios (
    id_usuario INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    PRIMARY KEY (id_usuario)
) ENGINE=InnoDB;

-- tabla de palabras
CREATE TABLE palabras (
    id_palabra INT UNSIGNED NOT NULL AUTO_INCREMENT,
    termino VARCHAR(100) NOT NULL,
    definicion TEXT NOT NULL,
    nivel ENUM('baja', 'media', 'alta') NOT NULL,
    cantidad_letras INT NOT NULL,
    PRIMARY KEY (id_palabra)
) ENGINE=InnoDB;

-- tabla de partidas (con las características elegidas y cómo terminó)
CREATE TABLE juegos (
    id_juego INT UNSIGNED NOT NULL AUTO_INCREMENT,
    fecha_inicio DATETIME NOT NULL,
    tamano_tablero INT NOT NULL,
    nivel ENUM('baja', 'media', 'alta') NOT NULL DEFAULT 'media',
    duracion_segundos INT UNSIGNED NOT NULL DEFAULT 0,
    ayuda TINYINT(1) NOT NULL DEFAULT 1,
    jugador_inicial TINYINT UNSIGNED NOT NULL DEFAULT 1,
    estado ENUM('en_curso', 'guardada', 'finalizada') NOT NULL DEFAULT 'en_curso',
    turno_actual TINYINT UNSIGNED NOT NULL DEFAULT 1,
    fecha_guardado DATETIME NULL,
    fecha_fin DATETIME NULL,
    motivo_fin ENUM('completo', 'tiempo', 'abandono', 'vencida') NULL,
    PRIMARY KEY (id_juego)
) ENGINE=InnoDB;

-- tabla para vincular jugadores a una partida, con el resultado de cada uno
CREATE TABLE usuarios_juego (
    id_juego INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    numero_jugador TINYINT UNSIGNED NOT NULL DEFAULT 1,
    aciertos INT UNSIGNED NOT NULL DEFAULT 0,
    errores INT UNSIGNED NOT NULL DEFAULT 0,
    tiempo_usado INT UNSIGNED NOT NULL DEFAULT 0,
    indice_actual TINYINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id_juego, id_usuario),
    FOREIGN KEY (id_juego) REFERENCES juegos(id_juego) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- tabla de palabras asignadas a cada partida (la UNIQUE evita palabras repetidas)
CREATE TABLE palabras_partida (
    id_juego INT UNSIGNED NOT NULL,
    numero_jugador TINYINT UNSIGNED NOT NULL,
    posicion TINYINT UNSIGNED NOT NULL,
    id_palabra INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_juego, numero_jugador, posicion),
    UNIQUE KEY uk_palabra_en_partida (id_juego, id_palabra),
    FOREIGN KEY (id_juego) REFERENCES juegos(id_juego) ON DELETE CASCADE,
    FOREIGN KEY (id_palabra) REFERENCES palabras(id_palabra) ON DELETE CASCADE
) ENGINE=InnoDB;

-- tabla de ganadores
CREATE TABLE ganadores_juego (
    id_juego INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    tiempo_usado INT UNSIGNED NULL,
    PRIMARY KEY (id_juego, id_usuario),
    FOREIGN KEY (id_juego) REFERENCES juegos(id_juego) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- tabla de resultados de partida (cada palabra arriesgada)
CREATE TABLE resultados_partida (
    id_resultado INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_partida INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    id_palabra INT UNSIGNED NOT NULL,
    respuesta_usuario VARCHAR(255) NOT NULL,
    es_correcta TINYINT(1) NOT NULL,
    PRIMARY KEY (id_resultado),
    FOREIGN KEY (id_partida) REFERENCES juegos(id_juego) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_palabra) REFERENCES palabras(id_palabra) ON DELETE CASCADE
) ENGINE=InnoDB;
