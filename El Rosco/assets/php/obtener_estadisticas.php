<?php
require_once __DIR__ . '/Conexion.php';
require_once __DIR__ . '/Juego.php';
date_default_timezone_set('America/Argentina/Buenos_Aires');

header('Content-Type: application/json; charset=utf-8');

// antes de calcular cerramos las partidas vencidas para que cuenten sus ganadores
Juego::finalizarPartidasVencidas();

$conexion = Conexion::crearConexion();

// Función auxiliar para ejecutar una consulta simple y obtener todas las filas
$obtenerResultadosConsulta = function($sql) use ($conexion) {
    $resultado = $conexion->query($sql);
    $filas = [];
    if ($resultado) {
        while ($fila = $resultado->fetch_assoc()) {
            // escapamos el nombre porque se muestra en el HTML
            $fila['nombre_usuario'] = htmlspecialchars($fila['nombre_usuario'], ENT_QUOTES, 'UTF-8');
            $filas[] = $fila;
        }
        $resultado->free();
    }
    return $filas;
};

// 1. Ganadores General
$ganadoresGeneral = $obtenerResultadosConsulta("
    SELECT u.nombre_usuario, COUNT(gj.id_juego) AS victorias
    FROM usuarios u
    JOIN ganadores_juego gj ON u.id_usuario = gj.id_usuario
    GROUP BY u.id_usuario, u.nombre_usuario
    ORDER BY victorias DESC, u.nombre_usuario ASC
    LIMIT 5
");

// Ganadores por dificultad
$obtenerGanadoresPorDificultad = function($nivel) use ($conexion) {
    $sql = "SELECT u.nombre_usuario, COUNT(gj.id_juego) AS victorias
            FROM usuarios u
            JOIN ganadores_juego gj ON u.id_usuario = gj.id_usuario
            JOIN juegos j ON gj.id_juego = j.id_juego
            WHERE j.nivel = ?
            GROUP BY u.id_usuario, u.nombre_usuario
            ORDER BY victorias DESC, u.nombre_usuario ASC
            LIMIT 3";
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("s", $nivel);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $lista = [];
    while ($fila = $resultado->fetch_assoc()) {
        $fila['nombre_usuario'] = htmlspecialchars($fila['nombre_usuario'], ENT_QUOTES, 'UTF-8');
        $lista[] = $fila;
    }
    $resultado->free();
    $stmt->close();
    return $lista;
};

$ganadoresBaja = $obtenerGanadoresPorDificultad('baja');
$ganadoresMedia = $obtenerGanadoresPorDificultad('media');
$ganadoresAlta = $obtenerGanadoresPorDificultad('alta');

// 2. Usuarios más rápidos
$masRapidos = $obtenerResultadosConsulta("
    SELECT u.nombre_usuario, MIN(gj.tiempo_usado) AS tiempo_minimo, j.nivel
    FROM usuarios u
    JOIN ganadores_juego gj ON u.id_usuario = gj.id_usuario
    JOIN juegos j ON gj.id_juego = j.id_juego
    WHERE gj.tiempo_usado IS NOT NULL AND gj.tiempo_usado > 0
    GROUP BY u.id_usuario, u.nombre_usuario, j.nivel
    ORDER BY tiempo_minimo ASC
    LIMIT 5
");

// 3. Ranking general de partidas
$rankingGeneral = $obtenerResultadosConsulta("
    SELECT u.nombre_usuario, COUNT(gj.id_juego) AS victorias, ROUND(AVG(gj.tiempo_usado), 1) AS tiempo_promedio
    FROM usuarios u
    LEFT JOIN ganadores_juego gj ON u.id_usuario = gj.id_usuario
    GROUP BY u.id_usuario, u.nombre_usuario
    ORDER BY victorias DESC, tiempo_promedio ASC, u.nombre_usuario ASC
");

$conexion->close();

echo json_encode([
    'exito' => true,
    'ganadoresGeneral' => $ganadoresGeneral,
    'ganadoresBaja' => $ganadoresBaja,
    'ganadoresMedia' => $ganadoresMedia,
    'ganadoresAlta' => $ganadoresAlta,
    'masRapidos' => $masRapidos,
    'rankingGeneral' => $rankingGeneral
]);
?>
