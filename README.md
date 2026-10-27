# Malla a Tierra · SEV Schlumberger

Aplicación web para calcular la **resistencia proyectada de una malla de puesta a tierra** a partir de un sondeo eléctrico vertical (SEV) con configuración Schlumberger, siguiendo el procedimiento del curso:

Schlumberger → hoja log-log de 62,5 mm/década → curvas patrón Orellana-Mooney → Burgsdorf-Yakobs → Schwarz

## Uso

La aplicación tiene un menú principal con tres vistas:

- **Principal** (`#principal`): primero se elige el nivel de tensión (BT, MT o AT) y el programa muestra solo lo que hay que completar para ese nivel; luego el cálculo en 5 pasos.
- **Métodos de medición** (`#metodos`): cómo se realizan Schlumberger, Wenner y caída de potencial.
- **Instrucciones** (`#instrucciones`): presentación, consideraciones, paso a paso y nota sobre láminas y escala.

Abre `index.html` en el navegador (no necesita instalación ni internet, salvo las fuentes tipográficas). También se puede publicar con GitHub Pages.

0. **Cómo medir en terreno**: menú con un método por pestaña. **Schlumberger** (disposición, procedimiento, MN ≤ AB/5, empalmes y tabla de aberturas que se carga en el paso 1), **Wenner** (procedimiento, fórmulas simple y completa con profundidad de electrodos, tabla de separaciones) y **caída de potencial** para medir la puesta a tierra construida (distancias calculadas con el diseño del paso 4, RIC N°06 Anexo 6.3).
1. **Mediciones**: método **Schlumberger** (L = AB/2, s = MN completo, V/I) o **Wenner** (a, profundidad p de los electrodos, R; fórmula completa de la planilla), de 12 a 20 lecturas. Con Wenner el modelo de capas sale del ajuste fino con el cálculo exacto de esa configuración, porque las láminas de Orellana-Mooney son Schlumberger. Se calculan K, ρa y las coordenadas X/Y en mm para AutoCAD. Se puede pegar desde Excel.
2. **Homologación**: la curva de campo se compara con todas las familias de las láminas Orellana-Mooney (lámina 1 de 2 capas; H-1 a H-25, K-1 a K-25, Q-1 a Q-13, A-1 a A-13; y las familias de 4 capas HK, HA, KH, KQ, QH, QQ, AK, AA), unas 1.500 curvas en total, y se ubica la cruz de campo (Ec, ρc en mm). Luego se ajusta el modelo para 2, 3 y 4 capas. Incluye un modo manual: eliges lámina, familia y curva, ingresas las cotas de AutoCAD y el programa dibuja la familia completa sobre tus datos.
3. **Modelo de suelo**: capas, espesores y resistividades.
4. **Diseño**: nivel de tensión según la SEC (RPTD N°02, sección 4): **baja** (hasta 1 kV), **media** (sobre 1 y hasta 23 kV) y **alta** (sobre 23 y hasta 230 kV). En baja tensión se elige **malla a tierra** o **electrodo** de barra. La **cuadrícula se calcula automáticamente**: el programa prueba todas las retículas que dividen exacto el largo y el ancho (entre 2,5 y 10 m, o desde 1 m si el lado mide menos de 5 m), evalúa cada una con Schwarz y, en MT y AT, con las tensiones de contacto y de paso, y elige la que cumple con menos conductor. Si ninguna cumple, busca el tamaño mínimo de malla que sí cumple y lo ofrece. Se puede desactivar para ingresar la cuadrícula a mano. En media tensión se ingresan la red (ST, VL, Icc3φ, Icc1φ), la corriente auxiliar y la curva del fusible. En alta tensión, la red, el tiempo de la protección de respaldo y los factores Sf y Df. En media y alta tensión se ingresan además el peso de la persona y la capa de gravilla.
5. **Resultado**: resistividad equivalente (Burgsdorf-Yakobs); con Schwarz, la resistencia de la malla R₁, de las barras R₂, la mutua Rm y la total RT; verificación del diseño por nivel. En media y alta tensión: reactancias de la red, resistencia máxima, corriente real de falla, tiempo de operación del fusible, sección mínima y tensiones de contacto y de paso (IEEE Std 80-2013).

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
- Diámetro del conductor: d = √(4·S/π) (25 mm² → 5,64 mm); Lc = (b/D + 1)·a + (a/D + 1)·b; a′ = √(d·h)
- K₁ = 1,43 − 2,3·h/√A − 0,044·x; K₂ = 5,50 − 8·h/√A + (0,15 − h/√A)·x; x = a/b; válido para h/√A ≤ 0,167
- Malla: R₁ = ρeq/(π·Lc) · [ln(2·Lc/a′) + K₁·Lc/√A − K₂]
- Barras: R₂ = ρeq/(2π·n·Lb) · [ln(4·Lb/rb) − 1 + 2·K₁·(Lb/√A)·(√n − 1)²]
- Mutua: Rm = ρeq/(π·Lc) · [ln(2·Lc/Lb) + K₁·Lc/√A − K₂ + 1]
- Total: RT = (R₁·R₂ − Rm²) / (R₁ + R₂ − 2·Rm)
- Electrodo (barra sola): R = ρ/(2π·Lb) · [ln(4·Lb/rb) − 1], con ρ ponderada de las capas que atraviesa la barra (o manual)
- Corriente real de falla: If1φ = 3·VL / [√3·√((3·RT)² + ΣX²)]
- Red: X₁ = X₂ = VL/(√3·Icc3φ); X₀ = 3·VL/(√3·Icc1φ) − (X₁ + X₂); fusible de arranque IA = 1,5·ST/(√3·VL)
- Resistencia máxima (MT): Rmáx = ⅓·√(3·VL²/If aux² − ΣX²); Rdiseño = menor entre Rmáx y 20 Ω
- Sección mínima: Smín = K·If·FD·√t/1973, K = √(33/log10((Tm − Ta)/(234 + Ta) + 1)); exotérmica 1083 °C (K 6,96), apernada 250 °C (K 11,56)
- Tolerables: Ec = (1000 + 1,5·Cs·ρs)·k/√t; Ep = (1000 + 6·Cs·ρs)·k/√t; k = 0,116 (50 kg) o 0,157 (70 kg); Cs = 1 − 0,09·(1 − ρ/ρs)/(2hs + 0,09)
- IEEE 80-2013: n = na·nb; Km, Ks, Ki = 0,644 + 0,148·n; LM, LS; Em = ρeq·Km·Ki·IG/LM; Es = ρeq·Ks·Ki·IG/LS

