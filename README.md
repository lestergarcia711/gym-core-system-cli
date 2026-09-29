# Gym Core System CLI

Aplicación de consola desarrollada con **Node.js, JavaScript y MySQL** para gestionar las operaciones principales de un sistema de gimnasio desde una interfaz CLI.

El proyecto está construido aplicando principios de **programación orientada a objetos, SOLID y patrones de diseño**, buscando mantener una arquitectura organizada, modular y fácil de extender.

Actualmente, el sistema organiza sus funcionalidades principales en módulos independientes para:

* Gestión de clientes.
* Gestión de planes y contratos.
* Gestión del seguimiento físico.
* Persistencia de información mediante MySQL.
* Ejecución de operaciones mediante una interfaz interactiva de consola.

---

## Tecnologías utilizadas

| Tecnología | Uso                                      |
| ---------- | ---------------------------------------- |
| Node.js    | Entorno de ejecución de JavaScript       |
| JavaScript | Lenguaje principal                       |
| MySQL      | Sistema de gestión de base de datos      |
| mysql2     | Conexión entre Node.js y MySQL           |
| Inquirer   | Interfaz interactiva para la consola     |
| Chalk      | Formateo y estilos visuales de la CLI    |
| dotenv     | Gestión de variables de entorno          |
| ES Modules | Sistema de módulos utilizado por Node.js |

El proyecto utiliza `"type": "module"` en `package.json`, por lo que trabaja con `import` y `export` en lugar del sistema CommonJS.

---

# Descripción del proyecto

**Gym Core System CLI** es un sistema de gestión para gimnasios ejecutado desde la terminal.

La aplicación busca centralizar diferentes operaciones administrativas y de seguimiento que normalmente pueden encontrarse separadas, proporcionando una interfaz sencilla mediante menús interactivos.

Al iniciar la aplicación se presenta un menú principal desde el cual el usuario puede seleccionar diferentes módulos:

```text
========================================
      GESTION DE GYM-CORE-SYSTEM
========================================

1. Gestión de Clientes.
2. Gestión de Planes y Contratos.
3. Gestión de Seguimiento Físico.
0. Salir del Sistema
```

La arquitectura separa cada módulo mediante comandos independientes. La clase principal `App` funciona como punto de entrada y delega la ejecución al comando correspondiente.

### Objetivos principales

* Practicar desarrollo backend con Node.js.
* Implementar una aplicación CLI modular.
* Integrar Node.js con MySQL.
* Aplicar principios SOLID.
* Utilizar patrones de diseño.
* Implementar operaciones transaccionales.
* Separar responsabilidades dentro del código.
* Facilitar futuras extensiones del sistema.

---

# Requisitos previos

Antes de ejecutar el proyecto se necesita tener instalado:

* **Node.js**
* **npm**
* **MySQL**
* Git

Se recomienda utilizar una versión moderna de Node.js compatible con las dependencias utilizadas por el proyecto.

Para comprobar las instalaciones:

```bash
node --version
```

```bash
npm --version
```

```bash
mysql --version
```

---

# Instalación

## 1. Clonar el repositorio

```bash
git clone https://github.com/lestergarcia711/gym-core-system-cli.git
```

Entrar al proyecto:

```bash
cd gym-core-system-cli
```

## 2. Instalar dependencias

Ejecutar:

```bash
npm install
```

Las dependencias principales están declaradas en `package.json` e incluyen `chalk`, `dotenv`, `inquirer` y `mysql2`.

---

# Configuración de la base de datos

El proyecto utiliza MySQL como sistema de persistencia.

Antes de ejecutar la aplicación es necesario disponer de una base de datos MySQL y configurar las credenciales de conexión.

## 1. Crear la base de datos

Crear la base de datos correspondiente utilizando MySQL.

Ejemplo:

```sql
CREATE DATABASE gym_core_system;
```

La estructura relacionada con la base de datos se encuentra dentro del directorio:

```text
database-design/
```

---

## 2. Configurar variables de entorno

El repositorio proporciona un archivo:

```text
.env.example
```

Este archivo contiene las variables necesarias para configurar la conexión:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=tu_base_datos
DB_PORT=3306
```

Crear el archivo `.env`:

```bash
cp .env.example .env
```

Posteriormente modificar sus valores:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=gym_core_system
DB_PORT=3306
```

> **Importante:** el archivo `.env` no debe compartirse ni subirse al repositorio cuando contiene credenciales reales.

---

# Ejecución

Una vez instaladas las dependencias y configurada la base de datos:

