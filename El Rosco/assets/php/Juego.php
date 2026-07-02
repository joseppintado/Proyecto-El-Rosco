<?php
require_once __DIR__ . '/conexion.php';
class Juego {
   public static function crearPartida($fechaInicio, $tamañoTablero, $nivel = 'media', $idJ1 = null, $idJ2 = null){
      $conexion = conexion::crearConexion();

      $sql = "INSERT INTO juegos (fecha_inicio, tamano_tablero, nivel) VALUES (?,?,?)";
      $stmt = $conexion->prepare($sql);
      $stmt->bind_param("sis", $fechaInicio, $tamañoTablero, $nivel);
      $resultado = $stmt->execute();

      $idPartida = $stmt->insert_id;
      $stmt->close();

      if ($idPartida && $idJ1 && $idJ2) {
          $sqlPlayers = "INSERT INTO usuarios_juego (id_juego, id_usuario) VALUES (?, ?), (?, ?)";
          $stmtP = $conexion->prepare($sqlPlayers);
          $stmtP->bind_param("iiii", $idPartida, $idJ1, $idPartida, $idJ2);
          $stmtP->execute();
          $stmtP->close();
      }

      $conexion->close();
      return $idPartida;
   }

   //definimos un limite de 54, 27 por jugador
   public static function obtenerPalabrasParaPartida($nivel, $cantidad){
      $conexion = conexion::crearConexion();
      
      $abecedario = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'ñ', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
      
      $palabrasJugador1 = [];
      $palabrasJugador2 = [];
      
      $buscarLetra = function($letra) {
          if ($letra === 'a') return "('a', 'á')";
          if ($letra === 'e') return "('e', 'é')";
          if ($letra === 'i') return "('i', 'í')";
          if ($letra === 'o') return "('o', 'ó')";
          if ($letra === 'u') return "('u', 'ú')";
          return "('$letra')";
      };

      foreach ($abecedario as $letra) {
          $filtroLetras = $buscarLetra($letra);
          $sql = "SELECT id_palabra, termino, definicion, cantidad_letras 
                  FROM palabras 
                  WHERE nivel = ? AND LOWER(SUBSTRING(termino, 1, 1)) IN $filtroLetras 
                  ORDER BY RAND() 
                  LIMIT 2";
                  
          $stmt = $conexion->prepare($sql);
          $stmt->bind_param("s", $nivel);
          $stmt->execute();
          $result = $stmt->get_result();
          
          $letradas = [];
          while ($row = $result->fetch_assoc()) {
              $letradas[] = $row;
          }
          $stmt->close();
          
          // Respaldo parcial en caso de que falten palabras para esa letra
          if (count($letradas) < 2) {
              $excludeIds = [];
              foreach ($letradas as $l) {
                  $excludeIds[] = $l['id_palabra'];
              }
              $excludeSql = "";
              if (!empty($excludeIds)) {
                  $excludeSql = "AND id_palabra NOT IN (" . implode(",", $excludeIds) . ")";
              }
              
              $needed = 2 - count($letradas);
              $sqlFallback = "SELECT id_palabra, termino, definicion, cantidad_letras 
                              FROM palabras 
                              WHERE nivel = ? $excludeSql 
                              ORDER BY RAND() 
                              LIMIT $needed";
              $stmtF = $conexion->prepare($sqlFallback);
              $stmtF->bind_param("s", $nivel);
              $stmtF->execute();
              $resultF = $stmtF->get_result();
              while ($row = $resultF->fetch_assoc()) {
                  $letradas[] = $row;
              }
              $stmtF->close();
          }
          
          $palabrasJugador1[] = $letradas[0] ?? null;
          $palabrasJugador2[] = $letradas[1] ?? ($letradas[0] ?? null);
      }
      
      $conexion->close();
      return array_merge($palabrasJugador1, $palabrasJugador2);
   }

      

