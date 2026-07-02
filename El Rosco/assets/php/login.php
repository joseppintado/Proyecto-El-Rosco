<?php
require_once 'Usuario.php';
session_start();

header('Content-Type: application/json; charset=utf-8');

if($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = $_POST['nombreUsuario'];
    $password = $_POST['password'];

    $usuario = Usuario::iniciarSesion($nombre, $password);

    if($usuario){
        if (!isset($_SESSION['usuario_j1'])) {
            $_SESSION['usuario_j1'] = $usuario;
            echo json_encode([
                'exito' => true,
                'jugador' => 1,
                'nombre' => $usuario->getNombreUsuario(),
                'completo' => false
            ]);
        } else if (!isset($_SESSION['usuario_j2'])) {
            // Validar que el Jugador 2 no sea el mismo que el Jugador 1
            if ($_SESSION['usuario_j1']->getNombreUsuario() === $usuario->getNombreUsuario()) {
                echo json_encode([
                    'exito' => false,
                    'message' => 'El Jugador 2 no puede ser el mismo usuario que el Jugador 1'
                ]);
            } else {
                $_SESSION['usuario_j2'] = $usuario;
                echo json_encode([
                    'exito' => true,
                    'jugador' => 2,
                    'nombre' => $usuario->getNombreUsuario(),
                    'completo' => true
                ]);
            }
        } else {
            echo json_encode([
                'exito' => false,
                'message' => 'Ya se encuentran dos jugadores logueados'
            ]);
        }
    }else{
        echo json_encode([
            'exito' => false,
            'message' => 'Nombre de usuario o contraseña incorrectos'
        ]);
    }
}
?>