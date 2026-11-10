# El Rosco — Instalación

Desarrollé la aplicación con XAMPP (Apache + MySQL) y la probé con PHP 8 y el
MySQL/MariaDB que trae XAMPP. Estos son los pasos que hay que seguir para
instalarla en otra computadora.

## 1. Copiar el proyecto

Hay que copiar la carpeta `Proyecto-El-Rosco` completa dentro de `C:\xampp\htdocs\`.

## 2. Levantar los servicios

En el **XAMPP Control Panel** hay que iniciar **Apache** y **MySQL**.

## 3. Crear la base de datos

Preparé dos scripts que están en la carpeta `El Rosco/bd/`. Se ejecutan desde
<http://localhost/phpmyadmin>, en la pestaña **Importar** (o **SQL**),
**en este orden**:

1. `el_roscodb.sql` — crea la base `el_roscodb` y todas sus tablas.
2. `palabras_iniciales.sql` — carga las 225 palabras del juego (75 por nivel).

El orden importa: el segundo script inserta sobre las tablas que crea el primero.
Si el primero se ejecuta dos veces da error de "tabla ya existe"; en ese caso la
base ya está creada y solo hace falta correr el segundo.

Al principio de los dos scripts puse `SET NAMES utf8mb4` para que las tildes y la
ñ se guarden bien aunque se importen desde la consola de MySQL.

## 4. Abrir el juego

El juego se abre desde <http://localhost/Proyecto-El-Rosco/>

No hay que abrir el `index.html` con doble clic: el navegador no ejecuta PHP desde
un archivo local y el juego no va a funcionar.

## 5. Crear los dos usuarios

El juego es para dos jugadores y ambos tienen que estar logueados para empezar.
En la pantalla de acceso, con **"¿No tienes cuenta? Regístrate"** se crean dos
cuentas distintas.

- El nombre de usuario debe tener entre 3 y 20 caracteres: solo letras, números
  o guion bajo.
- La contraseña debe tener como mínimo 8 caracteres, una mayúscula, un número y
  un carácter especial (`!@#$%^&*`). Por ejemplo: `Rosco2026!`

Después se inicia sesión con la primera cuenta (queda como Jugador 1) y enseguida
con la segunda (queda como Jugador 2). Ahí se habilita la pantalla de
configuración de partida, con la lista de partidas guardadas si las hubiera.

## Nota sobre la conexión

En `El Rosco/assets/php/Conexion.php` dejé los valores por defecto de XAMPP:
servidor `127.0.0.1`, usuario `root` y contraseña vacía. Si el MySQL de la otra
máquina tiene contraseña para `root`, hay que ponerla en ese archivo.
