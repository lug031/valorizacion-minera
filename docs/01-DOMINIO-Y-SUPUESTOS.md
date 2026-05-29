# Fase 1 — Dominio y supuestos

## Resumen del producto

App Android privada (APK sideload) para **valorización minera offline** en campo. Replica la lógica de un Excel existente: entrada manual, cálculos automáticos, historial local, comparación de escenarios y exportación PDF.

---

## Entidades conceptuales

| Concepto | Descripción |
|----------|-------------|
| **Valorización** | Un cálculo completo con código único, fecha, tipo MAT, datos de lote y resultados |
| **Escenario** | Variante de parámetros comerciales (maquila, RC, consumos, etc.) dentro de una valorización |
| **Configuración** | Tablas editables offline: tipos MAT, rangos maquila, defaults por proveedor, FACTOR, RC |
| **Proveedor/Cliente** | Entidad comercial que puede tener defaults (consumos, flete, RC) |
| **Usuario** | Operador en campo con rol y sesión local segura |

---

## Flujo de uso (MVP)

1. Login → sesión local (sin internet).
2. Nueva valorización → código + fecha.
3. Selección tipo MAT, proveedor (opcional), datos de lote (TMH, H2O, leyes, REC%).
4. La app calcula TMS, sugiere maquila, aplica defaults editables.
5. Hasta 3 escenarios comparativos (A/B/C).
6. Guardar en SQLite.
7. Exportar PDF.
8. Consultar historial con filtros.

---

## Reglas confirmadas (alta confianza)

### TMS
```
TMS = floor(TMH - (TMH * H2O / 100), 3 decimales)
```
- `floor` = redondeo hacia abajo (truncar hacia −∞ en positivos equivale a truncar decimales).
- Si TMH o H2O inválidos → TMS vacío o 0 (definir en validación).

### Conversión de ley
```
oz/tc = gr/tm / 34.28571
gr/tm = oz/tc * 34.28571
```
- El motor interno trabajará en **oz/tc** para maquila y fórmulas AU, convirtiendo al vuelo si el usuario ingresa gr/tm.

### Tabla de maquila (ley oro en oz/tc)
Rangos inclusivos por extremo inferior y superior según tabla proporcionada; si ley > 2.000 (último rango 1.901–2.000) → sugerir **190**.

### Valor total
```
valor_compra_final_x_tms = valor_au_x_tms + valor_ag_x_tms
valor_compra_total = valor_compra_final_x_tms * TMS
```

### Escenarios
Mínimo 3 por valorización; cada uno puede variar: maquila, RC, consumos, flete, inter, otros costos → recalcula resultado.

### Código único
Componentes sugeridos: prefijo usuario + fecha (YYYYMMDD) + hora (HHmm) + correlativo local o sufijo aleatorio corto. Debe ser **buscable** en historial.

---

## Ambigüedades críticas — REQUIEREN CONFIRMACIÓN CON EXCEL

> **Sin el archivo Excel no se debe implementar el motor de cálculo final.** Lo siguiente son **supuestos propuestos** marcados explícitamente.

### A1. Orden de operaciones — Valor compra AU x TMS

Texto del requerimiento (orden narrativo):
1. INTER (oro)
2. − RC
3. × ley oro (oz/tc)
4. × REC %
5. − MAQUILA
6. × FACTOR
7. − CONSUMOS
8. − FLETE
9. − OTROS COSTOS
10. Redondeo 2 decimales

**Supuesto propuesto (A)** — evaluación izquierda a derecha con paréntesis explícitos:
```
raw = (((((INTER - RC) * ley_oz) * rec_factor) - MAQUILA) * FACTOR) - CONSUMOS) - FLETE) - OTROS
valor_au_x_tms = round2(raw)
```
donde `rec_factor = REC / 100` si REC se ingresa como 85 para 85%.

**Alternativas comunes en Excel (B, C)**:
- **(B)** MAQUILA se resta *después* del factor: `(((INTER - RC) * ley * rec) * FACTOR) - MAQUILA - CONSUMOS - ...`
- **(C)** RC se aplica sobre el producto: `(INTER * ley * rec - RC) * FACTOR - ...`

**Acción:** Comparar 2–3 filas reales del Excel con la app antes de cerrar el motor.

---

### A2. Fórmula Valor compra AG x TMS

Requerimiento:
- INTER plata − RC plata
- × ley plata
- × REC %
- × FACTOR (o “factor comercial que corresponda”)
- Redondeo 2 decimales
- **No** menciona restar MAQUILA, CONSUMOS, FLETE para plata.