Las curvas teóricas se calculan con la transformada de resistividad de Pekeris y un filtro digital de Hankel (Key, 201 puntos).

## Verificación normativa SEC (Pliego RIC N°06)

Al final del paso 5 el programa revisa los requisitos del pliego que se pueden comprobar con los datos ingresados:

| Requisito | Referencia RIC N°06 |
|---|---|
| Sondeo con alas de hasta 100 m (50 m aceptable); si se reduce por falta de espacio queda como "revisar" | Anexo 6.6 |
| Método Schlumberger o Wenner | Anexo 6.6 |
| Conductor desnudo de 25 mm² como mínimo | 8.7 |
| Profundidad de la malla de 0,5 m como mínimo | 8.11 |
| Uniones enterradas con soldadura exotérmica o conector apto para enterrar (IEEE 837) | 7.11 |
| Tiempo de exposición a la falla de 0,5 s como máximo | 8.8 |
| Resistencia de servicio de 20 Ω como máximo con neutralización TN; con falla permanente ningún conductor activo a más de 250 V respecto de tierra | 6.1 |
| Hasta 80 Ω en BT con neutralización: ≤ 10 kW con interruptor omnipolar y diferenciales 300/30 mA, o disyuntor que corta el neutro con protección de sobretensión (UNE-EN 50550, IEC 61643-11) | 6.2.1, 6.2.2 |
| Hasta 5 Ω (resistencia combinada del neutro) en redes internas con subestación MT propia | 6.7.3 |
| Resistencia de protección R ≤ Vs / I0 | 7.3 |
| Distancias para la medición de verificación por caída de potencial (6 × diagonal, 62 %) | Anexo 6.3 |

En media y alta tensión se agregan:

