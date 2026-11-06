# El Rosco — Instalación

Requiere XAMPP (Apache + MySQL).

## 1. Copiar el proyecto

Copiar la carpeta `Proyecto-El-Rosco` completa dentro de `C:\xampp\htdocs\`.

## 2. Levantar los servicios

Abrir el **XAMPP Control Panel** e iniciar **Apache** y **MySQL**.

## 3. Crear la base de datos

Entrar a <http://localhost/phpmyadmin> y, en la pestaña **Importar** (o **SQL**),
ejecutar los dos scripts de la carpeta `El Rosco/bd/` **en este orden**:

1. `el_roscodb.sql` — crea la base `el_roscodb` y todas sus tablas.
2. `palabras_iniciales.sql` — carga las 225 palabras del juego (75 por nivel).

El orden importa: el segundo script inserta sobre las tablas que crea el primero.
Si el primero se ejecuta dos veces dará error de "tabla ya existe"; en ese caso la
base ya está creada y solo hace falta correr el segundo.

**Si la base ya estaba creada con una versión anterior**, no hace falta borrarla:
ejecutar una sola vez `actualizacion_v2.sql` y después `actualizacion_v3.sql`.
Agregan las columnas y tablas nuevas sin perder los datos. En una instalación
nueva estos dos scripts no se usan.

## 4. Abrir el juego

Ir a <http://localhost/Proyecto-El-Rosco/>

No abrir el `index.html` con doble clic: el navegador no ejecuta PHP desde un
archivo local y el juego no va a funcionar.

## 5. Crear los dos usuarios

El juego es para dos jugadores y ambos tienen que estar logueados para empezar.
En la pantalla de acceso, usar **"¿No tienes cuenta? Regístrate"** y crear dos
cuentas distintas.

- El nombre de usuario debe tener entre 3 y 20 caracteres: solo letras, números
  o guion bajo.
- La contraseña debe tener como mínimo 8 caracteres, una mayúscula, un número y
  un carácter especial (`!@#$%^&*`). Por ejemplo: `Rosco2026!`

Después iniciar sesión con la primera cuenta (queda como Jugador 1) y enseguida
con la segunda (queda como Jugador 2). Ahí se habilita la pantalla de
configuración de partida, con la lista de partidas guardadas si las hubiera.

## Nota sobre la conexión

`El Rosco/assets/php/Conexion.php` usa los valores por defecto de XAMPP:
servidor `127.0.0.1`, usuario `root`, contraseña vacía. Si el MySQL de la otra
máquina tiene contraseña para `root`, hay que ponerla en ese archivo.

La aplicación fue probada con PHP 8 y MySQL/MariaDB de XAMPP.
