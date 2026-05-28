# Universo 25 — Estado del Proyecto

> **ORDEN DE LECTURA al iniciar una nueva sesion:**
> 1. `CODIGO_PRINCIPIOS.md` — principios de codificacion (leer primero)
> 2. `README_LORE.md` — concepto y narrativa del juego
> 3. `README.md` — documentacion tecnica (stack, estructura, comandos)
> 4. `AGENTS.md` — estado actual del proyecto (este archivo)
>
> `README_COMPLETO.md` es una version integral mas detallada. `deepseekUniverso25.txt` y `readme.txt` son versiones previas, mantener solo por referencia.

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
- Tick interval: 80ms (1 tick = 1 dia)
- Madurez: 90 ticks, Gestacion: 22, Cooldown: 1, Cuidado crias: 25, Vida: ~730 ticks
- Radios por tipo: dominante=6, hembra=5, subordinado=4, cria=2.5 (px)
- Velocidades (calibradas a rata real ~1.5 m/s): wander 5, seek 12, chase 19, flee 20
- Decay: dom h=0.3/t=0.25, sub h=0.2/t=0.18, fem h=0.25/t=0.2
- Seek threshold: 50, Crowd radius: 35
- Density thresholds: Fase2=0.18 (~630 ratas), Fase3=0.50 (~1750 ratas)
- Capacidad maxima: 3500 (space slider regula esto proporcionalmente)
- Default inicial (configurable via overlay): 2 dominantes, 2 subordinados, 4 hembras
- 9 pares de fuentes (4 esquinas + centro + 4 puntos medios de bordes)

## Comportamiento (Mouse.ts evaluateBehavior)
1. Si actionTicks > 0 -> return
2. Hunger < 50 -> seek_food (o eat si cerca)
3. Thirst < 50 -> seek_water (o drink si cerca)
4. Eat/Drink -> restauran 18/tick por 6/5 ticks
5. Si emergedType -> bloque emergente:
   - marginado: flee al centro a 50% velocidad
   - panurgino: chase erratico
   - hiperagresivo: chase
   - hembra_hiperagresiva: wander, childCareTicks = 0 forzado
   - hermoso: groom (quieto)
6. Espacio < 70 -> conteo vecinos en 35px (early break al superar umbral)
   - Umbral = 2 + floor(6 * space/100), minimo 2
   - Dominante supera umbral -> chase
   - Subordinado supera umbral -> flee al centro
7. Fase >= 2 y stress > 0.2:
   - Dominantes: chase si random < stress * 1.5
   - Subordinados: flee si random < stress * 2, frozen si stress > 0.5
   - Hembras: flee si random < stress * 0.8
   - Todo sin distance checks (chances planas)

## Fases
### Phase1_Establishment (activa hasta primer parto)
- reproductionRate: 1.5, mortalityRate: 0.0
- updateColony: vacio
- shouldTransition: colony.population > 8 (primer parto)

### Phase2_Exploitation (activa ~0-630 ratas: sociedad funcional)
- reproductionRate: 1.5, mortalityRate: 0.2
- updateColony: vacio (sin estres, sin emergentes)
- shouldTransition: density >= 0.18

### Phase3_Stagnation (activa ~630-1750 ratas: colapso social)
- reproductionRate: 0.4, mortalityRate: 1.8
- updateColony:
  - Danio por estres cuadratico: socialStress^2 * 10
  - 5% de dominantes atacan crias (-15 health)
  - 3% de hembras abandonan crias (childCareTicks = 0)
  - 4 transformaciones emergentes en orden (solo si no tienen emergedType):
    1. marginado: subordinate, density > 0.18, 0.3%/tick
    2. panurgino: subordinate, density > 0.3, 0.2%/tick
    3. hiperagresivo: dominant, density > 0.4, 0.3%/tick
    4. hembra_hiperagresiva: female, density > 0.5, 0.2%/tick
  - hembra_hiperagresiva ataca crias (-20 health) cada tick
  - 5% de hiperagresivos matan crias si density > 0.5
- shouldTransition: density >= 0.50

### Phase4_Death (activa ~1750+: extincion)
- reproductionRate: 0.0, mortalityRate: 2.5
- updateColony:
  - Mortalidad infantil 100% (todo age < BABY_AGE -> health = 0)
  - Transformacion a hermoso (0.5%/tick)
  - Danio pasivo a debiles (health < 30) y hembras
- shouldTransition: false (terminal)

## Engine (SimulationEngine.ts)
- SocialStress siempre activo: min(0.8, density * 0.5)
- Danio vejez: 0.5 * mortalityRate si age > 730
- Danio bajo wellbeing: 0.2 * mortalityRate si wellbeing < 25
- Danio hacinamiento: 0.15 * (density - 0.8) * 5 si density > 0.8
- Reproduccion: `0.06 * reproRate * wellbeingFactor * densityFactor * maleFactor * sinkPenalty`
  - densityFactor con piso 0.1: `max(0.1, 1 - density)`
  - maleFactor: `min(1, domCount*0.03 + subCount*0.005)`
  - sinkPenalty: 0.3 si behavioralSink=true (irreversible)
  - Tamano camada: randomRange(6, 12)
- behavioralSink flag: se activa al llegar a Fase 3+, permanentemente reduce reproduccion
- En Fase 4: 50% de crias nacen como 'hermoso'
- Save/Load con localStorage key "universo25_save" (incluye emergedType, behavioralSink)
- Reiniciar borra localStorage antes de location.reload()
- reset(config): crea Colony con config, resetea tickCount/phaseIndex
- Overlay de configuracion: 8 filas (dominantes, subordinados, hembras + 5 emergentes), rango 0-10

## Renderer (MouseRenderer.ts)
- Formas por tipo base:
  - Dominante: cuadrado (fillRect) + borde blanco si population < 200
  - Subordinado: circulo (fillCircle)
  - Hembra: triangulo abajo (fillTriangle)
  - Cria: circulo chico (radio 2)
- Formas por emergente:
  - hermoso: elipse, alpha 1.0
  - marginado: pentagono, alpha 0.5
  - panurgino: triangulo arriba, alpha 0.8
  - hiperagresivo: rombo + stroke blanco grueso (lineStyle 2), alpha 1.0
  - hembra_hiperagresiva: hexagono, alpha 0.7
- Poblacion >300: alpha solo por health (sin alpha por hambre)

## Panel (izquierda, 230px fijo)
- Stats: Poblacion, Densidad, Bienestar, Fase, Dia (grid 2 cols)
- Poblacion: Dominantes, Subordinados, Hembras
- Control: sliders Comida/Agua/Espacio, velocidad x1/x2/x3, Guardar/Personalizar/Reiniciar
- Leyenda: colores por tipo

## Colapso (GameScene.ts)
- Detecta poblacion === 0 en cada tick
- Congela simulacion (pausa timers)
- Overlay con: dias sobrevividos, poblacion pico, ultima fase
- Botones: "Reiniciar" (reload) y "Cerrar" (ver mundo vacio congelado)

## Proximos pasos (no implementados)
1. SPATIAL HASH para O(n^2) en evaluateBehavior si vuelve lento con poblaciones grandes
2. Poleas/resistencia al movimiento (mayor friccion cuando densidad alta)
3. Canibalismo visual (ratones muertos siendo comidos)
4. Sprites de rata (forma de gota/elipse en vez de formas geometricas)
5. Variable Humana (mecanica de sublimacion en definicion)
