/* =========================================================
   Kalku — app.js
   Lógica de la calculadora interactiva (científica, finanzas y bases)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------------------------------------------------
       0. TEMA CLARO / OSCURO
    --------------------------------------------------- */
    const btnTema = document.getElementById('btnTema');
    const temaGuardado = localStorage.getItem('kalku-tema');
    if (temaGuardado === 'oscuro') {
        document.documentElement.setAttribute('data-tema', 'oscuro');
        btnTema.textContent = '☀️';
    }
    btnTema.addEventListener('click', () => {
        const esOscuro = document.documentElement.getAttribute('data-tema') === 'oscuro';
        if (esOscuro) {
            document.documentElement.removeAttribute('data-tema');
            btnTema.textContent = '🌙';
            localStorage.setItem('kalku-tema', 'claro');
        } else {
            document.documentElement.setAttribute('data-tema', 'oscuro');
            btnTema.textContent = '☀️';
            localStorage.setItem('kalku-tema', 'oscuro');
        }
    });

    /* ---------------------------------------------------
       1. CAMBIO DE MODO: Científico / Finanzas / Conversor
    --------------------------------------------------- */
    const tabsModo = document.querySelectorAll('.calc-tab');
    const paneles = {
        cientifico: document.getElementById('panel-cientifico'),
        comercial: document.getElementById('panel-comercial'),
        conversor: document.getElementById('panel-conversor'),
    };

    tabsModo.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabsModo.forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
            tab.classList.add('is-active');
            tab.setAttribute('aria-selected', 'true');

            const modo = tab.dataset.modo;
            Object.entries(paneles).forEach(([nombre, panel]) => {
                panel.classList.toggle('is-active', nombre === modo);
            });
        });
    });

    /* ---------------------------------------------------
       2. CALCULADORA CIENTÍFICA
    --------------------------------------------------- */
    const pantalla = document.getElementById('pantalla');
    const miniHistorial = document.getElementById('miniHistorial');
    const indicadorMemoria = document.getElementById('indicadorMemoria');

    let expresionActual = '';
    let memoria = 0;

    const actualizarPantalla = () => {
        pantalla.value = expresionActual === '' ? '0' : expresionActual;
    };

    const actualizarIndicadorMemoria = () => {
        indicadorMemoria.textContent = memoria !== 0 ? 'M' : '';
    };

    function redondear(numero) {
        return Math.round(numero * 1e8) / 1e8;
    }

    function mostrarErrorPantalla(mensaje) {
        pantalla.value = mensaje || 'Error';
        expresionActual = '';
        setTimeout(actualizarPantalla, 1100);
    }

    /* --- Dígitos y operadores --- */
    document.querySelectorAll('.tecla[data-valor]').forEach((tecla) => {
        tecla.addEventListener('click', () => {
            expresionActual += tecla.dataset.valor;
            actualizarPantalla();
        });
    });

    /* --- Acciones simples (no requieren servidor) --- */
    document.querySelectorAll('.tecla[data-accion]').forEach((tecla) => {
        tecla.addEventListener('click', () => {
            const accion = tecla.dataset.accion;

            if (accion === 'limpiar-todo') {
                expresionActual = '';
                miniHistorial.textContent = '';
                actualizarPantalla();
            } else if (accion === 'borrar') {
                expresionActual = expresionActual.slice(0, -1);
                actualizarPantalla();
            } else if (accion === 'signo') {
                if (expresionActual.startsWith('-')) {
                    expresionActual = expresionActual.slice(1);
                } else if (expresionActual !== '') {
                    expresionActual = '-' + expresionActual;
                }
                actualizarPantalla();
            } else if (accion === 'igual') {
                calcularExpresion();
            } else if (['raiz', 'cuadrado', 'seno', 'coseno', 'tangente', 'ln', 'factorial'].includes(accion)) {
                ejecutarFuncionCientifica(accion);
            }
        });
    });

    function calcularExpresion() {
        if (!expresionActual) return;
        // Solo se permiten dígitos y operadores básicos: + - * / . %
        const esSegura = /^[0-9+\-*/.%\s]+$/.test(expresionActual);
        if (!esSegura) { mostrarErrorPantalla(); return; }

        try {
            // Convertimos "%" en división por 100 aplicada al número previo
            const expresionEvaluable = expresionActual.replace(/(\d+(\.\d+)?)%/g, '($1/100)');
            // eslint-disable-next-line no-new-func
            const resultado = Function(`"use strict"; return (${expresionEvaluable})`)();

            if (!isFinite(resultado)) throw new Error('División por cero');

            miniHistorial.textContent = `${expresionActual} =`;
            registrarHistorialLocal(expresionActual, redondear(resultado));
            expresionActual = String(redondear(resultado));
            actualizarPantalla();
        } catch (e) {
            mostrarErrorPantalla();
        }
    }

    /* --- Funciones científicas: se calculan en el servidor (POO) --- */
    async function ejecutarFuncionCientifica(operacion) {
        const valorActual = parseFloat(expresionActual || pantalla.value) || 0;

        try {
            const respuesta = await fetch('/api/cientifica', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operacion, valor: valorActual }),
            });
            const datos = await respuesta.json();

            if (!respuesta.ok || datos.ok === false) {
                mostrarErrorPantalla('⚠ ' + (datos.error || 'Error'));
                return;
            }

            const etiquetas = {
                raiz: `√${valorActual}`, cuadrado: `${valorActual}²`,
                seno: `sen(${valorActual}°)`, coseno: `cos(${valorActual}°)`,
                tangente: `tan(${valorActual}°)`, ln: `ln(${valorActual})`,
                factorial: `${valorActual}!`,
            };
            miniHistorial.textContent = `${etiquetas[operacion]} =`;
            expresionActual = String(redondear(datos.resultado));
            actualizarPantalla();
            actualizarHistorialDesdeServidor();
        } catch (e) {
            mostrarErrorPantalla('⚠ Sin conexión con el servidor');
        }
    }

    /* --- Memoria (M+, M-, MR, MC) --- */
    document.querySelectorAll('.tecla--mem').forEach((tecla) => {
        tecla.addEventListener('click', () => {
            const accion = tecla.dataset.mem;
            const valorActual = parseFloat(pantalla.value) || 0;

            if (accion === 'sumar') memoria += valorActual;
            if (accion === 'restar') memoria -= valorActual;
            if (accion === 'recuperar') {
                expresionActual = String(memoria);
                actualizarPantalla();
            }
            if (accion === 'limpiar') memoria = 0;

            actualizarIndicadorMemoria();
            sincronizarMemoriaServidor(accion, valorActual);
        });
    });

    async function sincronizarMemoriaServidor(accion, valor) {
        try {
            await fetch('/api/memoria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion, valor }),
            });
        } catch (e) {
            console.warn('No se pudo sincronizar la memoria con el servidor.', e);
        }
    }

    /* --- Soporte de teclado --- */
    window.addEventListener('keydown', (evento) => {
        if (!paneles.cientifico.classList.contains('is-active')) return;

        const teclasPermitidas = '0123456789+-*/.%';
        if (teclasPermitidas.includes(evento.key)) {
            expresionActual += evento.key;
            actualizarPantalla();
        } else if (evento.key === 'Enter' || evento.key === '=') {
            evento.preventDefault();
            calcularExpresion();
        } else if (evento.key === 'Backspace') {
            expresionActual = expresionActual.slice(0, -1);
            actualizarPantalla();
        } else if (evento.key === 'Escape') {
            expresionActual = '';
            actualizarPantalla();
        }
    });

    /* ---------------------------------------------------
       3. MODO FINANZAS (IVA, descuento, margen)
    --------------------------------------------------- */
    const comercialTabs = document.querySelectorAll('.comercial-tab');
    const camposComercial = document.querySelectorAll('#panel-comercial .comercial-campos');
    const formComercial = document.getElementById('formComercial');
    const resultadoComercial = document.getElementById('resultadoComercial');
    let tipoComercialActivo = 'iva';

    comercialTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            comercialTabs.forEach((t) => t.classList.remove('is-active'));
            tab.classList.add('is-active');
            tipoComercialActivo = tab.dataset.tipo;

            camposComercial.forEach((campo) => {
                campo.hidden = campo.dataset.form !== tipoComercialActivo;
            });
            resultadoComercial.innerHTML = 'Completa los datos y presiona <strong>Calcular</strong>.';
        });
    });

    formComercial.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const valores = Object.fromEntries(new FormData(formComercial).entries());
        resultadoComercial.textContent = 'Calculando…';

        try {
            const respuesta = await fetch('/api/calcular', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operacion: tipoComercialActivo, valores }),
            });
            const datos = await respuesta.json();

            if (!respuesta.ok || datos.ok === false) {
                resultadoComercial.innerHTML = `<span class="resultado-error">⚠ ${datos.error || 'No se pudo calcular.'}</span>`;
                return;
            }

            pintarResultadoComercial(tipoComercialActivo, datos.resultado);
            actualizarHistorialDesdeServidor();
        } catch (error) {
            resultadoComercial.innerHTML = '<span class="resultado-error">⚠ No se pudo conectar con el servidor.</span>';
        }
    });

    function formatearMoneda(numero) {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(numero);
    }

    function pintarResultadoComercial(tipo, resultado) {
        if (tipo === 'iva') {
            resultadoComercial.innerHTML = `
                <div class="resultado-linea"><span>Neto</span><strong>${formatearMoneda(resultado.neto)}</strong></div>
                <div class="resultado-linea"><span>IVA</span><strong>${formatearMoneda(resultado.iva)}</strong></div>
                <div class="resultado-linea"><span>Total</span><strong>${formatearMoneda(resultado.total)}</strong></div>
            `;
        } else if (tipo === 'descuento') {
            resultadoComercial.innerHTML = `
                <div class="resultado-linea"><span>Descuento aplicado</span><strong>${formatearMoneda(resultado.descuento)}</strong></div>
                <div class="resultado-linea"><span>Precio final</span><strong>${formatearMoneda(resultado.precio_final)}</strong></div>
            `;
        } else if (tipo === 'margen') {
            resultadoComercial.innerHTML = `
                <div class="resultado-linea"><span>Ganancia</span><strong>${formatearMoneda(resultado.ganancia)}</strong></div>
                <div class="resultado-linea"><span>Margen</span><strong>${resultado.margen_pct}%</strong></div>
            `;
        }
    }

    /* ---------------------------------------------------
       4. MODO CONVERSOR DE BASES
    --------------------------------------------------- */
    const formConversor = document.getElementById('formConversor');
    const resultadoConversor = document.getElementById('resultadoConversor');
    const NOMBRES_BASE = { 2: 'Binario', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' };

    formConversor.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const datosFormulario = Object.fromEntries(new FormData(formConversor).entries());
        resultadoConversor.textContent = 'Convirtiendo…';

        try {
            const respuesta = await fetch('/api/convertir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosFormulario),
            });
            const datos = await respuesta.json();

            if (!respuesta.ok || datos.ok === false) {
                resultadoConversor.innerHTML = `<span class="resultado-error">⚠ ${datos.error || 'No se pudo convertir.'}</span>`;
                return;
            }

            const baseDestino = NOMBRES_BASE[datosFormulario.base_destino] || 'Resultado';
            resultadoConversor.innerHTML = `
                <div class="resultado-linea"><span>Valor decimal</span><strong>${datos.resultado.decimal}</strong></div>
                <div class="resultado-linea"><span>${baseDestino}</span><strong>${datos.resultado.resultado}</strong></div>
            `;
            actualizarHistorialDesdeServidor();
        } catch (error) {
            resultadoConversor.innerHTML = '<span class="resultado-error">⚠ No se pudo conectar con el servidor.</span>';
        }
    });

    /* ---------------------------------------------------
       5. HISTORIAL (combina operaciones locales y del servidor)
    --------------------------------------------------- */
    const listaHistorial = document.getElementById('listaHistorial');
    const btnLimpiarHistorial = document.getElementById('btnLimpiarHistorial');
    let historialLocal = [];

    function registrarHistorialLocal(expresion, resultado) {
        historialLocal.unshift({ expresion, resultado, local: true });
        historialLocal = historialLocal.slice(0, 20);
        pintarHistorial();
    }

    async function actualizarHistorialDesdeServidor() {
        try {
            const respuesta = await fetch('/api/historial');
            const datos = await respuesta.json();
            const delServidor = (datos.historial || []).slice().reverse();
            // El historial de operaciones puramente locales (expresiones con
            // + - * / calculadas en el navegador) se mantiene arriba.
            historialLocal = [...historialLocal.filter((item) => item.local), ...delServidor];
            pintarHistorial();
        } catch (e) {
            console.warn('No se pudo obtener el historial del servidor.', e);
        }
    }

    function pintarHistorial() {
        if (historialLocal.length === 0) {
            listaHistorial.innerHTML = '<li class="historial-vacio">Aún no hay operaciones.</li>';
            return;
        }
        listaHistorial.innerHTML = historialLocal
            .slice(0, 20)
            .map((item) => {
                const resultadoTexto = typeof item.resultado === 'object'
                    ? JSON.stringify(item.resultado)
                    : item.resultado;
                return `<li>${item.expresion} → ${resultadoTexto}</li>`;
            })
            .join('');
    }

    btnLimpiarHistorial.addEventListener('click', () => {
        historialLocal = [];
        pintarHistorial();
    });

    // Historial inicial (por si el servidor ya tenía datos)
    actualizarHistorialDesdeServidor();
});
