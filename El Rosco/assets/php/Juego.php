<?php
require_once __DIR__ . '/Conexion.php';

class Juego {
   // valores permitidos, los usamos para validar lo que llega del cliente
   const NIVELES = ['baja', 'media', 'alta'];
   const DURACIONES = [0, 120, 180, 300];
   const MOTIVOS = ['completo', 'tiempo', 'abandono'];
   const LETRAS_POR_ROSCO = 27;
   const DIAS_GUARDADO = 10;   // días que puede estar guardada una partida

   // creamos la partida, vinculamos a los jugadores y guardamos sus 54 palabras
   // lo hacemos todo dentro de una transacción para que no quede nada a medias
   public static function crearPartida($fechaInicio, $nivel, $duracion, $ayuda, $jugadorInicial, $idJ1, $idJ2, $palabras){
      $conexion = Conexion::crearConexion();
      $conexion->begin_transaction();

      $todoOk = true;
      $idPartida = 0;
      $tamano = self::LETRAS_POR_ROSCO;

      // la partida arranca en curso y con el turno del jugador que inicia
      $sql = "INSERT INTO juegos (fecha_inicio, tamano_tablero, nivel, duracion_segundos, ayuda, jugador_inicial, estado, turno_actual)
              VALUES (?, ?, ?, ?, ?, ?, 'en_curso', ?)";
      $stmt = $conexion->prepare($sql);
      $stmt->bind_param("sisiiii", $fechaInicio, $tamano, $nivel, $duracion, $ayuda, $jugadorInicial, $jugadorInicial);
      if ($stmt->execute()) {
          $idPartida = $conexion->insert_id;
      } else {
          $todoOk = false;
      }
      $stmt->close();

      if ($todoOk) {
          $sqlJugadores = "INSERT INTO usuarios_juego (id_juego, id_usuario, numero_jugador) VALUES (?, ?, 1), (?, ?, 2)";
          $stmtJugadores = $conexion->prepare($sqlJugadores);
          $stmtJugadores->bind_param("iiii", $idPartida, $idJ1, $idPartida, $idJ2);
          if (!$stmtJugadores->execute()) {
              $todoOk = false;
          }
          $stmtJugadores->close();
      }

      // preparamos el insert una sola vez y lo ejecutamos 54 veces cambiando los valores
      if ($todoOk) {
          $sqlPalabra = "INSERT INTO palabras_partida (id_juego, numero_jugador, posicion, id_palabra) VALUES (?, ?, ?, ?)";
          $stmtPalabra = $conexion->prepare($sqlPalabra);
          $stmtPalabra->bind_param("iiii", $idPartida, $numeroJugador, $posicion, $idPalabra);
          foreach ([1, 2] as $numeroJugador) {
              foreach ($palabras[$numeroJugador] as $posicion => $palabra) {
                  $idPalabra = $palabra['id_palabra'];
                  if (!$stmtPalabra->execute()) {
                      $todoOk = false;
                      break 2;
                  }
              }
          }
          $stmtPalabra->close();
      }

      if ($todoOk) {
          $conexion->commit();
      } else {
          $conexion->rollback();
          $idPartida = 0;
      }

      $conexion->close();
      return $idPartida;
   }

   //definimos un limite de 54, 27 por jugador, todas distintas
   //si no hay palabras suficientes devolvemos null
   public static function obtenerPalabrasParaPartida($nivel){
      $conexion = Conexion::crearConexion();

      $abecedario = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'ñ', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

      $palabras = [1 => [], 2 => []];
      $idsUsados = []; // guardamos los ids elegidos para no repetir palabras

      foreach ($abecedario as $letra) {
          // 1. Buscamos palabras que empiezan con la letra
          $elegidas = self::buscarPalabras($conexion, $nivel, 'empieza', $letra, $idsUsados, 2);

          // 2. Si faltan, buscamos palabras que contienen la letra
          if (count($elegidas) < 2) {
              $elegidas = array_merge($elegidas, self::buscarPalabras($conexion, $nivel, 'contiene', $letra, $idsUsados, 2 - count($elegidas)));
          }

          // 3. Caso extremo: cualquier palabra del nivel que no se haya usado
          if (count($elegidas) < 2) {
              $elegidas = array_merge($elegidas, self::buscarPalabras($conexion, $nivel, 'cualquiera', $letra, $idsUsados, 2 - count($elegidas)));
          }

          if (count($elegidas) < 2) {
              $conexion->close();
              return null;
          }

          $palabras[1][] = $elegidas[0];
          $palabras[2][] = $elegidas[1];
      }

      $conexion->close();
      return $palabras;
   }

