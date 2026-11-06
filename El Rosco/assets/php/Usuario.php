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
       $conexion = Conexion::crearConexion();

       //encriptación de contraseña
       $contrasenaEncriptada = password_hash($contrasena, PASSWORD_DEFAULT);

       //insert de usuario (si el nombre ya existe execute devuelve false)
       $sql = "INSERT INTO usuarios (nombre_usuario, password_hash, email, fecha_nacimiento) VALUES (?,?,?,?)";
       $stmt = $conexion->prepare($sql);
       $stmt->bind_param("ssss", $nombre, $contrasenaEncriptada, $correo, $fechaNacimiento);

       $resultado = $stmt->execute();

       //cerramos conexion
       $stmt->close();
       $conexion->close();

       return $resultado;
    }

    //inicio de sesión
    public static function iniciarSesion($nombre, $contrasena){
       $conexion = Conexion::crearConexion();

       //búsqueda de usuario
       $sql = "SELECT id_usuario, nombre_usuario, password_hash FROM usuarios WHERE nombre_usuario = ?";
       $stmt = $conexion->prepare($sql);
       $stmt->bind_param("s", $nombre);
       $stmt->execute();

       $resultado = $stmt->get_result();
       $fila = $resultado->fetch_assoc();

       //liberamos el resultado y cerramos conexion
       $resultado->free();
       $stmt->close();
       $conexion->close();

       //verificación de contraseña
       if ($fila && password_verify($contrasena, $fila['password_hash'])){
           return new Usuario($fila['id_usuario'], $fila['nombre_usuario']);
       }

       return false;
    }
}
?>
