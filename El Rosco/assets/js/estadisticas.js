function cargarEstadisticasGenerales() {
    realizarPeticion('GET', 'El Rosco/assets/php/obtener_estadisticas.php', 't=' + new Date().getTime(), function (respuesta) {
        if (respuesta.exito) {
            // Renderizar Más Ganadores General
            renderStatsTable('statsWinnersGeneral', respuesta.winnersGeneral, 'victorias', 'victoria', 'victorias');

            // Renderizar por dificultad
            renderStatsTable('statsWinnersBaja', respuesta.winnersBaja, 'victorias', 'victoria', 'victorias');
            renderStatsTable('statsWinnersMedia', respuesta.winnersMedia, 'victorias', 'victoria', 'victorias');
            renderStatsTable('statsWinnersAlta', respuesta.winnersAlta, 'victorias', 'victoria', 'victorias');

            // Renderizar Más Rápidos
            renderStatsTableFastest('statsFastest', respuesta.fastest);

            // Renderizar Ranking General
            renderStatsTableRanking('statsRankingGeneral', respuesta.rankingGeneral);
        } else {
            console.error("Error al cargar estadísticas:", respuesta.message);
        }
    });
}

function renderStatsTable(containerId, data, valField, singularLabel, pluralLabel) {
    let container = document.getElementById(containerId);
    if (!container) return;
    if (!data || data.length === 0) {
        container.innerHTML = "<p class='stats-vacio'>No hay registros aún.</p>";
        return;
    }
    let html = `<table class="tabla-stats">
        <thead>
            <tr>
                <th>#</th>
                <th>Usuario</th>
                <th>Registro</th>
            </tr>
        </thead>
        <tbody>`;
    data.forEach((row, i) => {
        let count = row[valField];
        let label = count == 1 ? singularLabel : pluralLabel;
        html += `<tr>
            <td class="pos-num">#${i + 1}</td>
            <td>${row.nombre_usuario}</td>
            <td><strong>${count}</strong> ${label}</td>
        </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function renderStatsTableFastest(containerId, data) {
    let container = document.getElementById(containerId);
    if (!container) return;
    if (!data || data.length === 0) {
        container.innerHTML = "<p class='stats-vacio'>No hay registros aún.</p>";
        return;
    }
    let html = `<table class="tabla-stats">
        <thead>
            <tr>
                <th>#</th>
                <th>Usuario</th>
                <th>Tiempo</th>
                <th>Nivel</th>
            </tr>
        </thead>
        <tbody>`;
    data.forEach((row, i) => {
        html += `<tr>
            <td class="pos-num">#${i + 1}</td>
            <td>${row.nombre_usuario}</td>
            <td><strong class="tiempo-destacado">${row.tiempo_minimo}s</strong></td>
            <td><span class="destacado">${row.nivel.toUpperCase()}</span></td>
        </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function renderStatsTableRanking(containerId, data) {
    let container = document.getElementById(containerId);
    if (!container) return;
    if (!data || data.length === 0) {
        container.innerHTML = "<p class='stats-vacio'>No hay registros aún.</p>";
        return;
    }
    let html = `<table class="tabla-stats">
        <thead>
            <tr>
                <th>#</th>
                <th>Usuario</th>
                <th>Partidas</th>
                <th>Promedio</th>
            </tr>
        </thead>
        <tbody>`;
    data.forEach((row, i) => {
        let promText = row.tiempo_promedio ? `${row.tiempo_promedio}s` : '-';
        html += `<tr>
            <td class="pos-num">#${i + 1}</td>
            <td>${row.nombre_usuario}</td>
            <td><strong>${row.victorias}</strong> victorias</td>
            <td>${promText}</td>
        </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}
