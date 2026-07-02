<?php
require_once __DIR__ . '/Usuario.php';
session_start();
session_unset();
session_destroy();
echo json_encode(['exito' => true]);
?>