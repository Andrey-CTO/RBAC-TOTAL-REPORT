# TÓTAL Security & RBAC

Módulo centralizado de **Seguridad, Identidades, Roles y Control de Acceso** para el ecosistema TÓTAL.

El propósito de este proyecto es proporcionar un modelo común de autorización para:

- **TÓTAL REPORT®**
- **TÓTAL SUPERVISIÓN®**
- **TAX REPORT**
- **TOTALiA**
- **Seguridad / RBAC**

El módulo permite administrar quién puede acceder a cada producto, qué funcionalidades puede utilizar, qué acciones puede ejecutar y sobre qué entidades, formatos o recursos aplica dicha autorización.

---

## 1. Propósito

TÓTAL Security & RBAC centraliza la administración de autorizaciones del ecosistema y desacopla la definición de permisos de la ejecución de los procesos funcionales.

La regla arquitectónica principal es:

> **RBAC autoriza la operación; el producto funcional la ejecuta.**

Por ejemplo, la acción:

`Generar Transmisión`

puede existir dentro del catálogo RBAC para determinar si un usuario está autorizado a utilizarla.

Sin embargo, la transmisión propiamente dicha continúa siendo ejecutada por **TÓTAL REPORT®**, no por el módulo de Seguridad.

Esto permite mantener una separación clara entre:

- identidad;
- autenticación;
- autorización;
- procesos de negocio;
- gobierno;
- auditoría.

---

## 2. Modelo de autorización

El modelo conceptual utilizado por el módulo es:

```text
USUARIO
   │
   ▼
ENTIDAD
   │
   ▼
ROL
   │
   ▼
PRODUCTO
   │
   ▼
FUNCIONALIDAD
   │
   ▼
ACCIÓN
   │
   ▼
ALCANCE
   │
   ▼
PERMISO EFECTIVO
```

El permiso efectivo no depende exclusivamente de la existencia de una acción asignada.

Debe evaluarse dentro del contexto completo del usuario.

---

## 3. Conceptos principales

### Usuario

Representa una identidad que utiliza el ecosistema.

Una identidad puede corresponder a:

- un usuario humano;
- una identidad técnica o servicio de integración, cuando la arquitectura lo requiera.

El usuario tiene un estado que determina si puede operar.

---

### Entidad

Representa el ámbito organizacional o jurisdiccional sobre el cual el usuario puede trabajar.

Un usuario solamente debe visualizar o afectar información correspondiente a las entidades que tenga autorizadas.

---

### Producto

Representa un producto del ecosistema.

Inicialmente:

```text
TÓTAL REPORT®
TÓTAL SUPERVISIÓN®
TAX REPORT
TOTALiA
Seguridad / RBAC
```

Tener acceso a un producto **no implica acceso automático a todas sus funcionalidades**.

---

### Rol

Un Rol es una agrupación reutilizable de autorizaciones.

Ejemplos conceptuales:

```text
Administrador de Seguridad
Preparador
Aprobador
Firmante
Auditor
Operador Regulatorio
```

Un usuario puede tener uno o varios roles.

Los roles determinan las capacidades que el usuario hereda.

---

### Permiso

Representa una acción susceptible de autorización.

Ejemplos:

```text
Crear Usuarios
Actualizar Usuarios
Crear Roles
Actualizar Roles
Crear Fuente de Datos
Validar Formato
Aprobar Formatos
Firmar Formato
Generar Transmisión
Retransmitir
```

El catálogo de permisos constituye una pieza central del modelo RBAC.

---

### Permiso directo

Permite otorgar una autorización específica directamente a un usuario sin crear un rol adicional.

Debe utilizarse como excepción y no como sustituto del modelo basado en roles.

---

### Alcance

Define **sobre qué recurso** puede ejecutarse una acción.

Acción y alcance son dimensiones diferentes.

Ejemplo:

```text
Acción:
Generar Transmisión

Alcance:
MURIC
```

Esto significa:

