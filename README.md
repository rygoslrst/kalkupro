# Kalku 🧮 — Calculadora libre

Aplicación web construida con **Flask** y **Programación Orientada a
Objetos**. Es software libre (licencia MIT): cualquier persona puede
usarla, leer su código, modificarlo y compartirlo.

Kalku tiene tres modos:

- **Científica**: suma, resta, multiplicación, división, potencias,
  raíz cuadrada, cuadrado, porcentaje, logaritmo (log y ln),
  trigonometría (seno, coseno, tangente), factorial, constantes π y e,
  cambio de signo y memoria (M+, M-, MR, MC).
- **Finanzas**: cálculo de IVA, aplicación de descuentos y cálculo de
  margen de ganancia.
- **Conversor de bases**: convierte números entre binario, octal,
  decimal y hexadecimal.

El motor de cálculo del backend está construido con **POO**:

- `Calculadora`: operaciones básicas y científicas, memoria e historial.
- `CalculadoraComercial(Calculadora)`: **hereda** de `Calculadora` y
  agrega IVA, descuentos y márgenes.
- `ConversorBases`: clase independiente para convertir números entre
  bases numéricas.

---

## 📁 Estructura del proyecto

```
calculadora_pro/
├── app.py                 # Aplicación Flask + clases POO del motor de cálculo
├── requirements.txt        # Dependencias del proyecto
├── .gitignore               # Archivos que no deben subirse a GitHub
├── LICENSE                  # Licencia MIT (software libre)
├── README.md
├── templates/
│   └── index.html          # Vista principal (presentación + calculadora)
└── static/
    ├── css/
    │   └── styles.css       # Estilos visuales
    └── js/
        └── app.js           # Lógica interactiva de la calculadora
```

---

## ⚙️ Instalación y ejecución

### 1. Clonar o descargar el proyecto
```bash
git clone <URL-del-repositorio>
cd calculadora_pro
```

### 2. Crear el entorno virtual
```bash
python3 -m venv venv
```

### 3. Activar el entorno virtual
- **Windows (PowerShell):**
  ```bash
  .\venv\Scripts\Activate.ps1
  ```
- **macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```
Cuando el entorno esté activo verás `(venv)` al inicio de la terminal.

### 4. Instalar las dependencias
```bash
pip install -r requirements.txt
```

### 5. Ejecutar la aplicación
```bash
python app.py
```

### 6. Abrir en el navegador
```
http://127.0.0.1:5000
```

---

## 🧠 ¿Cómo funciona el código?

1. **`app.py`** crea la instancia de Flask y define:
   - La ruta principal `/` que renderiza `templates/index.html` con
     `render_template()`.
   - Las clases `Calculadora`, `CalculadoraComercial` y
     `ConversorBases` (ver detalle arriba).
   - Rutas de API en JSON:
     - `/api/cientifica` — raíz, cuadrado, seno, coseno, tangente,
       ln, log, factorial.
     - `/api/calcular` — IVA, descuento, margen.
     - `/api/convertir` — conversión entre bases numéricas.
     - `/api/memoria` — M+, M-, MR, MC.
     - `/api/historial` — historial de operaciones del servidor.

2. **`templates/index.html`** presenta el proyecto (qué es, qué
   incluye, por qué es software libre) y la calculadora con sus tres
   pestañas.

3. **`static/css/styles.css`** define la identidad visual: colores,
   tipografía, tarjetas, layout responsive y modo oscuro.

4. **`static/js/app.js`** maneja la interacción:
   - Las operaciones básicas (+, -, ×, ÷, %) se calculan en el
     navegador para que sean instantáneas.
   - Las funciones científicas más complejas, los cálculos de
     finanzas y la conversión de bases se envían al backend Flask
     mediante `fetch()`, que usa las clases POO para resolver y
     devuelve el resultado en JSON.
   - El botón de tema (🌙/☀️) guarda la preferencia en `localStorage`.
   - El historial combina operaciones locales y las que pasaron por
     el servidor.

---

## 🧾 Actualizar requirements.txt

Si instalas o cambias paquetes dentro del entorno virtual:
```bash
pip freeze > requirements.txt
```

---

## Equipo 

Este trabajo fue realizado por Rafael Rodriguez, Benjamin Vergara, Eric Araya y Maximiliano Pacheco. 4H