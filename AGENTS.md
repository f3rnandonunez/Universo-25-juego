# Universo 25 — Estado del Proyecto

> **ORDEN DE LECTURA al iniciar una nueva sesion:**
> 1. `CODIGO_PRINCIPIOS.md` — principios de codificacion (leer primero)
> 2. `README_LORE.md` — concepto y narrativa del juego
> 3. `README.md` — documentacion tecnica (stack, estructura, comandos)
> 4. `AGENTS.md` — estado actual del proyecto (este archivo)
>
> Los archivos `deepseekUniverso25.txt` y `readme.txt` contienen versiones previas, mantener por referencia.

## Proyecto
- Ruta: `C:\Fer\universo25\`
- Stack: Vite + Phaser 3 + TypeScript
- Build: `npx tsc --noEmit 2>&1; if ($?) { npx vite build 2>&1 | Select-String -Pattern "built in|error" }`
- Dev: `npm run dev`

## Referencia: Experimento Calhoun (Universo 25)
- 6.5 m², capacidad natural ~3500 ratas noruegas
- 8 iniciales (4 parejas), ~315 dias -> 600 ratas -> quiebre conductual (18% capacidad)
- Pico ~560 dias -> 2200 ratas (63% capacidad), luego colapso
- Behavioral sink: el quiebre NO es por falta de recursos sino por exceso de interacciones sociales negativas
- Irreversible: una vez que la sociedad colapsa, no se recupera aunque la densidad baje

## Constantes clave (constants.ts)
- Canvas: 1024x680, Mundo: 262,160 a 762,520 (500x360) ~6.5 m² simulados
- **Madurez sexual: 90 ticks** (3 meses reales), Gestacion: **22**, Cooldown: **1**, Cuidado crias: **25**, Vida: **730** (~2 años wild)
- Radios por tipo: dominante=6, hembra=5, subordinado=4, cria=2.5 (px)
- Velocidades: wander 0.8, seek 1.2, chase 1.2, flee 1.0 (marginado flee 0.5)
- Decay: dom h=0.3/t=0.25, sub h=0.2/t=0.18, fem h=0.25/t=0.2
- Seek threshold: 50, Crowd radius: 35
- Density thresholds: Fase2=**0.18** (~630 ratas), Fase3=**0.63** (~2200 ratas)
- Capacidad maxima: 3500 (space slider regula esto proporcionalmente)
- 8 iniciales (2 dominantes, 3 hembras, 3 subordinados)
- **9 pares de fuentes** (4 esquinas + centro + 4 ejes)

## Tipos emergentes (5 tipos patologicos del experimento)

| Tipo emergente | Aparece en | Threshold | Chance/tick | Comportamiento | Forma render |
|---------------|-----------|-----------|-------------|----------------|--------------|
| `marginado` | Estancamiento | density>0.18 | 0.3% (sub) | flee al centro a 50% velocidad | pentágono, alpha 0.5 |
| `panurgino` | Estancamiento | density>0.3 | 0.2% (sub) | chase errático sin rumbo | triángulo |
| `hiperagresivo` | Estancamiento | density>0.4 | 0.3% (dom) | chase + strokeCircle borde, mata crías | rombo, alpha 1.0 |
| `hembra_hiperagresiva` | Estancamiento | density>0.5 | 0.2% (fem) | ataca crías (-20 health), childCareTicks=0 | hexágono |
| `hermoso` | Muerte | siempre | 0.5% (cualquiera) | groom (quieto, alpha 1.0 fijo) | elipse |

- 50% de crias nacen directamente como `hermoso` si phase >= 4 (Muerte)
- Cualquier mouse con `emergedType` NO puede reproducirse (`canReproduce()` bloqueado)

## Comportamiento (Mouse.ts evaluateBehavior)
1. Si actionTicks > 0 -> return
2. Hunger < 50 -> seek_food (o eat si cerca)
3. Thirst < 50 -> seek_water (o drink si cerca)
4. Eat/Drink -> restauran 18/tick por 6/5 ticks
5. Si tiene emergedType -> comportamiento fijo (groom/flee/chase/wander segun tipo), sin pasar por hacinamiento ni estres
6. Espacio < 70 -> conteo vecinos en 35px (early break al superar umbral)
   - Umbral = 2 + floor(6 * space/100), minimo 2
   - Dominante supera umbral -> chase (wander rapido)
   - Subordinado supera umbral -> flee al centro
7. Fase >= 2 y stress > 0.2:
   - Dominantes: chase si `random < stress * 1.5`
   - Subordinados: flee si `random < stress * 2`, frozen si stress > 0.5
   - Hembras: flee si `random < stress * 0.8`
   - Todo sin distance checks (chances planas)

## Fases
### Phase1_Establishment (activa, transiciona a Fase B)
- reproductionRate: 1.5, mortalityRate: **0.0**
- updateColony: vacio
- shouldTransition: **poblacion > 8** (primer parto, ~tick 112)

### Phase2_Exploitation (activa, transiciona a Fase C)
- reproductionRate: 1.5, mortalityRate: 0.2
- updateColony: vacio (sin estres, sin emergentes — sociedad sana)
- shouldTransition: `density >= 0.18` (~630 ratas)

### Phase3_Stagnation (activa ~630 ratas: estres social, quiebre)
- reproductionRate: 0.4, mortalityRate: 1.8
- updateColony (un solo pase sobre alive):
  - Danio por estres con formula **cuadratica**: `stressDamage = socialStress² * 10`
  - Dominantes: `health -= 1 + stressDamage * 0.5`, 5% atacan crias (-15 health)
  - Subordinados: `health -= 3 + stressDamage`
  - Hembras: `health -= 2 + stressDamage * 0.5`, 3% abandonan crias (childCareTicks=0)
  - Transformaciones a emerged types en orden (ver tabla arriba)
  - `hembra_hiperagresiva` ataca crias (-20 health) en el mismo pase
  - Si density > 0.5: hiperagresivos matan crias (5% por tick)
- shouldTransition: density >= **0.63** -> Fase D

### Phase4_Death (activa ~2200 ratas: declive irreversible)
- reproductionRate: **0.0**, mortalityRate: 2.5
- updateColony:
  - **Mortalidad infantil 100%**: todas las crias (< BABY_AGE) mueren inmediatamente
  - Transformacion a hermoso: 0.5% por tick
  - Danio pasivo: 2% a health<30 (-3), 1% a hembras health>40 (-5)
- shouldTransition: false (terminal)

## Engine (SimulationEngine.ts)
- SocialStress siempre activo: `min(0.8, density * 0.5)`
- Danio vejez: 0.5 * mortalityRate si age > 730
- Danio bajo wellbeing: 0.2 * mortalityRate si wellbeing < 25
- Danio hacinamiento: 0.15 * (density - 0.8) * 5 si density > 0.8
- Reproduccion: `0.06 * reproRate * wellbeingFactor * densityFactor * maleFactor * sinkPenalty`
  - densityFactor con piso 0.1: `max(0.1, 1 - density)`
  - maleFactor: `min(1, domCount*0.03 + subCount*0.005)`
  - sinkPenalty: 0.3 si behavioralSink=true (irreversible)
- Camada: random 6-12 crias
- 50% de crias nacen `hermoso` si phase >= 4 (Muerte)
- behavioralSink flag: se activa al llegar a **Fase 3 (Estancamiento)**, permanentemente reduce reproduccion
- Save/Load con localStorage key "universo25_save" (incluye behavioralSink, emergedType)
- Reiniciar borra localStorage antes de location.reload()
- **reset(config?: ColonyConfig)**: permite reiniciar con configuracion personalizada de poblacion

## Renderer (MouseRenderer.ts)
- Formas geometricas segun emergedType (ver tabla arriba)
- Circulos normales para no-emergentes:
  - Poblacion >200: sin borde blanco en dominantes
  - Poblacion >300: sin alpha por hambre (solo health)
- Sin frame skip (eliminado por titileo)

## Panel (izquierda, 230px fijo)
- Stats: Poblacion, Densidad, Bienestar, Fase, Tick (grid 2 cols)
- Poblacion: Dominantes, Subordinados, Hembras
- Control: sliders Comida/Agua/Espacio, velocidad x1/x2/x3, Guardar/Reiniciar
- Leyenda: colores por tipo

## Proximos pasos
1. SPATIAL HASH para O(n^2) en evaluateBehavior si vuelve lento con poblaciones grandes
2. Fase 4 (Extincion): cuando no hay reproduccion y solo quedan debiles
3. Poleas/resistencia al movimiento (mayor friccion cuando densidad alta)
4. Canibalismo visual (ratones muertos siendo comidos)
5. Graficos: cambiar circulos por sprites de rata (forma de gota/ellipse)