   // busca palabras del nivel según el criterio, excluyendo las ya usadas
   // $idsUsados va por referencia para ir agregando las elegidas
   private static function buscarPalabras($conexion, $nivel, $criterio, $letra, &$idsUsados, $cantidad){
      // forzamos los ids a entero antes de armar el NOT IN
      $exclusion = "";
      if (!empty($idsUsados)) {
          $exclusion = "AND id_palabra NOT IN (" . implode(",", array_map('intval', $idsUsados)) . ")";
      }
      $cantidad = (int)$cantidad;

      $sql = "SELECT id_palabra, termino, definicion, cantidad_letras FROM palabras WHERE nivel = ? ";

      if ($criterio === 'empieza') {
          // las vocales también pueden empezar con tilde
          $conTilde = ['a' => 'á', 'e' => 'é', 'i' => 'í', 'o' => 'ó', 'u' => 'ú'];
          $variante = $conTilde[$letra] ?? $letra;
          // usamos BINARY porque con utf8mb4_unicode_ci la 'n' y la 'ñ' se toman como iguales
          $sql .= "AND BINARY LOWER(SUBSTRING(termino, 1, 1)) IN (?, ?) $exclusion ORDER BY RAND() LIMIT $cantidad";
          $stmt = $conexion->prepare($sql);
          $stmt->bind_param("sss", $nivel, $letra, $variante);
      } else if ($criterio === 'contiene') {
          $parametroLike = "%" . $letra . "%";
          $sql .= "AND BINARY LOWER(termino) LIKE ? $exclusion ORDER BY RAND() LIMIT $cantidad";
          $stmt = $conexion->prepare($sql);
          $stmt->bind_param("ss", $nivel, $parametroLike);
      } else {
          $sql .= "$exclusion ORDER BY RAND() LIMIT $cantidad";
          $stmt = $conexion->prepare($sql);
          $stmt->bind_param("s", $nivel);
      }

      $stmt->execute();
      $resultado = $stmt->get_result();

      $lista = [];
      while ($fila = $resultado->fetch_assoc()) {
          $lista[] = $fila;
          $idsUsados[] = $fila['id_palabra'];
      }
      $resultado->free();
      $stmt->close();

      return $lista;
   }

   public static function verificarRespuesta($idJuego, $idUsuario, $idPalabra, $respuestaUsuario){
       $conexion = Conexion::crearConexion();

       // 1. Obtenemos la palabra correcta de la BD para comparar
       $sql = "SELECT termino FROM palabras WHERE id_palabra = ?";
       $stmt = $conexion->prepare($sql);
       $stmt->bind_param("i", $idPalabra);
       $stmt->execute();
       $resultado = $stmt->get_result();
       $fila = $resultado->fetch_assoc();
       $resultado->free();
       $stmt->close();

       if (!$fila) {
           $conexion->close();
           return false;
       }

       $palabraCorrecta = $fila['termino'];

       // 2. Comparamos cuidando mayúsculas y acentos
       $normalizar = function($texto) {
           $texto = trim($texto);
           $texto = mb_strtolower($texto, 'UTF-8');
           $buscar     = ['á', 'é', 'í', 'ó', 'ú', 'ü'];
           $reemplazar = ['a', 'e', 'i', 'o', 'u', 'u'];
           return str_replace($buscar, $reemplazar, $texto);
       };

       $esCorrecto = ($normalizar($palabraCorrecta) === $normalizar($respuestaUsuario)) ? 1 : 0;

       // 3. Insertamos el resultado en una tabla intermedia de 'resultados_partida'
       $sqlInsercion = "INSERT INTO resultados_partida (id_partida, id_usuario, id_palabra, respuesta_usuario, es_correcta) VALUES (?, ?, ?, ?, ?)";
       $stmtInsercion = $conexion->prepare($sqlInsercion);
       $stmtInsercion->bind_param("iiisi", $idJuego, $idUsuario, $idPalabra, $respuestaUsuario, $esCorrecto);
       $stmtInsercion->execute();
       $stmtInsercion->close();

       $conexion->close();

       return [
           'es_correcta' => (bool)$esCorrecto,
           'palabra_correcta' => $palabraCorrecta
       ];
   }