```bash
npm start
```

El proyecto también dispone de un modo de desarrollo utilizando el sistema `watch` de Node.js:

```bash
npm run dev
```

Los scripts están definidos en `package.json` de la siguiente manera:

```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "node --watch src/app.js"
  }
}
```

---

# Uso

Al ejecutar la aplicación se inicia el archivo:

```text
src/app.js
```

Este archivo crea una instancia de `App` y ejecuta:

```javascript
app.start();
```

La aplicación presenta un menú interactivo mediante **Inquirer**.

El usuario puede seleccionar:

### 1. Gestión de clientes

Permite acceder a las operaciones relacionadas con los clientes del gimnasio.

### 2. Gestión de planes y contratos

Permite trabajar con los planes disponibles y la relación contractual correspondiente.

### 3. Gestión de seguimiento físico

Permite gestionar la información relacionada con el seguimiento físico de los clientes.

### 0. Salir

Finaliza la ejecución del programa.

---

# Estructura del proyecto

> La separación por responsabilidades permite mantener la lógica de aplicación organizada y facilita incorporar nuevos módulos sin concentrar toda la lógica en un único archivo.


La clase `App` mantiene un registro de los módulos disponibles y selecciona el comando correspondiente según la opción elegida por el usuario.

---

# Principios SOLID aplicados

El proyecto está orientado a la aplicación de los principios **SOLID**, con el objetivo de conseguir un código más mantenible, extensible y desacoplado.

## S — Single Responsibility Principle

**Principio de Responsabilidad Única.**

Cada componente debe tener una responsabilidad principal.

La aplicación separa las funcionalidades en comandos independientes:

```javascript
ClientManagementCommand
PlanManagementCommand
TrackingManagementCommand
```

Esto evita colocar toda la lógica del sistema dentro de `app.js`.

La clase `App` se concentra principalmente en iniciar la aplicación, mostrar el menú y delegar la ejecución.

---

## O — Open/Closed Principle

**Principio abierto/cerrado.**

El sistema debe permitir agregar nuevas funcionalidades sin modificar constantemente el código existente.

La estructura basada en comandos permite incorporar nuevos módulos.

Por ejemplo, podría agregarse:

```text
PaymentManagementCommand
EmployeeManagementCommand
InventoryManagementCommand
```

y registrarlos como nuevos módulos.

---

## L — Liskov Substitution Principle

**Principio de Sustitución de Liskov.**

Los componentes especializados deben poder utilizarse dentro del flujo esperado sin romper el comportamiento del sistema.

La arquitectura basada en comandos favorece que diferentes comandos puedan ser tratados mediante una interfaz común de ejecución.

El punto central de esta abstracción es la operación:

```javascript
execute()
```

---

## I — Interface Segregation Principle

**Principio de Segregación de Interfaces.**

Las clases no deberían depender de métodos que no necesitan.

La separación por responsabilidades permite que cada módulo trabaje con las operaciones relacionadas directamente con su dominio en lugar de concentrar una interfaz enorme con funcionalidades no relacionadas.

---

## D — Dependency Inversion Principle

**Principio de Inversión de Dependencias.**

Las capas superiores deberían depender de abstracciones y no directamente de implementaciones concretas.

La organización mediante comandos, servicios, repositorios y fábricas permite separar:

```text
Interfaz CLI
      ↓
Comandos
      ↓
Servicios
      ↓
Persistencia
      ↓
MySQL
```

Esto facilita cambiar una implementación interna sin modificar necesariamente las capas superiores.

---

# Patrones de diseño utilizados

El proyecto utiliza patrones de diseño como parte de su arquitectura. Además, `package.json` declara explícitamente `factory-pattern` y `command-pattern` entre sus palabras clave.

## Command Pattern

El patrón **Command** encapsula una operación dentro de un objeto independiente.

En el proyecto se utiliza para representar los diferentes módulos de gestión:

```javascript
ClientManagementCommand
PlanManagementCommand
TrackingManagementCommand
```

Desde `App`, cada módulo puede ejecutarse mediante:

```javascript
await moduleCommand.execute();
```

Esto permite que `App` no necesite conocer los detalles internos de cada operación.

### Beneficio

Permite agregar nuevos comandos sin convertir el archivo principal en un bloque gigante de condiciones.

---

## Factory Pattern

El patrón **Factory** se utiliza para centralizar la creación de determinados objetos y evitar que el código cliente tenga que conocer directamente todos los detalles de construcción.

Su propósito dentro de la arquitectura es favorecer:

