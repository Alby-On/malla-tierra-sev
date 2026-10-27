# Malla a Tierra · SEV Schlumberger

Aplicación web para calcular la **resistencia proyectada de una malla de puesta a tierra** a partir de un sondeo eléctrico vertical (SEV) con configuración Schlumberger, siguiendo el procedimiento del curso:

Schlumberger → hoja log-log de 62,5 mm/década → curvas patrón Orellana-Mooney → Burgsdorf-Yakobs → Schwarz

## Uso

Abre `index.html` en el navegador (no necesita instalación ni internet, salvo las fuentes tipográficas). También se puede publicar con GitHub Pages.

1. **Mediciones**: ingresa entre 13 y 16 lecturas (L = AB/2, s = MN completo, V/I). Se calculan K, ρa y las coordenadas X/Y en mm para AutoCAD. Se puede pegar desde Excel.
2. **Homologación**: la curva de campo se compara con unas 1.500 curvas patrón de 2 y 3 capas y se ubica la cruz de campo (Ec, ρc en mm). Luego se ajusta el modelo para 2, 3 y 4 capas. Incluye un modo manual para ingresar la familia y las cotas obtenidas en AutoCAD.
3. **Modelo de suelo**: capas, espesores y resistividades.
4. **Malla**: largo, ancho, cuadrícula, profundidad, sección y diámetro del conductor, unión apernada o soldada.
5. **Resultado**: resistividad equivalente (Burgsdorf-Yakobs), resistencia de la malla (Schwarz), referencia Laurent-Niemann y verificación térmica de la sección (Onderdonk).

## Fórmulas

- ρa = π · (V/I) · [(L/s)² − 0,25] · s
- X = log10(10·L) · 62,5 · Y = log10(ρa) · 62,5
- Burgsdorf-Yakobs: r = √(S/π), r0² = r² − b², q0² = 2r(r + b), vi² = ½[zi² + q0² + r0² − √((zi² + q0² + r0²)² − 4q0²r0²)], Fi = √(1 − vi²/r0²), ρeq = Fn / Σ (Fi − Fi−1)/ρi
- Schwarz: R = ρeq/(π·Lt) · [ln(2Lt/h') + k1·Lt/√S − k2], h' = √(d·h); k1 y k2 según IEEE 80

Las curvas teóricas se calculan con la transformada de resistividad de Pekeris y un filtro digital de Hankel (Key, 201 puntos).

## Estructura

```
index.html                 aplicación lista para usar (generada)
build.py                   genera index.html desde src/
src/app.template.html      interfaz
src/engine.js              motor de cálculo
src/filt.json              coeficientes del filtro de Hankel
src/test-ejemplo-6-1.js    prueba con el ejemplo 6.1 de la guía (node src/test-ejemplo-6-1.js)
```

Después de modificar `src/`, ejecutar `python3 build.py`.

## Supuestos a revisar

- k1 y k2 de Schwarz se interpolan de las curvas IEEE 80 (h = 0, √S/10 y √S/6).
- Temperatura máxima de la unión por defecto: 250 °C apernada y 450 °C soldada (editable).
- Se calcula solo el reticulado, sin barras verticales.