> El usuario puede ejecutar la acción `Generar Transmisión`, pero únicamente para MURIC.

No debe crearse innecesariamente una acción independiente denominada:

```text
Generar Transmisión MURIC
```

---

## 4. Regla de alcance por formato

Cuando una acción pueda limitarse por formato, se utiliza la siguiente regla:

### Sin formatos específicos

```text
scopeMode = ALL
```

La autorización aplica a todos los formatos permitidos dentro del contexto.

### Con formatos específicos

```text
scopeMode = SELECTED
```

Ejemplo:

```json
{
  "scopeMode": "SELECTED",
  "resources": [
    "MURIC",
    "458"
  ]
}
```

En este caso la acción solamente aplica a los recursos seleccionados.

---

## 5. Componentes funcionales

### 5.1. Resumen

Dashboard de seguridad orientado a la administración del RBAC.

Puede presentar información como:

- usuarios activos;
- usuarios inactivos;
- usuarios sin roles;
- roles existentes;
- roles sin usuarios;
- accesos por producto;
- eventos recientes de seguridad.

No debe utilizarse como dashboard de negocio o dashboard regulatorio.

---

### 5.2. Usuarios

Permite administrar las identidades del sistema.

El flujo funcional contempla:

1. Identidad.
2. Entidades y productos.
3. Roles asignados.
4. Permisos directos.
5. Acceso efectivo.

El acceso efectivo representa el resultado consolidado de:

```text
Roles
+
Permisos directos
+
Entidad
+
Producto
+
Alcances
```

---

### 5.3. Roles

Permite crear y mantener las matrices reutilizables de autorización.

Un Rol debe permitir:

- creación;
- consulta;
- edición;
- activación o desactivación;
- copia de configuración cuando corresponda;
- administración de permisos;
- administración de alcances;
- consulta de usuarios vinculados.

Un rol existente **debe poder modificarse**.

Tener usuarios asociados no impide modificar un rol.

Sí debe impedir su eliminación mientras existan usuarios asociados.

---

### 5.4. Catálogo de permisos

Es el diccionario central de acciones autorizables del ecosistema.

El catálogo debe consolidar:

```text
Catálogo base existente
+
Extensiones funcionales del ecosistema
```

El catálogo histórico entregado para TÓTAL REPORT® contiene **265 acciones base**.

Los identificadores existentes deben conservarse para mantener trazabilidad y compatibilidad.

Las nuevas capacidades de:

- TÓTAL SUPERVISIÓN®;
- TOTALiA;
- Analítica;
- nuevos procesos de firma;
- nuevos procesos regulatorios;

pueden extender el catálogo sin alterar los identificadores existentes.

---

## 6. Catálogo consolidado

Las 265 acciones existentes representan la **línea base**, no el límite del RBAC.

Conceptualmente:

```text
CATÁLOGO CONSOLIDADO
│
├── Catálogo Base
│   └── 265 acciones existentes
│
└── Extensiones
    ├── TÓTAL SUPERVISIÓN®
    ├── Analítica
    ├── TOTALiA
    ├── Firmas
    ├── Nuevos procesos regulatorios
    └── Nuevas funcionalidades
```

Los Roles y Usuarios deben consumir un único catálogo consolidado.

---

## 7. Accesos y Políticas

El módulo contempla un centro de gobierno para analizar y administrar autorizaciones.

Sus capacidades incluyen:

### Catálogo de permisos

Consulta de las acciones disponibles dentro del ecosistema.

### Solicitudes de acceso

Flujo de solicitud y aprobación de nuevos accesos.

### Evaluador de políticas

Permite determinar por qué una identidad puede o no ejecutar una acción.

### Gobernanza y SoD

Control de combinaciones incompatibles de privilegios.

### Revisión de accesos

Recertificación periódica de las autorizaciones existentes.

---

## 8. Evaluador determinista de políticas

Una solicitud de autorización debe analizarse de manera determinista.

Flujo conceptual:

