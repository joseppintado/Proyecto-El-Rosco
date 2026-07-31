function cargarEstadisticasGenerales() {
    realizarPeticion('GET', 'El Rosco/assets/php/obtener_estadisticas.php', 't=' + new Date().getTime(), function (respuesta) {
        if (respuesta.exito) {
            // más ganadores general
            renderizarTablaEstadisticas('statsGanadoresGeneral', respuesta.ganadoresGeneral, 'victorias', 'victoria', 'victorias');

            // por dificultad 
            renderizarTablaPorDificultad('statsGanadoresPorDificultad', respuesta.ganadoresBaja, respuesta.ganadoresMedia, respuesta.ganadoresAlta);

            // más rápidos
            renderizarTablaMasRapidos('statsMasRapidos', respuesta.masRapidos);

            // Ranking General
            renderizarTablaRanking('statsClasificacionGeneral', respuesta.rankingGeneral);
        } else {
            console.error("Error al cargar estadísticas:", respuesta.mensaje);
        }
    });
}

function renderizarTablaPorDificultad(idContenedor, ganadoresBaja, ganadoresMedia, ganadoresAlta) {
    let contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    let tieneDatos = (ganadoresBaja && ganadoresBaja.length > 0) ||
        (ganadoresMedia && ganadoresMedia.length > 0) ||
        (ganadoresAlta && ganadoresAlta.length > 0);

    if (!tieneDatos) {
        contenedor.innerHTML = "<p class='estadisticas-vacio'>No hay registros aún.</p>";
        return;
    }

    let html = `<table class="tabla-estadisticas">
        <thead>
            <tr>
                <th>Dificultad</th>
                <th>Usuario</th>
                <th>Registro</th>
            </tr>
        </thead>
        <tbody>`;

    let agregarFilas = (datos, dificultadEtiqueta) => {
        if (!datos || datos.length === 0) return;
        datos.forEach((fila) => {
            let cantidad = fila.victorias;
            let etiqueta = cantidad == 1 ? 'victoria' : 'victorias';
            html += `<tr>
                <td><span class="destacado">${dificultadEtiqueta}</span></td>
                <td>${fila.nombre_usuario}</td>
                <td><strong>${cantidad}</strong> ${etiqueta}</td>
            </tr>`;
        });
    };

    agregarFilas(ganadoresBaja, 'Baja');
    agregarFilas(ganadoresMedia, 'Media');
    agregarFilas(ganadoresAlta, 'Alta');

    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}

function renderizarTablaEstadisticas(idContenedor, datos, campoValor, etiquetaSingular, etiquetaPlural) {
    let contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    if (!datos || datos.length === 0) {
        contenedor.innerHTML = "<p class='estadisticas-vacio'>No hay registros aún.</p>";
        return;
    }
    let html = `<table class="tabla-estadisticas">
        <thead>
            <tr>
                <th>#</th>
                <th>Usuario</th>
                <th>Registro</th>
            </tr>
        </thead>
        <tbody>`;
    datos.forEach((fila, i) => {
        let cantidad = fila[campoValor];
        let etiqueta = cantidad == 1 ? etiquetaSingular : etiquetaPlural;
        html += `<tr>
            <td class="posicion-numero">#${i + 1}</td>
            <td>${fila.nombre_usuario}</td>
            <td><strong>${cantidad}</strong> ${etiqueta}</td>
        </tr>`;
    });
    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}

function renderizarTablaMasRapidos(idContenedor, datos) {
    let contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    if (!datos || datos.length === 0) {
        contenedor.innerHTML = "<p class='estadisticas-vacio'>No hay registros aún.</p>";
        return;
    }
    let html = `<table class="tabla-estadisticas">
        <thead>
            <tr>
                <th>#</th>
                <th>Usuario</th>
                <th>Tiempo</th>
                <th>Nivel</th>
            </tr>
        </thead>
        <tbody>`;
    datos.forEach((fila, i) => {
        html += `<tr>
            <td class="posicion-numero">#${i + 1}</td>
            <td>${fila.nombre_usuario}</td>
            <td><strong class="tiempo-destacado">${fila.tiempo_minimo}s</strong></td>
            <td><span class="destacado">${fila.nivel.toUpperCase()}</span></td>
        </tr>`;
    });
    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}

function renderizarTablaRanking(idContenedor, datos) {
    let contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    if (!datos || datos.length === 0) {
        contenedor.innerHTML = "<p class='estadisticas-vacio'>No hay registros aún.</p>";
        return;
    }
    let html = `<table class="tabla-estadisticas">
        <thead>
            <tr>
                <th>#</th>
                <th>Usuario</th>
                <th>Partidas</th>
                <th>Promedio</th>
            </tr>
        </thead>
        <tbody>`;
    datos.forEach((fila, i) => {
        let textoPromedio = fila.tiempo_promedio ? `${fila.tiempo_promedio}s` : '-';
        html += `<tr>
            <td class="posicion-numero">#${i + 1}</td>
            <td>${fila.nombre_usuario}</td>
            <td><strong>${fila.victorias}</strong> victorias</td>
            <td>${textoPromedio}</td>
        </tr>`;
    });
    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}
