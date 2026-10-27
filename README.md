# Malla a Tierra · SEV Schlumberger

Aplicación web para calcular la **resistencia proyectada de una malla de puesta a tierra** a partir de un sondeo eléctrico vertical (SEV) con configuración Schlumberger, siguiendo el procedimiento del curso:

Schlumberger → hoja log-log de 62,5 mm/década → curvas patrón Orellana-Mooney → Burgsdorf-Yakobs → Schwarz

## Uso

Abre `index.html` en el navegador (no necesita instalación ni internet, salvo las fuentes tipográficas). También se puede publicar con GitHub Pages.

1. **Mediciones**: ingresa entre 13 y 16 lecturas (L = AB/2, s = MN completo, V/I). Se calculan K, ρa y las coordenadas X/Y en mm para AutoCAD. Se puede pegar desde Excel.
2. **Homologación**: la curva de campo se compara con todas las familias de las láminas Orellana-Mooney (lámina 1 de 2 capas; H-1 a H-25, K-1 a K-25, Q-1 a Q-13, A-1 a A-13; y las familias de 4 capas HK, HA, KH, KQ, QH, QQ, AK, AA), unas 1.500 curvas en total, y se ubica la cruz de campo (Ec, ρc en mm). Luego se ajusta el modelo para 2, 3 y 4 capas. Incluye un modo manual: eliges lámina, familia y curva, ingresas las cotas de AutoCAD y el programa dibuja la familia completa sobre tus datos.
3. **Modelo de suelo**: capas, espesores y resistividades.
4. **Malla**: largo, ancho, cuadrícula, profundidad, sección y diámetro del conductor, unión apernada o soldada.
5. **Resultado**: resistividad equivalente (Burgsdorf-Yakobs), resistencia de la malla (Schwarz), referencia Laurent-Niemann y verificación térmica de la sección (Onderdonk).

## Módulo de 62,5 mm por década y reescalado de las láminas

La planilla y el programa trabajan con 62,5 mm por década. Las láminas del PDF de curvas patrón no vienen a esa escala: medidas sobre el PDF, las láminas 1 a 41 tienen 62,8 mm por década y las láminas 42 a 66 (4 capas) unos 62,6 mm.

- Factor para llevar una lámina de 62,8 a 62,5: **62,5 / 62,8 = 0,99522**.
- Factor para las láminas de 4 capas: 62,5 / 62,58 = 0,99872.
- En AutoCAD: `ESCALA` → seleccionar la lámina → punto base → `R` (Referencia) → 62.8 → 62.5.

Las curvas que dibuja el programa se calculan directamente a 62,5 mm por década, así que no necesitan reescalado. Se compararon con la lámina 1 del PDF y coinciden con un desvío medio de 0,02 mm.

## Fórmulas

- ρa = π · (V/I) · [(L/s)² − 0,25] · s
- X = log10(10·L) · 62,5 · Y = log10(ρa) · 62,5
- Burgsdorf-Yakobs: r = √(S/π), r0² = r² − b², q0² = 2r(r + b), vi² = ½[zi² + q0² + r0² − √((zi² + q0² + r0²)² − 4q0²r0²)], Fi = √(1 − vi²/r0²), ρeq = Fn / Σ (Fi − Fi−1)/ρi
- Schwarz: R = ρeq/(π·Lt) · [ln(2Lt/h') + k1·Lt/√S − k2], h' = √(d·h); k1 = 1,43 − 2,3·h/√S − 0,044·x; k2 = 5,50 − 8·h/√S + (0,15 − h/√S)·x; x = largo/ancho

Las curvas teóricas se calculan con la transformada de resistividad de Pekeris y un filtro digital de Hankel (Key, 201 puntos).

## Verificación normativa SEC (Pliego RIC N°06)

Al final del paso 5 el programa revisa los requisitos del pliego que se pueden comprobar con los datos ingresados:

| Requisito | Referencia RIC N°06 |
|---|---|
| Sondeo con alas de hasta 100 m (50 m aceptable, 30 m solo en condiciones extremas) | Anexo 6.6 |
| Método Schlumberger o Wenner | Anexo 6.6 |
| Conductor desnudo de 25 mm² como mínimo | 8.7 |
| Profundidad de la malla de 0,5 m como mínimo | 8.11 |
| Uniones enterradas con soldadura exotérmica o conector apto para enterrar (IEEE 837) | 7.11 |
| Tiempo de exposición a la falla de 0,5 s como máximo | 8.8 |
| Resistencia de servicio de 20 Ω como máximo, o de protección R ≤ Vs / I0 | 6.1, 7.3 |
| Distancias para la medición de verificación por caída de potencial (6 × diagonal, 62 %) | Anexo 6.3 |

Pendiente: tensiones de paso y de contacto (Anexo 6.1, IEEE 80) y barras verticales.

## Estructura

```
index.html                 aplicación lista para usar (generada)
build.py                   genera index.html desde src/
src/app.template.html      interfaz
src/engine.js              motor de cálculo
src/filt.json              coeficientes del filtro de Hankel
src/catalog.json           familias de las láminas Orellana-Mooney (lámina, nombre, razones)
src/test-ejemplo-6-1.js    prueba con el ejemplo 6.1 de la guía (node src/test-ejemplo-6-1.js)
```

Después de modificar `src/`, ejecutar `python3 build.py`.

## Supuestos a revisar

- Temperatura máxima de la unión por defecto: 450 °C soldada, 250 °C compresión y apernada (editable).
- Se calcula solo el reticulado, sin barras verticales.
- La lámina 36 (A-4 y A-5) no viene en el PDF usado, así que esas familias no están en el catálogo.
- En las familias de 4 capas se usan las 20 combinaciones E2-E3 de las láminas (A a T: E2 = 1, 2, 3, 5 y E3 = 1, 3, 5, 10, 25).
