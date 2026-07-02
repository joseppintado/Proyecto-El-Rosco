<?php
require_once "Usuario.php";
require_once "Juego.php";
session_start();

header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('America/Argentina/Buenos_Aires');

//verificamos la sesion de al menos un usuario para realizar acciones del juego
if(!isset($_SESSION['usuario_j1']) && !isset($_SESSION['usuario_j2']) && (!isset($_POST['accion']) || $_POST['accion'] !== 'verificarSesion')){
    echo json_encode(['exito' => false, 'message' => 'Acceso no autorizado']);
    exit;
}

//verificamos que el metodo sea POST
if($_SERVER['REQUEST_METHOD'] == 'POST'){
    $accion = $_POST['accion'] ?? '';

    switch ($accion){
        case 'verificar':
        $idJuego = $_POST['id_juego'];
        $idPalabra = $_POST['id_palabra'];
        $respuestaUsuario = $_POST['respuesta_usuario'];
        $turnoActivo = (int)($_POST['turno_activo'] ?? 1);

        $idUsuario = ($turnoActivo === 2) ? $_SESSION['usuario_j2']->getId() : $_SESSION['usuario_j1']->getId();

        $resultado = Juego::verificarRespuesta($idJuego, $idUsuario, $idPalabra, $respuestaUsuario);

        echo json_encode([
            'exito' => true, 
            'datos' => $resultado
        ]);
        break;

        case 'registrarGanador':
        $idJuego = $_POST['id_juego'] ?? null;
        $idGanadorJugador = (int)($_POST['id_ganador_jugador'] ?? 1);
        $idGanador = ($idGanadorJugador === 2) ? $_SESSION['usuario_j2']->getId() : $_SESSION['usuario_j1']->getId();
        $tiempoUsado = isset($_POST['tiempo_usado']) ? (int)$_POST['tiempo_usado'] : null;
        
        if ($idJuego) {
            $resultado = Juego::registrarGanador($idJuego, $idGanador, $tiempoUsado);
            echo json_encode(['exito' => true, 'datos' => $resultado]);
        } else {
            echo json_encode(['exito' => false, 'message' => 'Falta id_juego']);
        }
        break;

        case 'iniciarPartida':
        if (!isset($_SESSION['usuario_j1']) || !isset($_SESSION['usuario_j2'])) {
            echo json_encode(['exito' => false, 'message' => 'Ambos jugadores deben iniciar sesión para comenzar.']);
            break;
        }

        $fechaInicio = date('Y-m-d H:i:s');
        $tamaño = 27;
        $nivel = $_POST['nivel'] ?? 'media';
        
        $idJ1 = $_SESSION['usuario_j1']->getId();
        $idJ2 = $_SESSION['usuario_j2']->getId();
        $idPartida = Juego::crearPartida($fechaInicio, $tamaño, $nivel, $idJ1, $idJ2);
        
        // Seleccionar aleatoriamente el turno que inicia (1 o 2)
        $jugadorInicial = rand(1, 2);
        $_SESSION['partida_actual'] = [
            'id_juego' => $idPartida,
            'turno_actual' => $jugadorInicial,
            'id_usuario_j1' => $idJ1,
            'id_usuario_j2' => $idJ2
        ];

        echo json_encode([
            'exito' => true, 
            'idPartida' => $idPartida,
            'jugadorInicial' => $jugadorInicial,
            'nombreJ1' => $_SESSION['usuario_j1']->getNombreUsuario(),
            'nombreJ2' => $_SESSION['usuario_j2']->getNombreUsuario()
        ]);
        break;

        case 'verificarSesion':
        $j1 = isset($_SESSION['usuario_j1']) ? $_SESSION['usuario_j1']->getNombreUsuario() : null;
        $j2 = isset($_SESSION['usuario_j2']) ? $_SESSION['usuario_j2']->getNombreUsuario() : null;
        echo json_encode([
            'exito' => ($j1 !== null && $j2 !== null),
            'usuario_j1' => $j1,
            'usuario_j2' => $j2
        ]);
        break;

        case 'obtenerUltimasPartidas':
        $idJ1 = isset($_SESSION['usuario_j1']) ? $_SESSION['usuario_j1']->getId() : null;
        $idJ2 = isset($_SESSION['usuario_j2']) ? $_SESSION['usuario_j2']->getId() : null;
        
        if ($idJ1 && $idJ2) {
            $resultado = Juego::obtenerUltimasPartidasEntre($idJ1, $idJ2);
        } else {
            $resultado = [];
        }
        echo json_encode(['exito' => true, 'partidas' => $resultado]);
        break;

        default:
        echo json_encode(['exito' => false, 'message' => 'Accion no valida']);
        break;
    } 
}
?>