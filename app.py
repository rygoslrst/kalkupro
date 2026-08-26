"""
Kalku — Calculadora Libre
--------------------------------
Aplicación web construida con Flask y Programación Orientada a Objetos.
Proyecto de software libre: cualquiera puede usarlo, leerlo, modificarlo
y compartirlo (ver LICENSE).

Autor: Equipo 4H - Evaluación I de Programación Orientada a Objeto
"""

from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)


# ---------------------------------------------------------------------------
# MODELO (POO): motor de cálculo
# ---------------------------------------------------------------------------
class Calculadora:
    """Clase base: operaciones matemáticas básicas y científicas.

    Encapsula el estado (memoria + historial) y centraliza el registro
    de cada operación, para que las vistas de Flask no tengan que
    preocuparse de la lógica matemática.
    """

    def __init__(self):
        self.memoria = 0.0
        self.historial = []

    # -- utilidades internas -------------------------------------------------
    def _registrar(self, expresion, resultado):
        self.historial.append({"expresion": expresion, "resultado": resultado})
        # Solo conservamos las últimas 20 operaciones en memoria del servidor
        self.historial = self.historial[-20:]
        return resultado

    # -- operaciones básicas --------------------------------------------------
    def sumar(self, a, b):
        return self._registrar(f"{a} + {b}", a + b)

    def restar(self, a, b):
        return self._registrar(f"{a} - {b}", a - b)

    def multiplicar(self, a, b):
        return self._registrar(f"{a} × {b}", a * b)

    def dividir(self, a, b):
        if b == 0:
            raise ValueError("No es posible dividir por cero")
        return self._registrar(f"{a} ÷ {b}", a / b)

    def potencia(self, a, b):
        return self._registrar(f"{a} ^ {b}", math.pow(a, b))

    # -- operaciones científicas ---------------------------------------------
    def raiz_cuadrada(self, a):
        if a < 0:
            raise ValueError("No existe raíz real de un número negativo")
        return self._registrar(f"√{a}", math.sqrt(a))

    def al_cuadrado(self, a):
        return self._registrar(f"{a}²", a ** 2)

    def porcentaje(self, a, b):
        """a% de b"""
        return self._registrar(f"{a}% de {b}", (a / 100) * b)

    def logaritmo(self, a):
        if a <= 0:
            raise ValueError("El logaritmo requiere un número mayor que cero")
        return self._registrar(f"log({a})", math.log10(a))

    def logaritmo_natural(self, a):
        if a <= 0:
            raise ValueError("El logaritmo natural requiere un número mayor que cero")
        return self._registrar(f"ln({a})", math.log(a))

    def seno(self, a):
        return self._registrar(f"sen({a}°)", math.sin(math.radians(a)))

    def coseno(self, a):
        return self._registrar(f"cos({a}°)", math.cos(math.radians(a)))

    def tangente(self, a):
        if (a - 90) % 180 == 0:
            raise ValueError("La tangente no está definida en ese ángulo")
        return self._registrar(f"tan({a}°)", math.tan(math.radians(a)))

    def factorial(self, a):
        if a < 0 or a != int(a):
            raise ValueError("El factorial solo existe para enteros no negativos")
        if a > 170:
            raise ValueError("El número es demasiado grande para calcular su factorial")
        return self._registrar(f"{int(a)}!", math.factorial(int(a)))

    # -- memoria --------------------------------------------------------------
    def memoria_sumar(self, valor):
        self.memoria += valor
        return self.memoria

    def memoria_restar(self, valor):
        self.memoria -= valor
        return self.memoria

    def memoria_recuperar(self):
        return self.memoria

    def memoria_limpiar(self):
        self.memoria = 0.0
        return self.memoria


class CalculadoraComercial(Calculadora):
    """Subclase con cálculos útiles del día a día: IVA, descuentos y
    márgenes. Hereda memoria + historial de Calculadora.
    """

    IVA_DEFECTO = 19  # % IVA usado como valor por defecto (Chile)

    def calcular_iva(self, neto, tasa=None):
        tasa = self.IVA_DEFECTO if tasa is None else tasa
        iva = neto * (tasa / 100)
        total = neto + iva
        return self._registrar(
            f"IVA {tasa}% sobre ${neto:,.0f}",
            {"neto": neto, "iva": round(iva, 2), "total": round(total, 2)},
        )

    def aplicar_descuento(self, precio, porcentaje_descuento):
        descuento = precio * (porcentaje_descuento / 100)
        precio_final = precio - descuento
        return self._registrar(
            f"Descuento {porcentaje_descuento}% sobre ${precio:,.0f}",
            {
                "descuento": round(descuento, 2),
                "precio_final": round(precio_final, 2),
            },
        )

    def calcular_margen(self, costo, precio_venta):
        if precio_venta == 0:
            raise ValueError("El precio de venta no puede ser cero")
        ganancia = precio_venta - costo
        margen = (ganancia / precio_venta) * 100
        return self._registrar(
            f"Margen sobre costo ${costo:,.0f} / venta ${precio_venta:,.0f}",
            {"ganancia": round(ganancia, 2), "margen_pct": round(margen, 2)},
        )


