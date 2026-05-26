# Principios de Codificacion

> Leer este archivo al inicio de cada sesion. Define como se escribe y modifica el codigo del proyecto.

## Metricas de exito

- Reduccion de cambios irrelevantes en diffs
- Disminucion de reescrituras por sobreingenieria
- Preguntas aclaratorias formuladas ANTES de implementar (no despues de errores)

## 1. Think Before Coding

No asumir. Preguntar antes de implementar.

**Antes de codificar, aclarar:**
- Alcance exacto del cambio
- Formato/estructura esperada
- Casos borde conocidos
- Volumen de datos implicado

*Siempre listar las asunciones explicitamente y pedir confirmacion.*

## 2. Simplicity First

La version mas simple que resuelve el problema HOY. No prepararse para escenarios futuros hipoteticos.

- Una funcion, no una jerarquia de clases
- Una variable, no un strategy pattern
- Se puede refactorizar cuando la complejidad sea realmente necesaria

*Complejidad prematura = bugs prematuros.*

## 3. Surgical Changes

Cambiar solo lo necesario para resolver el problema especifico. NO hacer:

- Reformateo de codigo existente
- Agregar type hints donde no los hay
- Cambiar estilo de comillas/blancos
- Agregar validaciones que nadie pidio
- Refactorizar "de paso"

*El diff debe mostrar solo las lineas que arreglan el problema.*

## 4. Goal-Driven Execution

Toda tarea debe tener criterios de exito verificables.

**Formato:**
1. Escribir test/reproduccion del estado actual
2. Verificar que falle (confirma el bug)
3. Implementar el cambio
4. Verificar que pase
5. Verificar que no haya regresion

*Sin criterio verificable = no empezar la implementacion.*

## Anti-Patterns Summary

| Principio | Anti-Patron | Fix |
|-----------|-------------|-----|
| Think Before Coding | Asumir calles, formato, alcance en silencio | Listar asunciones y preguntar |
| Simplicity First | Strategy pattern para un solo descuento | Una funcion hasta que se necesite mas |
| Surgical Changes | Reformatear comillas y agregar tipos mientras se arregla un bug | Solo cambiar las lineas del bug |
| Goal-Driven | "Voy a revisar y mejorar el codigo" | "Test para bug X → que pase → sin regresiones" |

## Clave

El codigo "bueno" no es el que sigue patrones de diseno, sino el que resuelve el problema de HOY de la manera mas simple. La complejidad se agrega cuando es necesaria, no antes.
