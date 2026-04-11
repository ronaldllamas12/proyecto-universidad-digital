# Guion Hablado - Presentacion Universidad Digital

## Guion para la version de 6 slides (5 minutos)

## Slide 1 - Problema y solucion (35-45 segundos)

Hoy presento Universidad Digital, una plataforma para gestionar procesos academicos con tres perfiles: administrador, docente y estudiante.
La solucion integra frontend, backend y base de datos bajo un enfoque seguro y mantenible.
El objetivo principal fue asegurar operaciones academicas confiables con calidad automatizada antes de liberar cambios.

## Slide 2 - Arquitectura general (45-55 segundos)

La arquitectura es de tres capas.
El usuario interactua con un frontend React.
Ese frontend consume una API REST en FastAPI, y la API persiste datos en PostgreSQL.
La seguridad cruza toda la arquitectura con autenticacion por token y autorizacion por roles.
Esto nos permite escalar cada capa de forma independiente y controlar mejor los riesgos.

## Slide 3 - Backend por dominios (45-55 segundos)

En backend trabajamos por dominios funcionales como usuarios, materias, periodos, inscripciones y calificaciones.
Cada dominio repite un patron estable: modelos, esquemas, servicios y rutas.
Con esto desacoplamos reglas de negocio de la capa HTTP y hacemos mas simples las pruebas unitarias e integracion.
Es una base buena para crecimiento y mantenibilidad.

## Slide 4 - Pipeline CI/CD (55-65 segundos)

A nivel DevOps, el pipeline primero ejecuta calidad continua.
Corremos pruebas de backend y frontend, cobertura, mantenibilidad, estabilidad y performance.
Despues pasamos por un quality gate fullstack.
Solo si ese gate aprueba, se activa CD y se despliega backend y frontend usando deploy hooks.
Este flujo reduce regresiones y protege la salida a produccion.

## Slide 5 - Entornos y despliegue (35-45 segundos)

Tenemos coherencia entre local y cloud.
En local usamos Docker Compose para frontend, backend y base de datos.
En cloud el backend vive en Render, y el frontend se publica en hosting estatico.
Separamos configuracion por variables de entorno para no tocar codigo al cambiar de entorno.

## Slide 6 - Cierre (30-40 segundos)

En resumen, el proyecto logra una arquitectura modular, seguridad por rol y una disciplina de calidad automatizada.
Como siguiente paso, proponemos consolidar arquitectura y pipeline como artefactos versionados para auditoria tecnica.
Con esto cerramos con una plataforma funcional hoy, y preparada para escalar manana.

---

## Frases de apoyo por si hay preguntas del jurado

- Sobre seguridad: "Aplicamos controles de sesion segura y autorizacion por rol en backend, no solo en frontend".
- Sobre calidad: "El despliegue depende de quality gates, no de validacion manual".
- Sobre mantenibilidad: "La estructura por dominios evita que el backend se convierta en un bloque monolitico dificil de probar".
- Sobre roadmap: "El siguiente salto es observabilidad operativa y metricas DORA para medir eficiencia del ciclo de entrega".