| Requisito | Referencia |
|---|---|
| Resistencia ≤ Rdiseño (menor entre Rmáx y 20 Ω) en MT | Guía de resistencia máxima, RIC N°06 |
| Resistencia ≤ 20 Ω en AT | RPTD N°06, 8.27 |
| Corriente real de falla mayor que If aux y despeje ≤ 0,5 s | Guía, RIC N°06 8.8 |
| Sección ≥ mayor entre la térmica y 25 mm² | Guía, RIC N°06 8.7 / RPTD N°06 8.14 |
| Tensiones de contacto y de paso ≤ tolerables (50 o 70 kg, con o sin gravilla) | IEEE Std 80-2013, RPTD N°06 8.25 |
| Rango de validez de IEEE 80-2013 | n ≤ 25, 0,25 ≤ h ≤ 2,5 m, d < 0,25·h, D ≥ 2,5 m |

## Estructura

```
index.html                 aplicación lista para usar (generada)
build.py                   genera index.html desde src/
src/app.template.html      interfaz
src/engine.js              motor de cálculo
src/filt.json              coeficientes del filtro de Hankel
src/catalog.json           familias de las láminas Orellana-Mooney (lámina, nombre, razones)
src/test-ejemplo-6-1.js    prueba con el ejemplo 6.1 de la guía SEV (node src/test-ejemplo-6-1.js)
src/test-guia-schwarz.js   prueba con los ejemplos 9.1 y 9.2 de la guía de Schwarz
src/test-guias-mt.js       prueba con las guías de resistencia máxima en MT y de tensiones de contacto y paso
```

Después de modificar `src/`, ejecutar `python3 build.py`.

## Supuestos a revisar

- Temperatura máxima de la unión por defecto: 1083 °C soldada exotérmica, 250 °C compresión y apernada, como en la guía (editable).
- Electrodo: la resistividad ponderada de las capas que atraviesa la barra es un criterio del programa; se puede reemplazar por un valor manual.
- Alta tensión (RPTD N°06, Res. Ex. 33.277/2020): IEEE 80-2013 (8.25), 20 Ω (8.27), mayor corriente de falla a tierra previsible (8.12) y ts entre el despeje de la NTSyCS y el tiempo de la protección de respaldo (sección 5). Sf y Df son los factores de IEEE 80-2013 para la corriente IG.
- Media tensión (RIC N°06, Res. Ex. 33.877/2020): tensiones de paso y contacto obligatorias con transformador de MT (Anexo 6.1); opción de tierra de servicio con subestación propia, con límite de 5 Ω (6.7.3); unión o separación de tierras MT/BT según la sección 10: Vca = K/tⁿ (K = 72 y n = 1 entre 0,1 y 0,9 s; K = 38 y n = 0,18 entre 0,9 y 3 s; 64 V entre 3 y 5 s; 50 V sobre 5 s), Rt máx. para unir = Vca/Id, U = 600 V (TT, despeje ≤ 5 s) o 250 V, U < 2·Ec tolerable en TN, y D = ρ·Id/(2π·U). Las expresiones de Rt y D vienen como imagen en la copia digital del pliego; se usan las del texto de origen y conviene confirmarlas en el PDF impreso. Los valores K = 38 y n = 0,18 son los que publica el RIC N°06.
- Fusibles de media tensión incluidos: tipos **K** (rápido) y **T** (lento) de 1 a 100 A y **Standard** (intermedio K/T) de 1 a 100 A, con la banda de fusión normalizada a 300, 10 y 0,1 s (ANSI C37.43, según la especificación técnica ET-211 de EPEC); el 10K Hubbell de la guía con curva de despeje; y una opción personalizada para la curva del fabricante. El programa sugiere el menor calibre mayor o igual que IA = 1,5·ST/(√3·VL).
- La norma de fusibles no fija la curva de despeje total: con las bandas ANSI se usa la corriente máxima de fusión como referencia de operación. Para el tiempo exacto se ingresa la curva de despeje del fabricante (opción personalizada). Los calibres 12, 20, 140 y 200 A y el tipo H no se incluyen por no contar con una fuente verificada; se pueden ingresar como curva personalizada.
- Con retículas distintas en cada dirección, las tensiones usan la mayor como D (lado seguro).
- La lámina 36 (A-4 y A-5) no viene en el PDF usado, así que esas familias no están en el catálogo.
- En las familias de 4 capas se usan las 20 combinaciones E2-E3 de las láminas (A a T: E2 = 1, 2, 3, 5 y E3 = 1, 3, 5, 10, 25).
