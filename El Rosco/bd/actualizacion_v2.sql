-- actualización v2 de la base (correcciones)
-- se ejecuta una sola vez sobre una base creada con la versión anterior
-- en una instalación nueva no hace falta, el_roscodb.sql ya incluye estos cambios
USE el_roscodb;

-- agregamos los datos importantes de la partida
ALTER TABLE juegos
    ADD COLUMN duracion_segundos INT UNSIGNED NOT NULL DEFAULT 0 AFTER nivel,
    ADD COLUMN ayuda TINYINT(1) NOT NULL DEFAULT 1 AFTER duracion_segundos,
    ADD COLUMN fecha_fin DATETIME NULL AFTER ayuda,
    ADD COLUMN motivo_fin ENUM('completo', 'tiempo', 'abandono') NULL AFTER fecha_fin;

-- agregamos el resultado de cada jugador
ALTER TABLE usuarios_juego
    ADD COLUMN numero_jugador TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER id_usuario,
    ADD COLUMN aciertos INT UNSIGNED NOT NULL DEFAULT 0 AFTER numero_jugador,
    ADD COLUMN errores INT UNSIGNED NOT NULL DEFAULT 0 AFTER aciertos,
    ADD COLUMN tiempo_usado INT UNSIGNED NOT NULL DEFAULT 0 AFTER errores;

-- borramos los resultados de partidas que no existen para poder crear la clave foránea
DELETE FROM resultados_partida
WHERE id_partida NOT IN (SELECT id_juego FROM juegos);

ALTER TABLE resultados_partida
    ADD CONSTRAINT fk_resultados_juego
    FOREIGN KEY (id_partida) REFERENCES juegos(id_juego) ON DELETE CASCADE;
