<?php
require_once __DIR__ . '/conexion.php';
class Juego {
   public static function crearPartida($fechaInicio, $tamanoTablero, $nivel = 'media', $idJ1 = null, $idJ2 = null){
      $conexion = conexion::crearConexion();

      $sql = "INSERT INTO juegos (fecha_inicio, tamano_tablero, nivel) VALUES (?,?,?)";
      $stmt = $conexion->prepare($sql);
      $stmt->bind_param("sis", $fechaInicio, $tamanoTablero, $nivel);
      $resultado = $stmt->execute();

      $idPartida = $stmt->insert_id;
      $stmt->close();

      if ($idPartida && $idJ1 && $idJ2) {
          $sqlJugadores = "INSERT INTO usuarios_juego (id_juego, id_usuario) VALUES (?, ?), (?, ?)";
          $stmtJugadores = $conexion->prepare($sqlJugadores);
          $stmtJugadores->bind_param("iiii", $idPartida, $idJ1, $idPartida, $idJ2);
          $stmtJugadores->execute();
          $stmtJugadores->close();
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
              $idsExcluidos = [];
              foreach ($letradas as $l) {
                  $idsExcluidos[] = $l['id_palabra'];
              }
              $sqlExclusiones = "";
              if (!empty($idsExcluidos)) {
                  $sqlExclusiones = "AND id_palabra NOT IN (" . implode(",", $idsExcluidos) . ")";
              }
              
              $necesitadas = 2 - count($letradas);
              
              // 1. Intentar buscar palabras que CONTIENEN la letra actual (LOWER(termino) LIKE '%letra%')
              $sqlRespaldo = "SELECT id_palabra, termino, definicion, cantidad_letras 
                              FROM palabras 
                              WHERE nivel = ? AND LOWER(termino) LIKE ? $sqlExclusiones 
                              ORDER BY RAND() 
                              LIMIT $necesitadas";
              $stmtRespaldo = $conexion->prepare($sqlRespaldo);
              $likeParam = "%" . strtolower($letra) . "%";
              $stmtRespaldo->bind_param("ss", $nivel, $likeParam);
              $stmtRespaldo->execute();
              $resultadoRespaldo = $stmtRespaldo->get_result();
              while ($row = $resultadoRespaldo->fetch_assoc()) {
                  $letradas[] = $row;
              }
              $stmtRespaldo->close();

              // 2. Si aún falta alguna palabra (caso extremo), buscar cualquier palabra aleatoria
              if (count($letradas) < 2) {
                  $idsExcluidos = [];
                  foreach ($letradas as $l) {
                      $idsExcluidos[] = $l['id_palabra'];
                  }
                  $sqlExclusiones = "";
                  if (!empty($idsExcluidos)) {
                      $sqlExclusiones = "AND id_palabra NOT IN (" . implode(",", $idsExcluidos) . ")";
                  }
                  
                  $necesitadas = 2 - count($letradas);
                  $sqlRespaldoAbsoluto = "SELECT id_palabra, termino, definicion, cantidad_letras 
                                          FROM palabras 
                                          WHERE nivel = ? $sqlExclusiones 
                                          ORDER BY RAND() 
                                          LIMIT $necesitadas";
                  $stmtRespaldoAbsoluto = $conexion->prepare($sqlRespaldoAbsoluto);
                  $stmtRespaldoAbsoluto->bind_param("s", $nivel);
                  $stmtRespaldoAbsoluto->execute();
                  $resultadoRespaldoAbsoluto = $stmtRespaldoAbsoluto->get_result();
                  while ($row = $resultadoRespaldoAbsoluto->fetch_assoc()) {
                      $letradas[] = $row;
                  }
                  $stmtRespaldoAbsoluto->close();
              }
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

       $palabraCorrectaNormalizada = $normalizar($palabraCorrecta);
       $respuestaUsuarioNormalizada = $normalizar($respuestaUsuario);

       $esCorrecto = ($palabraCorrectaNormalizada === $respuestaUsuarioNormalizada) ? 1 : 0;

       // 3. Insertar el resultado en una tabla intermedia de 'resultados_partida'
       $sqlInsercion = "INSERT INTO resultados_partida (id_partida, id_usuario, id_palabra, respuesta_usuario, es_correcta) VALUES (?, ?, ?, ?, ?)";
       $stmtInsercion = $conexion->prepare($sqlInsercion);
       $stmtInsercion->bind_param("iiisi", $idJuego, $idUsuario, $idPalabra, $respuestaUsuario, $esCorrecto);
       $stmtInsercion->execute();
       $stmtInsercion->close();

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