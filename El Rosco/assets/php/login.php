<?php
require_once __DIR__ . '/Usuario.php';
require_once __DIR__ . '/sesion.php';
abrirSesion();

header('Content-Type: application/json; charset=utf-8');

if($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = trim($_POST['nombreUsuario'] ?? '');
    $contrasena = $_POST['contrasena'] ?? '';

    if ($nombre === '' || $contrasena === '') {
        echo json_encode(['exito' => false, 'mensaje' => 'Debe ingresar usuario y contraseña']);
        exit;
    }

    $usuario = Usuario::iniciarSesion($nombre, $contrasena);

    if($usuario){
        // escapamos el nombre porque se muestra en el HTML
        $nombreSeguro = htmlspecialchars($usuario->getNombreUsuario(), ENT_QUOTES, 'UTF-8');

        if (!isset($_SESSION['usuario_j1'])) {
            $_SESSION['usuario_j1'] = $usuario;
            // desde acá cuenta el tiempo máximo de la sesión
            $_SESSION['inicio_sesion'] = time();
            echo json_encode([
                'exito' => true,
                'jugador' => 1,
                'nombre' => $nombreSeguro,
                'completo' => false
            ]);
        } else if (!isset($_SESSION['usuario_j2'])) {
            // Validamos que el Jugador 2 no sea el mismo que el Jugador 1
            if ($_SESSION['usuario_j1']->getId() === $usuario->getId()) {
                echo json_encode([
                    'exito' => false,
                    'mensaje' => 'El Jugador 2 no puede ser el mismo usuario que el Jugador 1'
                ]);
            } else {
                $_SESSION['usuario_j2'] = $usuario;
                echo json_encode([
                    'exito' => true,
                    'jugador' => 2,
                    'nombre' => $nombreSeguro,
                    'completo' => true
                ]);
            }
        } else {
            echo json_encode([
                'exito' => false,
                'mensaje' => 'Ya se encuentran dos jugadores logueados'
            ]);
        }
    }else{
        echo json_encode([
            'exito' => false,
            'mensaje' => 'Nombre de usuario o contraseña incorrectos'
        ]);
    }
}
?>
