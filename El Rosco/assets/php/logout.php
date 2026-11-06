<?php
require_once __DIR__ . '/sesion.php';
abrirSesion();
cerrarSesion();

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['exito' => true]);
?>