```text
1. IDENTIDAD
   │
   ├── ¿Está activa?
   │
   ▼
2. ENTIDAD
   │
   ├── ¿Tiene acceso a la entidad?
   │
   ▼
3. PRODUCTO
   │
   ├── ¿Tiene acceso al producto?
   │
   ▼
4. RBAC
   │
   ├── ¿Un rol o permiso directo autoriza la acción?
   │
   ▼
5. ALCANCE
   │
   ├── ¿El recurso solicitado está permitido?
   │
   ▼
6. VEREDICTO

   PERMITIR / DENEGAR
```

Además de entregar el resultado, el sistema debe ser capaz de explicar la causa de una denegación.

---

## 9. Segregación de Funciones — SoD

El modelo contempla **Segregation of Duties (SoD)** para detectar combinaciones incompatibles de privilegios.

Ejemplo conceptual:

```text
Preparador + Aprobador
```

o:

```text
Preparador + Firmante
```

cuando la política organizacional determine que dichas combinaciones constituyen un conflicto.

Las políticas SoD deben ser configurables y auditables.

---

## 10. Auditoría

Las operaciones relacionadas con Seguridad deben mantener trazabilidad.

Ejemplos:

```text
Usuario creado
Usuario actualizado
Usuario desactivado

Rol creado
Rol actualizado
Rol eliminado

Rol asignado
Rol retirado

Producto habilitado
Producto retirado

Permiso asignado
Permiso retirado

Alcance actualizado

Entidad asignada
Entidad retirada
```

Cada evento debe permitir identificar como mínimo:

- actor;
- operación;
- recurso;
- resultado;
- fecha/hora;
- contexto de la operación.

---

## 11. Arquitectura de integración recomendada

El RBAC debe comportarse como un servicio transversal del ecosistema.

```text
                   ┌──────────────────────────┐
                   │   Servicio de Seguridad   │
                   │          RBAC             │
                   │                          │
                   │  Roles · Permisos        │
                   │  Entidades · Alcances    │
                   │  Políticas · Auditoría   │
                   └─────────────┬────────────┘
                                 │
                  Decisión de autorización
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
      TÓTAL REPORT®     TÓTAL SUPERVISIÓN®     TAX REPORT
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                                 ▼
                              TOTALiA
```

Cada producto conserva sus procesos funcionales.

El servicio RBAC determina si la identidad puede ejecutarlos.

---

## 12. PEP — Policy Enforcement Point

Cada producto debe disponer de puntos donde las decisiones del RBAC sean obligatoriamente aplicadas.

Estos puntos se denominan:

**Policy Enforcement Points — PEP**

Por ejemplo:

```text
Usuario solicita:
Generar Transmisión de MURIC

        │
        ▼

API TÓTAL REPORT®
        │
        ▼
       PEP
        │
        ├──── Consulta autorización ────► RBAC
        │
        │                               │
        │◄────── Permit / Deny ─────────┘
        │
        ▼
Ejecuta o rechaza la operación
```

La seguridad NO debe depender únicamente de:

- ocultar botones;
- deshabilitar opciones;
- bloquear elementos del frontend.

La autorización debe verificarse también en la capa que ejecuta realmente la operación.

---

## 13. Separación entre autorización y ejecución

Ejemplo:

### Seguridad / RBAC

```text
[✓] Generar Transmisión

Alcance:
MURIC
```

Esto representa:

> El usuario está autorizado para generar transmisiones MURIC.

### TÓTAL REPORT®

Será el producto que realmente ejecute:

```text
Generar Transmisión
```

La aplicación RBAC no debe convertirse en una implementación paralela de los módulos operacionales.

---

## 14. Contrato lógico de autorización

Una integración con el servicio RBAC debe suministrar suficiente contexto para tomar una decisión.

Ejemplo conceptual:

```json
{
  "subject": {
    "userId": "USER_ID"
  },
  "context": {
    "entityId": "ENTITY_ID",
    "product": "TOTAL_REPORT"
  },
  "action": "GENERAR_TRANSMISION",
  "resource": {
    "type": "FORMAT",
    "id": "MURIC"
  }
}
```