   // cerramos la partida: calculamos el ganador en el servidor y guardamos todo en una transacción
   public static function finalizarPartida($idJuego, $motivo, $abandona, $idUsuarios, $tiempos, $fechaFin){
       $conexion = Conexion::crearConexion();

       // 1. Contamos aciertos y errores desde resultados_partida (no confiamos en el cliente)
       list($aciertos, $errores) = self::contarAciertosErrores($conexion, $idJuego, $idUsuarios);

       // 2. Determinamos el ganador
       list($ganador, $criterio) = self::determinarGanador($motivo, $abandona, $aciertos, $tiempos, $errores);

       // 3. Guardamos todo dentro de una transacción
       $conexion->begin_transaction();
       $todoOk = true;

       $sqlJuego = "UPDATE juegos SET estado = 'finalizada', fecha_fin = ?, motivo_fin = ? WHERE id_juego = ?";
       $stmtJuego = $conexion->prepare($sqlJuego);
       $stmtJuego->bind_param("ssi", $fechaFin, $motivo, $idJuego);
       if (!$stmtJuego->execute()) $todoOk = false;
       $stmtJuego->close();

       foreach ([1, 2] as $numero) {
           if (!$todoOk) break;
           $sqlJugador = "UPDATE usuarios_juego SET aciertos = ?, errores = ?, tiempo_usado = ? WHERE id_juego = ? AND id_usuario = ?";
           $stmtJugador = $conexion->prepare($sqlJugador);
           $stmtJugador->bind_param("iiiii", $aciertos[$numero], $errores[$numero], $tiempos[$numero], $idJuego, $idUsuarios[$numero]);
           if (!$stmtJugador->execute()) $todoOk = false;
           $stmtJugador->close();
       }

       if ($todoOk) {
           // si ganó por abandono no guardamos el tiempo, así no cuenta en los más rápidos
           $tiempoGanador = ($motivo === 'abandono') ? null : $tiempos[$ganador];
           $sqlGanador = "INSERT INTO ganadores_juego (id_juego, id_usuario, tiempo_usado) VALUES (?, ?, ?)";
           $stmtGanador = $conexion->prepare($sqlGanador);
           $stmtGanador->bind_param("iii", $idJuego, $idUsuarios[$ganador], $tiempoGanador);
           if (!$stmtGanador->execute()) $todoOk = false;
           $stmtGanador->close();
       }

       if ($todoOk) {
           $conexion->commit();
       } else {
           $conexion->rollback();
       }
       $conexion->close();

       if (!$todoOk) {
           return false;
       }

       return [
           'ganador' => $ganador,
           'criterio' => $criterio,
           'aciertos' => $aciertos,
           'errores' => $errores,
           'tiempos' => $tiempos
       ];
   }

   // contamos aciertos y errores de cada jugador, lo usan finalizarPartida y guardarPartida
   private static function contarAciertosErrores($conexion, $idJuego, $idUsuarios){
       $aciertos = [1 => 0, 2 => 0];
       $errores = [1 => 0, 2 => 0];

       $sql = "SELECT id_usuario, SUM(es_correcta) AS aciertos, SUM(1 - es_correcta) AS errores
               FROM resultados_partida
               WHERE id_partida = ?
               GROUP BY id_usuario";
       $stmt = $conexion->prepare($sql);
       $stmt->bind_param("i", $idJuego);
       $stmt->execute();
       $resultado = $stmt->get_result();
       while ($fila = $resultado->fetch_assoc()) {
           $numero = ($fila['id_usuario'] == $idUsuarios[1]) ? 1 : 2;
           $aciertos[$numero] = (int)$fila['aciertos'];
           $errores[$numero] = (int)$fila['errores'];
       }
       $resultado->free();
       $stmt->close();

       return [$aciertos, $errores];
   }

