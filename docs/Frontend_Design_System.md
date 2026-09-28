# Sistema de Diseño y Reglas Frontend (UI/UX)
## Estilo: Premium Minimalist (Esqueleto Neutro + Acentos Semánticos)
## Plataforma: AdminSoftGPF (powered by PortaForza)

ESTE DOCUMENTO ES DE LECTURA OBLIGATORIA PARA LA GENERACIÓN DE CÓDIGO FRONTEND. NO DESVIARSE DE ESTAS REGLAS VISUALES.

### 1. Filosofía Visual (Premium SaaS)
El diseño sigue el patrón de "Esqueleto Neutro con Acentos Semánticos" (similar a plataformas como Stripe o Apple).
- **Prioridad 1 (Estructura):** El 90% de la interfaz (fondos, tarjetas, textos, bordes) se rige exclusivamente por Blanco, Negro y Grises (los colores de la palabra "PortaForza").
- **Prioridad 2 (Acentos):** Los colores vivos del isotipo (la "P") se usan con precisión quirúrgica solo para dirigir la atención (botones principales) o comunicar estados (semáforos de deuda/pago).
- **Tipografía Principal:** `Inter` (o familia sans-serif moderna equivalente como San Francisco/Roboto). Peso 400 para lectura, 500/600 para botones y títulos, 700 para montos numéricos.

### 2. Paleta de Colores Jerárquica

#### Nivel 1: Estructura (PortaForza)
- **Porta Black (`#09090B`):** Fondos en modo noche, textos principales en modo día.
- **Porta White (`#FFFFFF`):** Tarjetas en modo día, textos principales en modo noche.
- **Forza Gray Dark (`#71717A`):** Subtítulos, textos secundarios, íconos inactivos en modo día.
- **Forza Gray Light (`#E4E4E7`):** Bordes sutiles de tarjetas y divisores.

#### Nivel 2: Acentos (La 'P' de PortaForza)
- **Primary Blue (`#2563EB`):** Botones de acción principal (Ej. "Cobrar", "Guardar"). Enlaces de texto interactivas.
- **Success Green (`#16A34A`):** Indicadores positivos (Ej. "Al Día", "Balance a Favor").
- **Warning Orange (`#EA580C`):** Indicadores de alerta (Ej. "Pendiente", "Mora").
- **Danger Red (`#DC2626`):** Acciones destructivas (Ej. "Eliminar", "Anular Factura").

---

### 3. Comportamiento: MODO DÍA (Light Mode)
*   **Fondo (Background):** Gris ultra-claro (`#F4F4F5`).
*   **Tarjetas (Cards):** Blanco puro (`#FFFFFF`) con bordes sutiles (`#E4E4E7`) y sombra ligera (`box-shadow: 0 1px 3px rgba(0,0,0,0.05)`).
*   **Textos:** Títulos en Negro (`#09090B`), subtítulos en Gris (`#71717A`).

### 4. Comportamiento: MODO NOCHE (Dark Mode)
*   **Fondo (Background):** Negro puro (`#000000`).
*   **Tarjetas (Cards):** Gris muy oscuro (`#121212`) con bordes (`#27272A`) y sombra profunda para elevar el elemento (`box-shadow: 0 10px 20px rgba(0,0,0,0.5)`).
*   **Textos:** Títulos en Blanco hueso (`#FAFAFA`), subtítulos en Gris claro (`#A1A1AA`).

---

### 5. Reglas Estrictas de Componentes

#### A. Tarjetas (Cards)
- **Forma:** Esquinas redondeadas prominentes (`border-radius: 16px`).
- **Padding:** Espaciado interno amplio (`padding: 24px`) para dejar "respirar" los elementos.

#### B. Etiquetas de Estado (Badges / Píldoras)
- **Prohibido usar bloques de color sólido agresivos.** 
- Deben usarse "Píldoras Traslúcidas": Fondo con 15% de opacidad del color semántico, texto con el 100% del color semántico.
- *Ejemplo Éxito (Día):* Fondo `#DCFCE7`, Texto `#16A34A`.
- *Ejemplo Alerta (Noche):* Fondo `rgba(234, 88, 12, 0.15)`, Texto `#FB923C`.

#### C. Botones (Buttons)
- **Acción Primaria:** Usa el azul de la marca (`#2563EB`) con texto blanco y sombra ligera. Bordes redondeados (`8px`).
- **Acción Secundaria:** Botones "Outline" o "Ghost". Fondo transparente o del color de la tarjeta, con borde gris y texto del color principal (Blanco o Negro según el modo).

#### D. Tablas y Formularios
- **Tablas:** Limpias, sin líneas verticales. Líneas divisorias horizontales muy finas.
- **Campos Numéricos:** Los montos (RD$) deben usar un `font-weight: 700` y `letter-spacing: -0.5px` para verse ejecutivos y crujientes. Si un monto es deuda, hereda el color Naranja/Rojo. Si está pagado, es del color del texto normal.