**Supuesto propuesto:**
```
valor_ag_x_tms = round2((((INTER_ag - RC_ag) * ley_ag_oz) * rec_factor) * FACTOR_ag)
```
- `FACTOR_ag` = mismo FACTOR global salvo que configuración diga otro.
- Costos compartidos (maquila, consumos, flete, otros) **solo en AU** salvo confirmación contraria.

**Pregunta:** ¿El Excel resta maquila/consumos/flete una vez en AU y AG es “addon”, o hay columna combinada?

---

### A3. Formato de REC %

**Supuesto:** Usuario ingresa `85` meaning 85% → en fórmulas usar `0.85`.

**Alternativa:** Usuario ingresa `0.85`. La UI debe mostrar etiqueta clara y validar rango 0–100.

---

### A4. Unidades de MAQUILA, CONSUMOS, FLETE, RC, OTROS

**Supuesto:** Todos son **USD (o moneda local) por TMS** o por unidad que el Excel ya usa de forma consistente — mismas unidades que INTER (precio por onza) mezcladas en una expresión lineal.

**Pregunta:** ¿MAQUILA es USD/oz, USD/tms, o USD total del lote? (Impacta si se multiplica por TMS al final o no.)

---

### A5. Ley en fórmula — oz/tc vs gr/tm

**Supuesto:** Las fórmulas AU/AG usan **ley en oz/tc** siempre, convirtiendo antes si el usuario eligió gr/tm.

---

### A6. Redondeo

| Paso | Supuesto |
|------|----------|
| TMS | Floor a 3 decimales |
| valor_au_x_tms, valor_ag_x_tms, valor_final_x_tms | Round half-up a 2 decimales (estándar financiero) |
| valor_compra_total | Round2 después de multiplicar por TMS |

**Pregunta:** ¿Excel usa `REDONDEAR`, `TRUNCAR` o `REDONDEAR.MENOS` en pasos intermedios?

---

### A7. Valores vacíos / cero

| Campo | Comportamiento propuesto |
|-------|--------------------------|
| OTROS COSTOS | Opcional → 0 si vacío |
| INTER, ley, TMS | Obligatorios para calcular; si falta → no calcular resultado (mostrar “—”) |
| REC | Default desde config o vacío bloquea cálculo |

---

### A8. TIPO MAT (MSC, MOC, MSLL, MOLL, MOP)

**Supuesto MVP:** Tipo MAT es **etiqueta/clasificación** guardada en historial y PDF; **no altera fórmulas** en v1 salvo que el Excel tenga reglas por tipo.

**Pregunta:** ¿Algún tipo MAT cambia REC default, maquila o factores?

---

### A9. Proveedor

**Supuesto:** Proveedor selecciona **defaults** (consumos, flete, RC oro/plata, REC) precargados pero siempre editables en el formulario y por escenario.

---

### A10. Comparación de escenarios

**Supuesto:** TMH, H2O, TMS, leyes, REC%, tipo MAT son **compartidos** entre escenarios; solo cambian parámetros comerciales listados (maquila, RC, consumos, flete, inter, otros).

**Alternativa:** Cada escenario podría tener ley/REC distintos — más costoso en UI; no asumido en MVP.

---

### A11. Seguridad / usuarios

**Supuesto MVP:**
- Usuarios y contraseñas (hash) en SQLite local o archivo embebido inicial.
- Roles: `admin` | `operador` (admin gestiona usuarios y config).
- “Expirar acceso por dispositivo” = fecha de expiración en registro de dispositivo + validación en login offline.
- Sin backend en MVP.

---

## Matriz de prioridad para validación

1. **Crítico:** Fórmulas AU y AG (A1, A2, A4) — pedir captura o Excel.
2. **Alto:** REC como % (A3), unidades maquila (A4).
3. **Medio:** Redondeos intermedios (A6), reglas por TIPO MAT (A8).
4. **Bajo:** Formato exacto del código (flexible si es único y buscable).

---

## Checklist de confirmación para el cliente

- [ ] Adjuntar Excel (o exportar hoja de valorización con fórmulas visibles).
- [ ] 2 ejemplos numéricos completos (entrada → resultado AU, AG, total).
- [ ] Confirmar si REC se ingresa como 85 o 0.85.
- [ ] Confirmar unidad de MAQUILA y si aplica a plata.
- [ ] Confirmar moneda y si FACTOR es único global.
- [ ] ¿TIPO MAT afecta cálculo o solo reporte?
- [ ] ¿Escenarios comparten leyes/TMS o pueden divergir?
