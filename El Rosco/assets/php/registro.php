<?php
require_once 'Usuario.php';
header('Content-Type: application/json; charset=utf-8');

if($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = $_POST['nombreUsuario'];
    $password = $_POST['password'];
    $email = $_POST['email'];
    $fechaNacimiento = $_POST['fechaNacimiento'];

    if(!empty($nombre) && !empty($password) && !empty($email) && !empty($fechaNacimiento)){
        if(Usuario::registrarUsuario($nombre, $password, $email, $fechaNacimiento)){
            echo json_encode(['exito' => true, 'message' => 'Usuario registrado correctamente']);
        }else{
            echo json_encode(['exito' => false, 'message' => 'Error nombre de usuario ya existe']);
        }
    }else{
        echo json_encode(['exito' => false, 'message' => 'Todos los campos son obligatorios']);
    }

}