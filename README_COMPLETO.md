# Universo 25

**Un simulador incremental donde construis una utopia perfecta… y ves como colapsa igual.**

---

## Lore

Construis un paraiso para ratones: comida infinita, agua, proteccion, nidos y espacio inicial.
Sin depredadores. Sin escasez. Y aun asi, la colonia se destruye.

**No se puede ganar.** El colapso **es** el juego.

### Concepto

En 1968, John B. Calhoun creo el Universo 25: un ambiente ideal para ratones. La poblacion crecio exponencialmente hasta que el tejido social colapso, llevando a la extincion. No por falta de recursos, sino por quiebre conductual.

Este juego transforma ese experimento en una simulacion oscura e incremental. Vos controlas las condiciones ambientales, pero nunca el destino final.

### Fases del Colapso

| Fase | Nombre | Que sucede |
|------|---------|------------|
| A | Establecimiento | Adaptacion al entorno. Sin reproduccion activa hasta primer parto. |
| B | Explotacion | Crecimiento exponencial. Sociedad funcional. Hasta ~600 ratas. |
| C | Estancamiento | Colapso social. Emergentes (marginados, panurginos, hiperagresivos, hembras hiperagresivas). Pico ~1.750. |
| D | Muerte | Mortalidad infantil 100%. Solo "Los Hermosos". Extincion irreversible. |

### Tipos de Individuos

**Originales:** Dominantes, Subordinados, Hembras.

**Emergentes (5 tipos patologicos):**

| Nombre lore | Nombre codigo | Comportamiento | Forma |
|-------------|---------------|----------------|-------|
| Los Marginados | `marginado` | Huyen al centro, semitransparentes | pentagono |
| Los Pansexuales | `panurgino` | Persecucion sin rumbo | triangulo |
| Los Probers | `hiperagresivo` | Violencia compulsiva | rombo |
| Las Madres Hiperagresivas | `hembra_hiperagresiva` | Atacan crias, violencia maternal | hexagono |
| Los Hermosos | `hermoso` | Solo se acicalan, pelaje perfecto | elipse |

---

## Stack

| Capa | Tecnologia | Motivo |
|------|------------|--------|
| Engine | Phaser 3 | Web + 2D geometrico, liviano |
| Lenguaje | TypeScript | Tipado estatico, mantenibilidad |
| Build | Vite | Dev rapido, bundles optimizados |
| Render | Canvas 2D | Suficiente para figuras geometricas |
| Almacenamiento | LocalStorage | Simple, sin backend |

## Arquitectura

Separacion estricta entre logica de simulacion y renderizado:

```
src/
  core/                    Tipos, constantes y utilidades compartidas
    types.ts               MouseType, EmergedType (5 tipos), Phase, Vector2, BehaviorState
    constants.ts           Umbrales, colores, dimensiones (valores reales rata noruega)
    utils.ts               Vec2, random, clamp
  simulation/              Logica pura (sin Phaser)
    Mouse.ts               Entidad individual con emergedType y comportamiento por tipo
    WorldState.ts          Recursos ambientales
    Colony.ts              Poblacion colectiva, behavioralSink flag
    SimulationEngine.ts    Tick, reproduccion (litter 6-12, 50% hermoso en F4), save/load, reset(config)
    phases/
      Phase.ts             Interfaz PhaseRules
      Phase1_Establishment.ts  Reglas de Fase A (Establecimiento, repro 1.5 mort 0.0)
      Phase2_Exploitation.ts   Reglas de Fase B (Explotacion, repro 1.5 mort 0.2)
      Phase3_Stagnation.ts     Reglas de Fase C (Estancamiento, dano cuadratico + 4 transformaciones)
      Phase4_Death.ts          Reglas de Fase D (Muerte, repro 0.0, transformacion a hermoso)
  renderer/                Capa visual (Phaser 3)
    scenes/GameScene.ts    Escena principal
    entities/MouseRenderer.ts  Dibuja formas segun tipo (circulo/pentagono/triangulo/rombo/hexagono/elipse)
    ui/HUD.ts              Indicadores en DOM
    ui/Controls.ts         Sliders de control
  main.ts                  Entry point, configura Phaser
```

### Principio de diseno

La capa `simulation/` no importa ni conoce Phaser. Puede correr en Node.js o ser testeada sin navegador. La capa `renderer/` solo lee estado y dibuja.

## Data flow

```
[Player Input] -> Controls.ts -> WorldState -> SimulationEngine.tick()
                                                |
                                          Colony + Mice
                                                |
                                  onUpdate callbacks -> HUD.update()
                                  MouseRenderer.render() (cada frame)
```

## Fases (tecnicas)

| Fase | Nombre | reproductionRate | mortalityRate | threshold |
|------|--------|:-:|:-:|-----------|
| A | Establecimiento | 1.5 | 0.0 | poblacion > 8 (primer parto) |
| B | Explotacion | 1.5 | 0.2 | density >= 0.18 |
| C | Estancamiento | 0.4 | 1.8 | density >= 0.50 |
| D | Muerte | 0.0 | 2.5 | terminal |

## Constantes de rata noruega

Madurez=90, Gestacion=22, Cooldown=1, Cuidado crias=25, Vida=730, Camada=6-12, Capacidad=3500, 8 iniciales configurable (2D, 2S, 4H default), 9 pares de fuentes.

## Referencia historica (Calhoun)

- Espacio: 6.5 m², capacidad natural ~3500 ratas
- Poblacion inicial: 8 individuos (4 parejas)
- Quiebre conductual: ~315 dias, ~600 ratas (18% capacidad)
- Pico: ~560 dias, ~2200 ratas (63% capacidad), luego colapso
- Behavioral sink: el quiebre no es por falta de recursos sino por exceso de interacciones sociales negativas
- Irreversible: una vez que la sociedad colapsa, no se recupera aunque la densidad baje

## Comandos

```bash
npm run dev      # Desarrollo con HMR
npm run build    # Build produccion en dist/
npm run preview  # Servir build local
```
