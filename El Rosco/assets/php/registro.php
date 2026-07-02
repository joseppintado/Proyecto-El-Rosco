<?php
require_once 'Usuario.php';
header('Content-Type: application/json; charset=utf-8');

if($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = $_POST['nombreUsuario'];
    $contrasena = $_POST['contrasena'];
    $correo = $_POST['correo'];
    $fechaNacimiento = $_POST['fechaNacimiento'];

    if(!empty($nombre) && !empty($contrasena) && !empty($correo) && !empty($fechaNacimiento)){
        if(Usuario::registrarUsuario($nombre, $contrasena, $correo, $fechaNacimiento)){
            echo json_encode(['exito' => true, 'mensaje' => 'Usuario registrado correctamente']);
        }else{
            echo json_encode(['exito' => false, 'mensaje' => 'Error nombre de usuario ya existe']);
        }
    }else{
        echo json_encode(['exito' => false, 'mensaje' => 'Todos los campos son obligatorios']);
    }

}