Respuesta conceptual:

```json
{
  "decision": "ALLOW",
  "reason": "ROLE_PERMISSION",
  "scope": {
    "mode": "SELECTED",
    "resources": [
      "MURIC"
    ]
  }
}
```

> Los contratos definitivos de API deben definirse durante la construcción de la integración y versionarse formalmente.

---

## 15. Principios de seguridad

El módulo se concibe bajo los siguientes principios:

### Least Privilege

Otorgar únicamente los privilegios necesarios.

### Deny by Default

Una operación no autorizada explícitamente debe ser denegada.

### Separation of Duties

Evitar concentraciones incompatibles de privilegios.

### Centralización de políticas

Las reglas deben administrarse desde un catálogo central.

### Enforcement en backend

La autorización debe verificarse en la capa que ejecuta la operación.

### Auditabilidad

Los cambios de seguridad deben quedar registrados.

### Trazabilidad

Debe ser posible determinar cómo obtuvo un usuario un permiso.

---

## 16. Regla para modificación de Roles

Cuando un Rol es modificado:

```text
ROL
 │
 ├── Usuarios asociados
 │
 ├── Productos
 │
 ├── Permisos
 │
 └── Alcances
```

los permisos efectivos de los usuarios asociados deben recalcularse.

Ejemplo:

```text
ANTES

Rol Operador
Generar Transmisión → TODOS


CAMBIO

Generar Transmisión → MURIC


DESPUÉS

Usuarios asociados
Generar Transmisión → MURIC
```

Los cambios deben ser persistentes y auditables.

---

## 17. Eliminación de Roles

Un Rol:

### Puede modificarse

aunque tenga usuarios asociados.

### No puede eliminarse

si existen usuarios asociados.

Antes de eliminarlo deben retirarse o reasignarse sus asociaciones.

---

## 18. Integración con TÓTAL REPORT®

La integración debe realizarse progresivamente.

Ruta recomendada:

```text
1. Consolidar catálogo de permisos
          │
          ▼
2. Crear modelo de Roles y Alcances
          │
          ▼
3. Integrar Usuarios y Entidades
          │
          ▼
4. Exponer decisiones de autorización
          │
          ▼
5. Implementar PEP en TÓTAL REPORT®
          │
          ▼
6. Migrar funcionalidades progresivamente
          │
          ▼
7. Incorporar otros productos del ecosistema
```

La migración no debe destruir las asociaciones existentes de seguridad.

---

## 19. Capacidades funcionales cubiertas

La plataforma contempla gobierno sobre capacidades relacionadas con:

- Seguridad.
- Usuarios.
- Roles.
- Auditoría.
- Entidades.
- Configuración.
- Parámetros.
- Fuentes de datos.
- Formatos.
- Generación.
- Validaciones.
- Aprobaciones.
- Firmas.
- Transmisiones.
- Plantillas.
- Reportes.
- TAX.
- Maestros.
- Taxonomías.
- Reglas de negocio.
- Analítica.
- Nuevas funcionalidades del ecosistema.

Que una acción exista en este catálogo no significa que el RBAC la ejecute.

Significa que puede gobernar su autorización.

---

## 20. Navegación funcional

La aplicación se organiza conceptualmente en:

```text
Resumen
│
├── Usuarios
│
├── Roles
│
├── Accesos y Políticas
│   ├── Catálogo de Permisos
│   ├── Solicitudes
│   ├── Evaluador de Políticas
│   ├── Gobernanza y SoD
│   └── Revisión de Accesos
│
├── Cobertura Funcional
│
├── Productos
│
└── Auditoría
```

---

## 21. Flujo de creación de usuario

```text
Nuevo Usuario
     │
     ▼
Identidad
     │
     ▼
Entidades y Productos
     │
     ▼
Asignación de Roles
     │
     ▼
Permisos Directos
     │
     ▼
Acceso Efectivo
     │
     ▼
Guardar
```

