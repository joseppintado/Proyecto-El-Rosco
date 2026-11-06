-- actualización v3 de la base (guardado de partidas)
-- se ejecuta una sola vez, después de actualizacion_v2.sql
-- en una instalación nueva no hace falta, el_roscodb.sql ya incluye estos cambios
USE el_roscodb;

-- agregamos jugador inicial, estado, turno y fecha de guardado
-- y el motivo 'vencida' para las partidas guardadas hace más de 10 días
ALTER TABLE juegos
    ADD COLUMN jugador_inicial TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER ayuda,
    ADD COLUMN estado ENUM('en_curso', 'guardada', 'finalizada') NOT NULL DEFAULT 'en_curso' AFTER jugador_inicial,
    ADD COLUMN turno_actual TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER estado,
    ADD COLUMN fecha_guardado DATETIME NULL AFTER turno_actual,
    MODIFY COLUMN motivo_fin ENUM('completo', 'tiempo', 'abandono', 'vencida') NULL;

-- las partidas que ya tienen fecha de fin quedan finalizadas
UPDATE juegos SET estado = 'finalizada' WHERE fecha_fin IS NOT NULL;

-- letra (0 a 26) en la que quedó cada jugador al guardar
ALTER TABLE usuarios_juego
    ADD COLUMN indice_actual TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER tiempo_usado;

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