   // guardamos la partida tal como está para poder retomarla dentro de los 10 días
   public static function guardarPartida($idJuego, $turno, $idUsuarios, $indices, $tiempos, $fechaGuardado){
       $conexion = Conexion::crearConexion();

       // los aciertos al momento del guardado se usan si la partida vence
       list($aciertos, $errores) = self::contarAciertosErrores($conexion, $idJuego, $idUsuarios);

       $conexion->begin_transaction();
       $todoOk = true;

       // solo se puede guardar una partida en curso
       $sqlJuego = "UPDATE juegos SET estado = 'guardada', turno_actual = ?, fecha_guardado = ?
                    WHERE id_juego = ? AND estado = 'en_curso'";
       $stmtJuego = $conexion->prepare($sqlJuego);
       $stmtJuego->bind_param("isi", $turno, $fechaGuardado, $idJuego);
       // si no se modificó exactamente una fila, algo falló
       if (!$stmtJuego->execute() || $stmtJuego->affected_rows !== 1) $todoOk = false;
       $stmtJuego->close();

       foreach ([1, 2] as $numero) {
           if (!$todoOk) break;
           $sqlJugador = "UPDATE usuarios_juego SET aciertos = ?, errores = ?, tiempo_usado = ?, indice_actual = ?
                          WHERE id_juego = ? AND id_usuario = ?";
           $stmtJugador = $conexion->prepare($sqlJugador);
           $stmtJugador->bind_param("iiiiii", $aciertos[$numero], $errores[$numero], $tiempos[$numero],
                                    $indices[$numero], $idJuego, $idUsuarios[$numero]);
           if (!$stmtJugador->execute()) $todoOk = false;
           $stmtJugador->close();
       }

       if ($todoOk) {
           $conexion->commit();
       } else {
           $conexion->rollback();
       }
       $conexion->close();

       return $todoOk;
   }

   // finalizamos las partidas guardadas hace más de 10 días
   // gana el que tenía más aciertos al guardar y si empatan el que usó menos tiempo
   // como PHP no corre solo, lo llamamos al listar partidas guardadas, el historial y las estadísticas
   public static function finalizarPartidasVencidas(){
       $conexion = Conexion::crearConexion();

       // calculamos la fecha límite en PHP para usar la misma zona horaria que al guardar
       $segundosPlazo = self::DIAS_GUARDADO * 24 * 60 * 60;
       $fechaLimite = date('Y-m-d H:i:s', time() - $segundosPlazo);

       // 1. Buscamos las partidas vencidas con los datos de cada jugador al guardar
       $sql = "SELECT j.id_juego, j.fecha_guardado, uj.numero_jugador, uj.id_usuario,
                      uj.aciertos, uj.errores, uj.tiempo_usado
               FROM juegos j
               INNER JOIN usuarios_juego uj ON j.id_juego = uj.id_juego
               WHERE j.estado = 'guardada' AND j.fecha_guardado < ?";
       $stmt = $conexion->prepare($sql);
       $stmt->bind_param("s", $fechaLimite);
       $stmt->execute();
       $resultado = $stmt->get_result();

       // agrupamos las dos filas de cada partida (una por jugador)
       $vencidas = [];
       while ($fila = $resultado->fetch_assoc()) {
           $id = $fila['id_juego'];
           $numero = (int)$fila['numero_jugador'];
           $vencidas[$id]['fecha_guardado'] = $fila['fecha_guardado'];
           $vencidas[$id]['usuarios'][$numero] = (int)$fila['id_usuario'];
           $vencidas[$id]['aciertos'][$numero] = (int)$fila['aciertos'];
           $vencidas[$id]['errores'][$numero] = (int)$fila['errores'];
           $vencidas[$id]['tiempos'][$numero] = (int)$fila['tiempo_usado'];
       }
       $resultado->free();
       $stmt->close();

       // 2. Cerramos cada partida en su propia transacción
       $finalizadas = 0;
       foreach ($vencidas as $idJuego => $datos) {
           list($ganador, $criterio) = self::determinarGanador('vencida', 0, $datos['aciertos'], $datos['tiempos'], $datos['errores']);

           // la fecha de fin es cuando venció el plazo
           $fechaFin = date('Y-m-d H:i:s', strtotime($datos['fecha_guardado']) + $segundosPlazo);

           $conexion->begin_transaction();
           $todoOk = true;

           // controlamos el estado para que no se cierre dos veces la misma partida
           $sqlJuego = "UPDATE juegos SET estado = 'finalizada', fecha_fin = ?, motivo_fin = 'vencida'
                        WHERE id_juego = ? AND estado = 'guardada'";
           $stmtJuego = $conexion->prepare($sqlJuego);
           $stmtJuego->bind_param("si", $fechaFin, $idJuego);
           if (!$stmtJuego->execute() || $stmtJuego->affected_rows !== 1) $todoOk = false;
           $stmtJuego->close();

           if ($todoOk) {
               // no se terminó de jugar, no guardamos el tiempo
               $tiempoGanador = null;
               $sqlGanador = "INSERT INTO ganadores_juego (id_juego, id_usuario, tiempo_usado) VALUES (?, ?, ?)";
               $stmtGanador = $conexion->prepare($sqlGanador);
               $stmtGanador->bind_param("iii", $idJuego, $datos['usuarios'][$ganador], $tiempoGanador);
               if (!$stmtGanador->execute()) $todoOk = false;
               $stmtGanador->close();
           }

           if ($todoOk) {
               $conexion->commit();
               $finalizadas++;
           } else {
               $conexion->rollback();
           }
       }

       $conexion->close();
       return $finalizadas;
   }

