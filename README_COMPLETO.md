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
| 1 | Crecimiento | Explosion demografica. Jerarquias estables. Alta natalidad. |
| 2 | Estres Social | Densidad critica. Violencia, territorialidad y primeras desviaciones. |
| 3 | Apatia | Natalidad colapsa. Aparecen "Los Hermosos". Desinteres general. |
| 4 | Extincion | Sin retorno. La colonia se apaga lentamente. |

### Tipos de Individuos

**Originales:** Dominantes, Subordinados, Hembras.

**Emergentes (5 tipos patologicos):**

| Nombre lore | Nombre codigo | Comportamiento | Forma |
|-------------|---------------|----------------|-------|
| Los Marginados | `marginado` | Huyen al centro, semitransparentes | pentagono |
| Los Pansexuales | `panurgino` | Persecucion sin rumbo | triangulo |
| Los Probers | `hiperagresivo` | Violencia compulsiva | rombo |
| Las Madres Desertoras | `hembra_desapegada` | Abandonan crias, deambulan | hexagono |
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
    SimulationEngine.ts    Tick, reproduccion (litter 6-12, 30% hermoso en F3), save/load
    phases/
      Phase.ts             Interfaz PhaseRules
      Phase1_Growth.ts     Reglas de Fase 1
      Phase2_Stress.ts     Reglas de Fase 2 (dano cuadratico + 4 transformaciones)
      Phase3_Apathy.ts     Reglas de Fase 3 (transformacion a hermoso)
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
| 1 | Crecimiento | 1.5 | 0.2 | density >= 0.18 |
| 2 | Estres Social | 0.4 | 1.8 | density >= 0.35 |
| 3 | Apatia | 0.05 | 2.5 | terminal |
| 4 | Extincion | — | — | no implementada |

## Constantes de rata noruega

Madurez=90, Gestacion=22, Cooldown=1, Cuidado crias=25, Vida=730, Camada=6-12, Capacidad=3500, 8 iniciales, 9 pares de fuentes.

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
