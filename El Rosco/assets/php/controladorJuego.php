<?php
require_once __DIR__ . '/Usuario.php';
require_once __DIR__ . '/Juego.php';
require_once __DIR__ . '/sesion.php';
abrirSesion();

header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('America/Argentina/Buenos_Aires');

// Función auxiliar para responder con un error y terminar el script
function responderError($mensaje) {
    echo json_encode(['exito' => false, 'mensaje' => $mensaje]);
    exit;
}

// Función auxiliar para escapar los textos que se muestran en el HTML
function escapar($texto) {
    return htmlspecialchars($texto, ENT_QUOTES, 'UTF-8');
}

// acotamos los tiempos que manda el cliente: no pueden superar lo transcurrido ni la duración de la partida
function leerTiempos($partida) {
    $maximo = time() - $partida['inicio'];
    if ($partida['duracion'] > 0) {
        $maximo = min($maximo, $partida['duracion']);
    }
    $tiempos = [];
    foreach ([1, 2] as $numero) {
        $valor = (int)($_POST['tiempo_j' . $numero] ?? 0);
        $tiempos[$numero] = max(0, min($valor, $maximo));
    }
    return $tiempos;
}

//verificamos que el metodo sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderError('Método no permitido');
}

$accion = $_POST['accion'] ?? '';

// verificarSesion es la única acción permitida sin los dos jugadores logueados
if ($accion === 'verificarSesion') {
    $j1 = isset($_SESSION['usuario_j1']) ? escapar($_SESSION['usuario_j1']->getNombreUsuario()) : null;
    $j2 = isset($_SESSION['usuario_j2']) ? escapar($_SESSION['usuario_j2']->getNombreUsuario()) : null;
    echo json_encode([
        'exito' => ($j1 !== null && $j2 !== null),
        'usuario_j1' => $j1,
        'usuario_j2' => $j2
    ]);
    exit;
}

//verificamos la sesion de ambos jugadores para realizar acciones del juego
if (!isset($_SESSION['usuario_j1']) || !isset($_SESSION['usuario_j2'])) {
    responderError('Sesión no iniciada o expirada. Vuelva a iniciar sesión.');
}

$usuarios = [1 => $_SESSION['usuario_j1'], 2 => $_SESSION['usuario_j2']];