   // gana el que acertó más y si empatan el que usó menos tiempo
   // si también empatan en tiempo gana el de menos errores y si empatan en todo se sortea
   private static function determinarGanador($motivo, $abandona, $aciertos, $tiempos, $errores){
       if ($motivo === 'abandono') {
           return [($abandona === 1) ? 2 : 1, 'abandono'];
       }
       if ($aciertos[1] !== $aciertos[2]) {
           return [($aciertos[1] > $aciertos[2]) ? 1 : 2, 'aciertos'];
       }
       if ($tiempos[1] !== $tiempos[2]) {
           return [($tiempos[1] < $tiempos[2]) ? 1 : 2, 'tiempo'];
       }
       if ($errores[1] !== $errores[2]) {
           return [($errores[1] < $errores[2]) ? 1 : 2, 'errores'];
       }
       return [rand(1, 2), 'sorteo'];
   }

   // partidas guardadas entre los dos jugadores actuales
   // los aciertos se devuelven según quién es jugador 1 y 2 en esta sesión
   public static function obtenerPartidasGuardadasEntre($idJ1, $idJ2) {
       $conexion = Conexion::crearConexion();
       $sql = "SELECT j.id_juego, j.nivel, j.duracion_segundos, j.ayuda, j.fecha_guardado,
                      uj1.aciertos AS aciertos_j1, uj2.aciertos AS aciertos_j2
               FROM juegos j
               INNER JOIN usuarios_juego uj1 ON j.id_juego = uj1.id_juego AND uj1.id_usuario = ?
               INNER JOIN usuarios_juego uj2 ON j.id_juego = uj2.id_juego AND uj2.id_usuario = ?
               WHERE j.estado = 'guardada'
               ORDER BY j.fecha_guardado DESC";

       $stmt = $conexion->prepare($sql);
       $stmt->bind_param("ii", $idJ1, $idJ2);
       $stmt->execute();
       $resultado = $stmt->get_result();

       $segundosPlazo = self::DIAS_GUARDADO * 24 * 60 * 60;
       $partidas = [];
       while ($fila = $resultado->fetch_assoc()) {
           $guardado = strtotime($fila['fecha_guardado']);
           $partidas[] = [
               'id_juego' => (int)$fila['id_juego'],
               'nivel' => $fila['nivel'],
               'duracion' => (int)$fila['duracion_segundos'],
               'ayuda' => (int)$fila['ayuda'],
               'aciertos_j1' => (int)$fila['aciertos_j1'],
               'aciertos_j2' => (int)$fila['aciertos_j2'],
               'fecha_guardado' => date('d/m/Y H:i', $guardado),
               'fecha_vencimiento' => date('d/m/Y H:i', $guardado + $segundosPlazo)
           ];
       }

       $resultado->free();
       $stmt->close();
       $conexion->close();
       return $partidas;
   }

