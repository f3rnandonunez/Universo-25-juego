# Universo 25 — Technical Specification

## Stack

| Capa           | Tecnología       | Motivo                                    |
|----------------|------------------|-------------------------------------------|
| Engine         | Phaser 3         | Web + 2D geométrico, liviano             |
| Lenguaje       | TypeScript       | Tipado estático, mantenibilidad           |
| Build          | Vite             | Dev rápido, bundles optimizados           |
| Render         | Canvas 2D        | Suficiente para figuras geométricas       |
| Almacenamiento | LocalStorage     | Simple, sin backend                       |

## Arquitectura

Separación estricta entre lógica de simulación y renderizado:

```
src/
├── core/                    # Tipos, constantes y utilidades compartidas
│   ├── types.ts             # MouseType, EmergedType, Phase, Vector2
│   ├── constants.ts         # Umbrales, colores, dimensiones (valores reales rata noruega)
│   └── utils.ts             # Vec2, random, clamp
├── simulation/              # Lógica pura (sin dependencia del DOM/Phaser)
│   ├── Mouse.ts             # Entidad individual con emergedType y 5 comportamientos emergentes
│   ├── WorldState.ts        # Recursos ambientales (comida, agua, espacio)
│   ├── Colony.ts            # Población colectiva, behavioralSink flag, ColonyConfig
│   ├── SimulationEngine.ts  # Tick principal, reproducción (litter 6-12), 50% hermoso en F4
│   └── phases/
│       ├── Phase.ts         # Interfaz PhaseRules
│       ├── Phase1_Establishment.ts # Fase A: Establecimiento (repro 1.5, mort 0.0, transición pop>8)
│       ├── Phase2_Exploitation.ts  # Fase B: Explotación (repro 1.5, mort 0.2, density>=0.18)
│       ├── Phase3_Stagnation.ts    # Fase C: Estancamiento (daño cuadrático + 4 transformaciones)
│       └── Phase4_Death.ts         # Fase D: Muerte (repro 0.0, transformación a hermoso)
├── renderer/                # Capa visual (Phaser 3)
│   ├── scenes/
│   │   └── GameScene.ts     # Escena principal, timer, background
│   ├── entities/
│   │   └── MouseRenderer.ts # Dibuja formas geométricas según tipo (círculo/pentágono/triángulo/rombo/hexágono/elipse)
│   └── ui/
│       ├── HUD.ts           # Indicadores en DOM
│       └── Controls.ts      # Sliders de control
└── main.ts                  # Entry point, configura Phaser
```

## Principio de diseño

La capa `simulation/` no importa ni conoce Phaser. Puede correr en Node.js o ser testeada sin navegador. La capa `renderer/` solo lee estado y dibuja. Migrar a Godot implica reescribir solo `renderer/`.

## Data flow

```
[Player Input] -> Controls.ts -> WorldState -> SimulationEngine.tick()
                                              ↓
                                       Colony + Mice
                                              ↓
                              onUpdate callbacks -> HUD.update()
                              MouseRenderer.render() (cada frame)
```

## Fases

| Fase | Nombre | reproductionRate | mortalityRate | Transicion |
|------|--------|:-:|:-:|-----------|
| 1 | Establecimiento | 1.5 | **0.0** | población > 8 (primer parto) |
| 2 | Explotación | 1.5 | 0.2 | density >= **0.18** |
| 3 | Estancamiento | 0.4 | 1.8 | density >= **0.50** |
| 4 | Muerte | **0.0** | 2.5 | terminal |

## Constantes de rata noruega (Calhoun)

| Constante | Valor | Equivalencia real |
|-----------|-------|-------------------|
| Madurez sexual | 90 ticks | ~3 meses |
| Gestacion | 22 ticks | ~22 dias |
| Cooldown post-parto | 1 tick | ~24h |
| Cuidado de crias (destete) | 25 ticks | ~25 dias |
| Vida maxima | 730 ticks | ~2 anos wild |
| Camada | 6-12 crias | promedio ~8 real |
| Capacidad maxima | 3500 ratas | 6.5 m² |
| Poblacion inicial (default) | 8 | 2 dominantes, 2 subordinados, 4 hembras (configurable) |
| Fuentes de recursos | 9 pares | 4 esquinas + centro + 4 ejes |

## Tipos emergentes (5 patologicos del experimento original)

| Tipo | Emerge en | Condicion | Comportamiento | Forma visual |
|------|-----------|-----------|----------------|--------------|
| marginado | Estancamiento | subordinate, density>0.18, 0.3%/tick | flee al centro a mitad velocidad | pentagono, alpha 0.5 |
| panurgino | Estancamiento | subordinate, density>0.3, 0.2%/tick | chase erratico sin rumbo | triangulo |
| hiperagresivo | Estancamiento | dominant, density>0.4, 0.3%/tick | chase + borde blanco, mata crias | rombo, alpha 1.0 |
| hembra_hiperagresiva | Estancamiento | female, density>0.5, 0.2%/tick | ataca crias (-20), abandona nido | hexagono |
| hermoso | Muerte | cualquiera, 0.5%/tick (+50% al nacer en F4) | groom (quieto, alpha 1.0 fijo) | elipse |

Todos los tipos emergentes bloquean la reproduccion (`canReproduce()` retorna false si `emergedType !== undefined`).

## Formas base (MouseRenderer)

| Tipo base | Forma | Detalle |
|-----------|-------|---------|
| Dominante | Cuadrado | fillRect centrado, borde blanco si poblacion < 200 |
| Subordinado | Circulo | fillCircle (sin cambio) |
| Hembra | Triangulo abajo | fillTriangle apuntando hacia abajo |
| Cria | Circulo chico | fillCircle radio 2px |

## Comportamiento (evaluateBehavior)

1. Survival: hunger < 50 -> seek food, thirst < 50 -> seek water
2. Si tiene emergedType -> comportamiento fijo segun tipo (groom/flee/chase/wander)
3. Hacinamiento (space < 70): conteo vecinos en 35px, dominantes persiguen, subordinados huyen
4. Fase >= 2 (Explotacion+): comportamientos por estres sin distance checks (chances planas por tipo)

## Mecanicas clave

- SocialStress global: `min(0.8, density * 0.5)`, siempre activo
- Daño por estres en Fase 2: formula **cuadratica** `stressDamage = socialStress^2 * 10`
- DensityFactor en reproduccion con piso 0.1
- Overcrowding damage cuando density > 0.8
- behavioralSink: activo al pasar a **Fase 3 (Estancamiento)**, permanente, reduce reproduccion 70%
- 3 sliders de control: Comida, Agua, Espacio
- Velocidad x1/x2/x3, Guardar/**Personalizar**/Reiniciar
- **Configuracion inicial**: overlay con 8 tipos de raton (3 base + 5 emergentes), cada uno 0-10, boton Default (2D, 2S, 4H)

## Comandos

```bash
npm run dev      # Desarrollo con HMR
npm run build    # Build producción en dist/
npm run preview  # Servir build local
```