switch ($accion) {
    case 'iniciarPartida':
        // Validamos que las características sean valores permitidos
        $nivel = $_POST['nivel'] ?? '';
        $duracion = (int)($_POST['duracion'] ?? -1);
        $ayuda = $_POST['ayuda'] ?? '';

        if (!in_array($nivel, Juego::NIVELES, true)
            || !in_array($duracion, Juego::DURACIONES, true)
            || !in_array($ayuda, ['si', 'no'], true)) {
            responderError('Las características de la partida no son válidas.');
        }

        // primero obtenemos las palabras para no crear una partida vacía
        $palabras = Juego::obtenerPalabrasParaPartida($nivel);
        if ($palabras === null) {
            responderError('No hay suficientes palabras cargadas para ese nivel.');
        }

        // Seleccionar aleatoriamente el turno que inicia (1 o 2)
        $jugadorInicial = rand(1, 2);

        $idPartida = Juego::crearPartida(date('Y-m-d H:i:s'), $nivel, $duracion, ($ayuda === 'si') ? 1 : 0,
                                         $jugadorInicial, $usuarios[1]->getId(), $usuarios[2]->getId(), $palabras);
        if (!$idPartida) {
            responderError('No se pudo crear la partida.');
        }

        // guardamos la partida en la sesión, las respuestas nunca salen del servidor
        $_SESSION['partida_actual'] = [
            'id_juego' => $idPartida,
            'jugador_inicial' => $jugadorInicial,
            'duracion' => $duracion,
            'inicio' => time(),
            'palabras' => $palabras,
            'contestadas' => [1 => [], 2 => []],
            // número de cada jugador en la partida de la base
            'numero_original' => [1 => 1, 2 => 2],
            'finalizada' => false
        ];

        echo json_encode([
            'exito' => true,
            'idPartida' => $idPartida,
            'jugadorInicial' => $jugadorInicial,
            'nombreJ1' => escapar($usuarios[1]->getNombreUsuario()),
            'nombreJ2' => escapar($usuarios[2]->getNombreUsuario())
        ]);
        break;

    case 'verificar':
        $partida = $_SESSION['partida_actual'] ?? null;
        if (!$partida || $partida['finalizada']) {
            responderError('No hay una partida en curso.');
        }

        // el cliente solo manda jugador y letra, la palabra la buscamos en la sesión
        $jugador = (int)($_POST['jugador'] ?? 0);
        $indice = (int)($_POST['indice'] ?? -1);
        $respuesta = trim($_POST['respuesta_usuario'] ?? '');

        if (!in_array($jugador, [1, 2], true) || $indice < 0 || $indice >= Juego::LETRAS_POR_ROSCO) {
            responderError('Datos de la jugada no válidos.');
        }
        if (in_array($indice, $partida['contestadas'][$jugador], true)) {
            responderError('Esa letra ya fue arriesgada.');
        }
        if ($respuesta === '') {
            responderError('Escriba una respuesta antes de confirmar.');
        }
        if (mb_strlen($respuesta, 'UTF-8') > 100) {
            responderError('La respuesta es demasiado larga.');
        }

        $palabra = $partida['palabras'][$jugador][$indice];
        $resultado = Juego::verificarRespuesta($partida['id_juego'], $usuarios[$jugador]->getId(), $palabra['id_palabra'], $respuesta);

        if ($resultado === false) {
            responderError('No se pudo verificar la respuesta.');
        }

        // la letra queda inhabilitada
        $_SESSION['partida_actual']['contestadas'][$jugador][] = $indice;

        $resultado['palabra_correcta'] = escapar($resultado['palabra_correcta']);
        echo json_encode(['exito' => true, 'datos' => $resultado]);
        break;

    case 'finalizarPartida':
        $partida = $_SESSION['partida_actual'] ?? null;
        if (!$partida || $partida['finalizada']) {
            responderError('No hay una partida en curso.');
        }

        $motivo = $_POST['motivo'] ?? '';
        $abandona = (int)($_POST['abandona'] ?? 0);

        if (!in_array($motivo, Juego::MOTIVOS, true)) {
            responderError('Motivo de finalización no válido.');
        }
        if ($motivo === 'abandono' && !in_array($abandona, [1, 2], true)) {
            responderError('Debe indicarse qué jugador abandona.');
        }

        $tiempos = leerTiempos($partida);

        $idUsuarios = [1 => $usuarios[1]->getId(), 2 => $usuarios[2]->getId()];
        $resultado = Juego::finalizarPartida($partida['id_juego'], $motivo, $abandona, $idUsuarios, $tiempos, date('Y-m-d H:i:s'));

        if ($resultado === false) {
            responderError('No se pudo registrar el final de la partida.');
        }

        $_SESSION['partida_actual']['finalizada'] = true;

        echo json_encode(['exito' => true, 'motivo' => $motivo, 'datos' => $resultado]);
        break;

    case 'guardarPartida':
        $partida = $_SESSION['partida_actual'] ?? null;
        if (!$partida || $partida['finalizada']) {
            responderError('No hay una partida en curso para guardar.');
        }

        // turno y letra en la que está cada jugador
        $turno = (int)($_POST['turno'] ?? 0);
        $indices = [1 => (int)($_POST['indice_j1'] ?? -1), 2 => (int)($_POST['indice_j2'] ?? -1)];

        if (!in_array($turno, [1, 2], true)
            || $indices[1] < 0 || $indices[1] >= Juego::LETRAS_POR_ROSCO
            || $indices[2] < 0 || $indices[2] >= Juego::LETRAS_POR_ROSCO) {
            responderError('El estado de la partida no es válido.');
        }

        $tiempos = leerTiempos($partida);
        $idUsuarios = [1 => $usuarios[1]->getId(), 2 => $usuarios[2]->getId()];

        // guardamos el turno con la numeración de la partida original
        $turno = $partida['numero_original'][$turno];

        if (!Juego::guardarPartida($partida['id_juego'], $turno, $idUsuarios, $indices, $tiempos, date('Y-m-d H:i:s'))) {
            responderError('No se pudo guardar la partida.');
        }

        // sacamos la partida de la sesión
        unset($_SESSION['partida_actual']);

        echo json_encode([
            'exito' => true,
            'fechaLimite' => date('d/m/Y H:i', time() + Juego::DIAS_GUARDADO * 24 * 60 * 60)
        ]);
        break;

    case 'obtenerPartidasGuardadas':
        // primero cerramos las vencidas
        Juego::finalizarPartidasVencidas();
        $guardadas = Juego::obtenerPartidasGuardadasEntre($usuarios[1]->getId(), $usuarios[2]->getId());
        echo json_encode([
            'exito' => true,
            'nombreJ1' => escapar($usuarios[1]->getNombreUsuario()),
            'nombreJ2' => escapar($usuarios[2]->getNombreUsuario()),
            'partidas' => $guardadas
        ]);
        break;

    case 'continuarPartida':
        $idJuego = (int)($_POST['id_juego'] ?? 0);
        if ($idJuego <= 0) {
            responderError('Partida no válida.');
        }

        // si venció recién, se cierra y ya no se puede continuar
        Juego::finalizarPartidasVencidas();

        $estado = Juego::cargarPartidaGuardada($idJuego, $usuarios[1]->getId(), $usuarios[2]->getId());
        if ($estado === null) {
            responderError('La partida no está disponible para continuar (no existe, no es de estos jugadores o ya venció).');
        }

        // armamos la partida en la sesión igual que una nueva
        // corremos el inicio hacia atrás el tiempo ya jugado para seguir acotando los tiempos
        $tiempoYaJugado = $estado['jugadores'][1]['tiempo_usado'] + $estado['jugadores'][2]['tiempo_usado'];
        $_SESSION['partida_actual'] = [
            'id_juego' => $idJuego,
            'jugador_inicial' => $estado['jugador_inicial'],
            'duracion' => $estado['duracion'],
            'inicio' => time() - $tiempoYaJugado,
            'palabras' => $estado['palabras'],
            'contestadas' => $estado['contestadas'],
            'numero_original' => $estado['numero_original'],
            'finalizada' => false
        ];

        // no mandamos las palabras, el cliente las pide a obtener_palabras.php
        echo json_encode([
            'exito' => true,
            'idPartida' => $idJuego,
            'nivel' => $estado['nivel'],
            'duracion' => $estado['duracion'],
            'ayuda' => ($estado['ayuda'] === 1) ? 'si' : 'no',
            'jugadorInicial' => $estado['jugador_inicial'],
            'turno' => $estado['turno'],
            'jugadores' => $estado['jugadores'],
            'nombreJ1' => escapar($usuarios[1]->getNombreUsuario()),
            'nombreJ2' => escapar($usuarios[2]->getNombreUsuario())
        ]);
        break;

    case 'obtenerUltimasPartidas':
        // antes de listar cerramos las partidas vencidas
        Juego::finalizarPartidasVencidas();
        $resultado = Juego::obtenerUltimasPartidasEntre($usuarios[1]->getId(), $usuarios[2]->getId());
        echo json_encode([
            'exito' => true,
            'nombreJ1' => escapar($usuarios[1]->getNombreUsuario()),
            'nombreJ2' => escapar($usuarios[2]->getNombreUsuario()),
            'partidas' => $resultado
        ]);
        break;

    default:
        responderError('Acción no válida');
        break;
}
?>
