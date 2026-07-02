<?php
class Conexion {
    public static function crearConexion(){
        $servidor = "127.0.0.1";
        $usuario = "root";
        $password = "";
        $baseDeDatos = "el_roscodb";

        $conexion = new mysqli($servidor, $usuario, $password, $baseDeDatos);

        if ($conexion->connect_error){
            die("Error de conexión: " . $conexion->connect_error);
        }

        $conexion->set_charset("utf8mb4");
        
        return $conexion;
    }
}   
?>