   public static function registrarGanador($idPartida, $idGanador, $tiempoUsado = null){
      $conexion = conexion::crearConexion();

      $sql = "INSERT INTO ganadores_juego (id_juego, id_usuario, tiempo_usado) VALUES (?,?,?)";
      $stmt = $conexion->prepare($sql);
      $stmt->bind_param("iii", $idPartida, $idGanador, $tiempoUsado);
      $resultado = $stmt->execute();

      $stmt->close();
      $conexion->close();

      return $resultado;
   }
   



public static function verificarRespuesta($idJuego, $idUsuario, $idPalabra, $respuestaUsuario){
    $conexion = conexion::crearConexion();

    // 1. Obtener la palabra correcta de la BD para comparar
    $sql = "SELECT termino FROM palabras WHERE id_palabra = ?";
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("i", $idPalabra);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $fila = $resultado->fetch_assoc();
    $stmt->close();

    if (!$fila) {
        $conexion->close();
        return false;
    }

    $palabraCorrecta = $fila['termino'];

    // 2. Comparar (cuidando mayúsculas/acentos, quizá usando mb_strtolower)
    $normalizar = function($texto) {
        $texto = trim($texto);
        $texto = mb_strtolower($texto, 'UTF-8');
        $buscar     = ['á', 'é', 'í', 'ó', 'ú', 'ü'];
        $reemplazar = ['a', 'e', 'i', 'o', 'u', 'u'];
        return str_replace($buscar, $reemplazar, $texto);
    };

    $palabraCorrectaNorm = $normalizar($palabraCorrecta);
    $respuestaUsuarioNorm = $normalizar($respuestaUsuario);

    $esCorrecto = ($palabraCorrectaNorm === $respuestaUsuarioNorm) ? 1 : 0;

    // 3. Insertar el resultado en una tabla intermedia de 'resultados_partida'
    $sqlInsert = "INSERT INTO resultados_partida (id_partida, id_usuario, id_palabra, respuesta_usuario, es_correcta) VALUES (?, ?, ?, ?, ?)";
    $stmtInsert = $conexion->prepare($sqlInsert);
    $stmtInsert->bind_param("iiisi", $idJuego, $idUsuario, $idPalabra, $respuestaUsuario, $esCorrecto);
    $stmtInsert->execute();
    $stmtInsert->close();

    $conexion->close();

    // 4. Retornar el resultado
    return [
        'es_correcta' => (bool)$esCorrecto,
        'palabra_correcta' => $palabraCorrecta
    ];
}

public static function obtenerUltimasPartidas() {
    $conexion = conexion::crearConexion();
    $sql = "SELECT j.id_juego, j.fecha_inicio, u.nombre_usuario AS ganador
            FROM juegos j
            LEFT JOIN ganadores_juego gj ON j.id_juego = gj.id_juego
            LEFT JOIN usuarios u ON gj.id_usuario = u.id_usuario
            ORDER BY j.fecha_inicio DESC
            LIMIT 5";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $partidas = [];
    while ($fila = $result->fetch_assoc()) {
        $partidas[] = $fila;
    }
    
    $stmt->close();
    $conexion->close();
    return $partidas;
}

public static function obtenerUltimasPartidasEntre($idJ1, $idJ2) {
    if (!$idJ1 || !$idJ2) {
        return [];
    }
    $conexion = conexion::crearConexion();
    $sql = "SELECT j.id_juego, j.fecha_inicio, u.nombre_usuario AS ganador
            FROM juegos j
            INNER JOIN usuarios_juego uj1 ON j.id_juego = uj1.id_juego AND uj1.id_usuario = ?
            INNER JOIN usuarios_juego uj2 ON j.id_juego = uj2.id_juego AND uj2.id_usuario = ?
            LEFT JOIN ganadores_juego gj ON j.id_juego = gj.id_juego
            LEFT JOIN usuarios u ON gj.id_usuario = u.id_usuario
            ORDER BY j.fecha_inicio DESC
            LIMIT 5";
    
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("ii", $idJ1, $idJ2);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $partidas = [];
    while ($fila = $result->fetch_assoc()) {
        $partidas[] = $fila;
    }
    
    $stmt->close();
    $conexion->close();
    return $partidas;
}
}