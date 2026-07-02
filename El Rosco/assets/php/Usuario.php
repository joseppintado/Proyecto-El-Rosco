<?php
require_once __DIR__ . '/Conexion.php';

class Usuario {
    private $id;
    private $nombreUsuario;

    public function __construct($id, $nombreUsuario){
        $this->id = $id;
        $this->nombreUsuario = $nombreUsuario;
    }

    public function getId(){
        return $this->id;
    }

    public function getNombreUsuario(){
        return $this->nombreUsuario;
    }

    //registro de usuarios
    public static function registrarUsuario($nombre, $contrasena, $correo, $fechaNacimiento){
       $conexion = conexion::crearConexion();
       
       //encriptar contraseña
       $contrasenaEncriptada = password_hash($contrasena, PASSWORD_DEFAULT);

       //insertar usuario
       $sql = "INSERT INTO usuarios (nombre_usuario, password_hash, email, fecha_nacimiento) VALUES (?,?,?,?)";
       $stmt = $conexion->prepare($sql);
       $stmt->bind_param("ssss", $nombre, $contrasenaEncriptada, $correo, $fechaNacimiento);

       $resultado = $stmt->execute();

       //cerrar conexion
       $stmt->close();
       $conexion->close();

       return $resultado;
    }

    //inicio de sesión
    public static function iniciarSesion($nombre, $contrasena){
       $conexion = conexion::crearConexion();
       
       //buscar usuario
       $sql = "SELECT * FROM usuarios WHERE nombre_usuario = ?";
       $stmt = $conexion->prepare($sql);
       $stmt->bind_param("s", $nombre);
       $stmt->execute();

       $resultado = $stmt->get_result();
       if ($usuario = $resultado->fetch_assoc()){
           //verificar contraseña
           if (password_verify($contrasena, $usuario['password_hash'])){
               return new Usuario($usuario['id_usuario'], $nombre);
           }
       }

       //cerrar conexion
       $conexion->close();
       return false;
    }
}