   // cargamos una partida guardada tal como quedó
   // si iniciaron sesión en orden inverso traducimos los números de jugador
   // devuelve null si la partida no existe, no es de estos jugadores o no está guardada
   public static function cargarPartidaGuardada($idJuego, $idJ1, $idJ2) {
       $conexion = Conexion::crearConexion();

       // 1. Obtenemos los datos de la partida, los join con los dos usuarios aseguran que sea de ellos
       $sql = "SELECT j.nivel, j.duracion_segundos, j.ayuda, j.jugador_inicial, j.turno_actual,
                      uj1.numero_jugador AS numero_original_j1, uj1.tiempo_usado AS tiempo_j1, uj1.indice_actual AS indice_j1,
                      uj2.numero_jugador AS numero_original_j2, uj2.tiempo_usado AS tiempo_j2, uj2.indice_actual AS indice_j2
               FROM juegos j
               INNER JOIN usuarios_juego uj1 ON j.id_juego = uj1.id_juego AND uj1.id_usuario = ?
               INNER JOIN usuarios_juego uj2 ON j.id_juego = uj2.id_juego AND uj2.id_usuario = ?
               WHERE j.id_juego = ? AND j.estado = 'guardada'";
       $stmt = $conexion->prepare($sql);
       $stmt->bind_param("iii", $idJ1, $idJ2, $idJuego);
       $stmt->execute();
       $resultado = $stmt->get_result();
       $fila = $resultado->fetch_assoc();
       $resultado->free();
       $stmt->close();

       if (!$fila) {
           $conexion->close();
           return null;
       }

       // número de jugador en la partida original => número en esta sesión
       $numeroEnSesion = [
           (int)$fila['numero_original_j1'] => 1,
           (int)$fila['numero_original_j2'] => 2
       ];

       // 2. Obtenemos las 54 palabras en el orden del rosco
       $sqlPalabras = "SELECT pp.numero_jugador, pp.posicion, p.id_palabra, p.termino, p.definicion, p.cantidad_letras
                       FROM palabras_partida pp
                       INNER JOIN palabras p ON pp.id_palabra = p.id_palabra
                       WHERE pp.id_juego = ?
                       ORDER BY pp.numero_jugador, pp.posicion";
       $stmtPalabras = $conexion->prepare($sqlPalabras);
       $stmtPalabras->bind_param("i", $idJuego);
       $stmtPalabras->execute();
       $resultadoPalabras = $stmtPalabras->get_result();

       $palabras = [1 => [], 2 => []];
       $posicionDePalabra = []; // id_palabra => [jugador, posición]
       while ($p = $resultadoPalabras->fetch_assoc()) {
           $jugador = $numeroEnSesion[(int)$p['numero_jugador']];
           $posicion = (int)$p['posicion'];
           $palabras[$jugador][$posicion] = [
               'id_palabra' => $p['id_palabra'],
               'termino' => $p['termino'],
               'definicion' => $p['definicion'],
               'cantidad_letras' => $p['cantidad_letras']
           ];
           $posicionDePalabra[$p['id_palabra']] = [$jugador, $posicion];
       }
       $resultadoPalabras->free();
       $stmtPalabras->close();

       if (count($palabras[1]) !== self::LETRAS_POR_ROSCO || count($palabras[2]) !== self::LETRAS_POR_ROSCO) {
           $conexion->close();
           return null;
       }

       // 3. Obtenemos las letras ya arriesgadas y si fueron acierto o error
       $sqlResultados = "SELECT id_palabra, es_correcta FROM resultados_partida WHERE id_partida = ?";
       $stmtResultados = $conexion->prepare($sqlResultados);
       $stmtResultados->bind_param("i", $idJuego);
       $stmtResultados->execute();
       $resultadoResultados = $stmtResultados->get_result();

       $letras = [1 => [], 2 => []];        // para el cliente
       $contestadas = [1 => [], 2 => []];   // para la sesión
       while ($r = $resultadoResultados->fetch_assoc()) {
           if (!isset($posicionDePalabra[$r['id_palabra']])) continue;
           list($jugador, $posicion) = $posicionDePalabra[$r['id_palabra']];
           $letras[$jugador][] = ['indice' => $posicion, 'es_correcta' => (bool)$r['es_correcta']];
           $contestadas[$jugador][] = $posicion;
       }
       $resultadoResultados->free();
       $stmtResultados->close();

       // 4. La partida vuelve a estar en curso
       $sqlEstado = "UPDATE juegos SET estado = 'en_curso' WHERE id_juego = ? AND estado = 'guardada'";
       $stmtEstado = $conexion->prepare($sqlEstado);
       $stmtEstado->bind_param("i", $idJuego);
       $ok = $stmtEstado->execute() && $stmtEstado->affected_rows === 1;
       $stmtEstado->close();
       $conexion->close();

       if (!$ok) {
           return null;
       }

       return [
           'nivel' => $fila['nivel'],
           'duracion' => (int)$fila['duracion_segundos'],
           'ayuda' => (int)$fila['ayuda'],
           'jugador_inicial' => $numeroEnSesion[(int)$fila['jugador_inicial']],
           // número de cada jugador en la partida original, lo usamos al volver a guardar
           'numero_original' => [1 => (int)$fila['numero_original_j1'], 2 => (int)$fila['numero_original_j2']],
           'turno' => $numeroEnSesion[(int)$fila['turno_actual']],
           'palabras' => $palabras,
           'contestadas' => $contestadas,
           'jugadores' => [
               1 => ['indice' => (int)$fila['indice_j1'], 'tiempo_usado' => (int)$fila['tiempo_j1'], 'letras' => $letras[1]],
               2 => ['indice' => (int)$fila['indice_j2'], 'tiempo_usado' => (int)$fila['tiempo_j2'], 'letras' => $letras[2]]
           ]
       ];
   }