* Desacoplamiento.
* Reutilización.
* Centralización de creación de objetos.
* Facilidad para incorporar nuevas implementaciones.

---

# Transacciones

El proyecto contempla el uso de **transacciones MySQL** para aquellas operaciones que requieren mantener la consistencia de los datos.

Una transacción permite agrupar varias operaciones de base de datos como una única unidad lógica:

```text
BEGIN
  │
  ├── Operación 1
  │
  ├── Operación 2
  │
  └── Operación 3
  │
  ▼
COMMIT
```

Si ocurre un error:

```text
BEGIN
  │
  ├── Operación 1
  ├── Operación 2
  └── ERROR
       │
       ▼
     ROLLBACK
```

Esto evita dejar la base de datos en un estado parcialmente actualizado.

---

# Consideraciones técnicas

## Variables de entorno

Las credenciales y datos de conexión deben mantenerse fuera del código fuente.

La configuración se realiza mediante:

```text
.env
```

y se carga utilizando `dotenv`. El repositorio proporciona `.env.example` como plantilla de configuración.

---

## Persistencia

La aplicación utiliza:

```text
mysql2
```

para establecer la comunicación entre Node.js y MySQL.

---

## Interfaz de usuario

La interacción se realiza completamente desde la terminal.

`Inquirer` proporciona los menús interactivos y `Chalk` permite aplicar formato visual a los mensajes mostrados en consola.

---

## Modularidad

Las funcionalidades están divididas por dominios.

Esto facilita:

* Mantenimiento.
* Pruebas.
* Lectura del código.
* Incorporación de nuevas funcionalidades.
* Reducción del acoplamiento.

---

## Manejo de errores

Las operaciones que interactúan con la base de datos deben considerar escenarios como:

* Credenciales incorrectas.
* Base de datos no disponible.
* Registros inexistentes.
* Datos inválidos.
* Violaciones de restricciones SQL.
* Errores durante transacciones.

Una aplicación CLI que dependa de MySQL debe controlar estos escenarios para evitar que un error de persistencia provoque un cierre inesperado del sistema.

---

## Seguridad

Se recomienda:

* No subir `.env` al repositorio.
* Utilizar contraseñas seguras para MySQL.
* No escribir credenciales directamente en el código.
* Utilizar consultas parametrizadas.
* Validar los datos introducidos por el usuario.
* Mantener las dependencias actualizadas.
* Utilizar usuarios de base de datos con los permisos mínimos necesarios.

---

# Flujo de ejecución

El flujo principal de la aplicación es:

```text
Inicio
  │
  ▼
Carga de variables de entorno
  │
  ▼
Creación de la aplicación
  │
  ▼
Inicialización de módulos
  │
  ▼
Mostrar menú principal
  │
  ├── Clientes ──────────────► ClientManagementCommand
  │
  ├── Planes/Contratos ──────► PlanManagementCommand
  │
  ├── Seguimiento ───────────► TrackingManagementCommand
  │
  └── Salir ─────────────────► Finalizar aplicación
```

Este comportamiento está implementado en `src/app.js`.

---

# Scripts disponibles

## Iniciar aplicación

```bash
npm start
```

Ejecuta:

```text
node src/app.js
```

## Modo desarrollo

```bash
npm run dev
```

Ejecuta Node.js con `--watch`, permitiendo detectar cambios durante el desarrollo.

---

# Dependencias

Las principales dependencias del proyecto son:

```text
chalk
dotenv
inquirer
mysql2
```

### chalk

Se utiliza para mejorar visualmente los mensajes de la terminal.

### dotenv

Permite cargar las variables de configuración desde `.env`.

### inquirer

Permite construir menús y formularios interactivos en la consola.

### mysql2

Permite establecer comunicación entre Node.js y MySQL.

Estas dependencias están declaradas actualmente en `package.json`.

---

# Mejoras futuras

Algunas funcionalidades que pueden incorporarse en futuras versiones:

* Sistema de autenticación.
* Gestión de empleados.
* Gestión de pagos.
* Control de asistencia.
* Gestión de inventario.
* Reportes administrativos.
* Exportación de información.
* Pruebas automatizadas.
* Logging estructurado.
* Sistema de roles y permisos.
* Migraciones automatizadas de base de datos.
* Validación centralizada de entradas.
* Manejo de errores centralizado.

---

# Créditos

**Proyecto:** Gym Core System CLI

**Autor:** Lester Garcia

**Repositorio:**
https://github.com/lestergarcia711/gym-core-system-cli

