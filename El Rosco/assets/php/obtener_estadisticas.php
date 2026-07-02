<?php
require_once __DIR__ . '/conexion.php';

header('Content-Type: application/json; charset=utf-8');

$conexion = conexion::crearConexion();

// Helper to execute simple query and fetch all rows
$getQueryResults = function($sql) use ($conexion) {
    $result = $conexion->query($sql);
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
    }
    return $rows;
};

// 1. Ganadores General
$winnersGeneral = $getQueryResults("
    SELECT u.nombre_usuario, COUNT(gj.id_juego) AS victorias
    FROM usuarios u
    JOIN ganadores_juego gj ON u.id_usuario = gj.id_usuario
    GROUP BY u.id_usuario, u.nombre_usuario
    ORDER BY victorias DESC, u.nombre_usuario ASC
    LIMIT 5
");

// Ganadores por dificultad
$getWinnersByDiff = function($nivel) use ($conexion) {
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
    $res = $stmt->get_result();
    $list = [];
    while ($row = $res->fetch_assoc()) {
        $list[] = $row;
    }
    $stmt->close();
    return $list;
};

$winnersBaja = $getWinnersByDiff('baja');
$winnersMedia = $getWinnersByDiff('media');
$winnersAlta = $getWinnersByDiff('alta');

// 2. Usuarios más rápidos
$fastest = $getQueryResults("
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
$rankingGeneral = $getQueryResults("
    SELECT u.nombre_usuario, COUNT(gj.id_juego) AS victorias, ROUND(AVG(gj.tiempo_usado), 1) AS tiempo_promedio
    FROM usuarios u
    LEFT JOIN ganadores_juego gj ON u.id_usuario = gj.id_usuario
    GROUP BY u.id_usuario, u.nombre_usuario
    ORDER BY victorias DESC, tiempo_promedio ASC, u.nombre_usuario ASC
");

$conexion->close();

echo json_encode([
    'exito' => true,
    'winnersGeneral' => $winnersGeneral,
    'winnersBaja' => $winnersBaja,
    'winnersMedia' => $winnersMedia,
    'winnersAlta' => $winnersAlta,
    'fastest' => $fastest,
    'rankingGeneral' => $rankingGeneral
]);
?>
