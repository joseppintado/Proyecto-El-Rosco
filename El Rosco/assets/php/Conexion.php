<?php
class Conexion {
    public static function crearConexion(){
        $servidor = "127.0.0.1";
        $usuario = "root";
        $password = "";
        $baseDeDatos = "el_roscodb";

        // desactivamos las excepciones de mysqli (PHP 8.1 en adelante) para que execute devuelva true/false
        // y así poder decidir si hacemos commit o rollback
        mysqli_report(MYSQLI_REPORT_OFF);

        $conexion = new mysqli($servidor, $usuario, $password, $baseDeDatos);

        if ($conexion->connect_error){
            // no mostramos el detalle del error para no dar información de la base
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['exito' => false, 'mensaje' => 'No se pudo conectar con la base de datos. Verifique que MySQL esté iniciado en XAMPP.']);
            exit;
        }

        $conexion->set_charset("utf8mb4");

        return $conexion;
    }
}
?>