---

## 22. Flujo de creación de Rol

```text
Nuevo Rol
   │
   ▼
Información General
   │
   ▼
Productos
   │
   ▼
Funcionalidades
   │
   ▼
Acciones
   │
   ▼
Alcances
   │
   ▼
Guardar
```

---

## 23. Alcance del proyecto

Este repositorio contiene la aplicación de administración de Seguridad y RBAC concebida para centralizar el gobierno de accesos del ecosistema TÓTAL.

No debe incorporar dentro de este módulo la ejecución de procesos propios de:

- TÓTAL REPORT®;
- TÓTAL SUPERVISIÓN®;
- TAX REPORT;
- TOTALiA.

Su responsabilidad es controlar y explicar la autorización.

---

## 24. Ejecución y construcción

Los comandos de instalación, desarrollo, pruebas y construcción deben corresponder a los scripts y dependencias definidos en el repositorio.

Antes de documentar comandos como:

```bash
npm install
npm run dev
npm run build
```

debe verificarse que correspondan efectivamente a los scripts definidos en el `package.json` del proyecto.

No modificar esta sección con comandos supuestos que no existan en el repositorio.

### Variables de entorno

Documentar aquí únicamente las variables efectivamente utilizadas por la aplicación.

Ejemplo de estructura:

```text
.env.example
```

No almacenar secretos, contraseñas, tokens o credenciales reales dentro del repositorio.

---

## 25. Recomendaciones para desarrollo

Toda nueva funcionalidad debe mantener las siguientes reglas:

1. No inventar permisos para completar la interfaz.
2. Utilizar el catálogo consolidado de acciones.
3. Separar Acción de Alcance.
4. No duplicar una acción por cada formato.
5. Mantener la compatibilidad con identificadores históricos.
6. No eliminar extensiones funcionales válidas.
7. No ejecutar procesos de negocio desde RBAC.
8. Aplicar controles de autorización también en backend.
9. Registrar cambios relevantes en auditoría.
10. Mantener el principio de mínimo privilegio.

---

## 26. Criterios de calidad

Los cambios sobre el módulo deben validar al menos:

- creación de usuario;
- edición de usuario;
- activación/desactivación;
- asignación de entidades;
- asignación de productos;
- asignación de Roles;
- permisos directos;
- cálculo de acceso efectivo;
- creación de Rol;
- edición de Rol;
- copia de Rol;
- eliminación controlada;
- configuración de permisos;
- configuración de alcance `ALL`;
- configuración de alcance `SELECTED`;
- evaluación de políticas;
- reglas SoD;
- auditoría;
- persistencia de los cambios.

---

## 27. Documentación relacionada

La documentación funcional y técnica del proyecto debe mantenerse alineada con:

- Arquitectura funcional del módulo RBAC.
- Manual de usuario.
- Catálogo de acciones de TÓTAL REPORT®.
- Contratos de integración.
- Modelo de datos.
- Políticas de seguridad.
- Matriz SoD.
- Estrategia de migración.

Los cambios que afecten el modelo de autorización deben actualizar la documentación correspondiente.

---

## 28. Estado del proyecto

El módulo constituye la base para evolucionar la seguridad existente de TÓTAL REPORT® hacia un modelo de autorización transversal para todo el ecosistema TÓTAL.

La integración definitiva debe mantener compatibilidad con la seguridad actual y permitir una transición progresiva hacia un servicio centralizado de autorización.

---

## 29. Producto

**TÓTAL REPORT® / Ecosistema TÓTAL**

Módulo:

**TÓTAL Security & RBAC**

---

## 30. Uso interno

Repositorio destinado al desarrollo, evolución, validación e integración del módulo de Seguridad y RBAC del ecosistema TÓTAL.

La distribución, publicación o utilización del código debe ajustarse a las políticas internas de la organización y a los acuerdos aplicables al producto.
