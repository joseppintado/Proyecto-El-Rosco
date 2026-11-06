<?php
require_once __DIR__ . '/sesion.php';
abrirSesion();

header('Content-Type: application/json; charset=utf-8');

// las palabras ya las eligió el servidor y están en la sesión
$partida = $_SESSION['partida_actual'] ?? null;

if (!isset($_SESSION['usuario_j1']) || !isset($_SESSION['usuario_j2']) || !$partida || $partida['finalizada']) {
    echo json_encode(['exito' => false, 'mensaje' => 'No hay una partida en curso.']);
    exit;
}

// mandamos solo la definición y la cantidad de letras, nunca el término
$lista = [];
foreach ([1, 2] as $jugador) {
    foreach ($partida['palabras'][$jugador] as $indice => $palabra) {
        $lista[] = [
            'indice' => $indice,
            'definicion' => htmlspecialchars($palabra['definicion'], ENT_QUOTES, 'UTF-8'),
            'cantidad_letras' => (int)$palabra['cantidad_letras']
        ];
    }
}

echo json_encode(['exito' => true, 'palabras' => $lista]);
?>