   // últimas partidas finalizadas entre los dos jugadores actuales
   public static function obtenerUltimasPartidasEntre($idJ1, $idJ2) {
       if (!$idJ1 || !$idJ2) {
           return [];
       }
       $conexion = Conexion::crearConexion();
       $sql = "SELECT j.id_juego, j.fecha_inicio, j.nivel, j.motivo_fin,
                      uj1.aciertos AS aciertos_j1, uj2.aciertos AS aciertos_j2,
                      u.nombre_usuario AS ganador
               FROM juegos j
               INNER JOIN usuarios_juego uj1 ON j.id_juego = uj1.id_juego AND uj1.id_usuario = ?
               INNER JOIN usuarios_juego uj2 ON j.id_juego = uj2.id_juego AND uj2.id_usuario = ?
               LEFT JOIN ganadores_juego gj ON j.id_juego = gj.id_juego
               LEFT JOIN usuarios u ON gj.id_usuario = u.id_usuario
               WHERE j.estado = 'finalizada'
               ORDER BY j.fecha_inicio DESC
               LIMIT 5";

       $stmt = $conexion->prepare($sql);
       $stmt->bind_param("ii", $idJ1, $idJ2);
       $stmt->execute();
       $resultado = $stmt->get_result();

       $partidas = [];
       while ($fila = $resultado->fetch_assoc()) {
           // escapamos el nombre porque se muestra en el HTML
           $fila['ganador'] = htmlspecialchars($fila['ganador'] ?? '', ENT_QUOTES, 'UTF-8');
           $partidas[] = $fila;
       }

       $resultado->free();
       $stmt->close();
       $conexion->close();
       return $partidas;
   }
}
?>
