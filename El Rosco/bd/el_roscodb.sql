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

-- tabla de partidas
CREATE TABLE juegos (
    id_juego INT UNSIGNED NOT NULL AUTO_INCREMENT,
    fecha_inicio DATETIME NOT NULL,
    tamano_tablero INT NOT NULL,
    PRIMARY KEY (id_juego)
) ENGINE=InnoDB;

-- tabla para vincular jugadores a una partida
CREATE TABLE usuarios_juego (
    id_juego INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_juego, id_usuario),
    FOREIGN KEY (id_juego) REFERENCES juegos(id_juego) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- tabla de Ganadores
CREATE TABLE ganadores_juego (
    id_juego INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_juego, id_usuario),
    FOREIGN KEY (id_juego) REFERENCES juegos(id_juego) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- tabla intermedia de resultados de partida
CREATE TABLE resultados_partida (
    id_resultado INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_partida INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    id_palabra INT UNSIGNED NOT NULL,
    respuesta_usuario VARCHAR(255) NOT NULL,
    es_correcta TINYINT(1) NOT NULL,
    PRIMARY KEY (id_resultado),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_palabra) REFERENCES palabras(id_palabra) ON DELETE CASCADE
) ENGINE=InnoDB;