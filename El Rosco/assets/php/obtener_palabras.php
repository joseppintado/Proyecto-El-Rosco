<?php
require_once 'Juego.php';
header('Content-Type: application/json; charset=utf-8');

$nivel = $_GET['nivel'] ?? 'media';
$palabras = Juego::obtenerPalabrasParaPartida($nivel, 54);

echo json_encode($palabras);
?>