class ConversorBases:
    """Clase independiente que convierte números entre distintas bases
    numéricas (binario, octal, decimal, hexadecimal). Se mantiene
    separada de Calculadora porque resuelve un problema distinto:
    representación de números, no operaciones aritméticas.
    """

    BASES_VALIDAS = (2, 8, 10, 16)
    PREFIJOS = {2: "0b", 8: "0o", 16: "0x"}

    def convertir(self, numero_texto, base_origen, base_destino):
        if base_origen not in self.BASES_VALIDAS or base_destino not in self.BASES_VALIDAS:
            raise ValueError("Base numérica no soportada (usa 2, 8, 10 o 16)")

        try:
            valor_decimal = int(str(numero_texto).strip(), base_origen)
        except ValueError:
            raise ValueError("Ese número no es válido en la base de origen elegida")

        if base_destino == 2:
            resultado = bin(valor_decimal)[2:]
        elif base_destino == 8:
            resultado = oct(valor_decimal)[2:]
        elif base_destino == 16:
            resultado = hex(valor_decimal)[2:].upper()
        else:
            resultado = str(valor_decimal)

        return {"decimal": valor_decimal, "resultado": resultado}


# Instancias del motor: se mantienen mientras el servidor de desarrollo
# esté corriendo (suficiente para esta evaluación).
motor = CalculadoraComercial()
conversor = ConversorBases()


# ---------------------------------------------------------------------------
# RUTAS / VISTAS
# ---------------------------------------------------------------------------
@app.route("/")
def inicio():
    """Vista principal: presentación del proyecto + calculadora interactiva."""
    return render_template("index.html")


@app.route("/api/cientifica", methods=["POST"])
def api_cientifica():
    """Operaciones científicas de un solo valor: raíz, cuadrado, seno,
    coseno, tangente, ln, factorial.

    Recibe JSON: {"operacion": "seno", "valor": 30}
    """
    datos = request.get_json(silent=True) or {}
    operacion = datos.get("operacion")

    try:
        valor = float(datos.get("valor", 0))

        funciones = {
            "raiz": motor.raiz_cuadrada,
            "cuadrado": motor.al_cuadrado,
            "seno": motor.seno,
            "coseno": motor.coseno,
            "tangente": motor.tangente,
            "ln": motor.logaritmo_natural,
            "log": motor.logaritmo,
            "factorial": motor.factorial,
        }

        if operacion not in funciones:
            return jsonify({"ok": False, "error": "Operación científica no reconocida"}), 400

        resultado = funciones[operacion](valor)
        return jsonify({"ok": True, "resultado": resultado})

    except ValueError as error:
        return jsonify({"ok": False, "error": str(error)}), 400
    except (TypeError, KeyError):
        return jsonify({"ok": False, "error": "Datos inválidos"}), 400


@app.route("/api/calcular", methods=["POST"])
def api_calcular():
    """Endpoint usado por el modo 'Finanzas' de la calculadora.

    Recibe JSON: {"operacion": "iva" | "descuento" | "margen", "valores": {...}}
    """
    datos = request.get_json(silent=True) or {}
    operacion = datos.get("operacion")
    valores = datos.get("valores", {})

    try:
        if operacion == "iva":
            resultado = motor.calcular_iva(
                float(valores.get("neto", 0)),
                float(valores.get("tasa", motor.IVA_DEFECTO)),
            )
        elif operacion == "descuento":
            resultado = motor.aplicar_descuento(
                float(valores.get("precio", 0)),
                float(valores.get("porcentaje", 0)),
            )
        elif operacion == "margen":
            resultado = motor.calcular_margen(
                float(valores.get("costo", 0)),
                float(valores.get("precio_venta", 0)),
            )
        else:
            return jsonify({"error": "Operación no reconocida"}), 400

        return jsonify({"ok": True, "resultado": resultado})

    except ValueError as error:
        return jsonify({"ok": False, "error": str(error)}), 400
    except (TypeError, KeyError):
        return jsonify({"ok": False, "error": "Datos inválidos"}), 400


@app.route("/api/convertir", methods=["POST"])
def api_convertir():
    """Convierte un número entre bases numéricas usando ConversorBases."""
    datos = request.get_json(silent=True) or {}

    try:
        resultado = conversor.convertir(
            datos.get("numero", ""),
            int(datos.get("base_origen", 10)),
            int(datos.get("base_destino", 10)),
        )
        return jsonify({"ok": True, "resultado": resultado})
    except ValueError as error:
        return jsonify({"ok": False, "error": str(error)}), 400
    except (TypeError, KeyError):
        return jsonify({"ok": False, "error": "Datos inválidos"}), 400


@app.route("/api/historial")
def api_historial():
    """Devuelve el historial de operaciones registradas en el servidor."""
    return jsonify({"historial": motor.historial, "memoria": motor.memoria})


@app.route("/api/memoria", methods=["POST"])
def api_memoria():
    """Operaciones de memoria compartidas (M+, M-, MR, MC)."""
    datos = request.get_json(silent=True) or {}
    accion = datos.get("accion")
    valor = float(datos.get("valor", 0))

    if accion == "sumar":
        resultado = motor.memoria_sumar(valor)
    elif accion == "restar":
        resultado = motor.memoria_restar(valor)
    elif accion == "recuperar":
        resultado = motor.memoria_recuperar()
    elif accion == "limpiar":
        resultado = motor.memoria_limpiar()
    else:
        return jsonify({"error": "Acción de memoria no reconocida"}), 400

    return jsonify({"memoria": resultado})


if __name__ == "__main__":
    app.run(debug=True)
