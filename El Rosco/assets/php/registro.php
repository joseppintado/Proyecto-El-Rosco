<?php
require_once 'Usuario.php';
header('Content-Type: application/json; charset=utf-8');

if($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = $_POST['nombreUsuario'];
    $contrasena = $_POST['contrasena'];
    $correo = $_POST['correo'];
    $fechaNacimiento = $_POST['fechaNacimiento'];

    if(!empty($nombre) && !empty($contrasena) && !empty($correo) && !empty($fechaNacimiento)){
        // Validar formato de correo electrónico
        if (!preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $correo)) {
            echo json_encode(['exito' => false, 'mensaje' => 'El formato del correo electrónico no es válido']);
            exit;
        }

        // Validar que la contraseña sea segura (mínimo 8 caracteres, 1 número, 1 mayúscula, 1 carácter especial)
        if (!preg_match('/^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/', $contrasena)) {
            echo json_encode(['exito' => false, 'mensaje' => 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial (!@#$%^&*)']);
            exit;
        }

        if(Usuario::registrarUsuario($nombre, $contrasena, $correo, $fechaNacimiento)){
            echo json_encode(['exito' => true, 'mensaje' => 'Usuario registrado correctamente']);
        }else{
            echo json_encode(['exito' => false, 'mensaje' => 'Error nombre de usuario ya existe']);
        }
    }else{
        echo json_encode(['exito' => false, 'mensaje' => 'Todos los campos son obligatorios']);
    }

}