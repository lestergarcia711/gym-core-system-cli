# Gym Core System CLI

Aplicación de consola desarrollada con Node.js, JavaScript y MySQL para la gestión de clientes, planes y contratos, seguimiento físico, nutrición y operaciones financieras de un gimnasio.

## Instalación y uso

### Requisitos

- Node.js
- npm
- MySQL

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la base de datos

Ejecuta el script SQL incluido:

```bash
mysql -u root -p < database-design/DDL.sql
```

El script crea la base de datos `gym_core_system_db` y sus tablas.

### 3. Configurar variables de entorno

Copia `.env.example` como `.env` y configura las credenciales de MySQL:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=gym_core_system_db
DB_PORT=3306
```

### 4. Ejecutar

```bash
npm start
```

Para desarrollo:

```bash
npm run dev
```

## Estructura del proyecto

```text
gym-core-system-cli/
├── database-design/
│   ├── DDL.sql
│   └── RESULTADO.md
├── img/
│   └── diagrama-relacional.png
├── src/
│   ├── commands/
│   │   ├── ClientManagementCommand.js
│   │   ├── FinanceManagementCommand.js
│   │   ├── NutritionManagementCommand.js
│   │   ├── PlanManagementCommand.js
│   │   └── TrackingManagementCommand.js
│   ├── config/
│   │   ├── container.js
│   │   └── database.js
│   ├── models/
│   │   ├── Contract.js
│   │   ├── Customer.js
│   │   ├── FinancialTransaction.js
│   │   ├── NutritionItem.js
│   │   ├── NutritionPlan.js
│   │   ├── PhisicalTracking.js
│   │   └── TrainingPlan.js
│   ├── services/
│   │   ├── ClientService.js
│   │   ├── ContractService.js
│   │   ├── FinanceService.js
│   │   ├── NutritionService.js
│   │   ├── PlanService.js
│   │   └── TrackingService.js
│   ├── utils/
│   │   ├── ContractFactory.js
│   │   └── TransactionManager.js
│   └── app.js
├── .env.example
├── package.json
└── package-lock.json
```

## Principios SOLID aplicados

- **Single Responsibility Principle (SRP):** las responsabilidades están separadas por módulos. Los `commands` gestionan la interacción de consola, los `services` contienen operaciones de negocio, los `models` representan entidades y `database.js` gestiona la conexión.
- **Dependency Inversion Principle (DIP):** `ContractService`, `FinanceService` y `NutritionService` reciben sus dependencias (`transactionManager` y `database`) mediante el constructor. Estas dependencias se configuran en `src/config/container.js`.

## Patrones de diseño

### Command

Los módulos de interacción de consola están implementados como clases `*ManagementCommand`, cada una con un método `execute()`:

- `ClientManagementCommand`: gestión de clientes.
- `PlanManagementCommand`: gestión de planes y contratos.
- `TrackingManagementCommand`: seguimiento físico.
- `NutritionManagementCommand`: gestión de nutrición.
- `FinanceManagementCommand`: gestión financiera.

`src/app.js` mantiene estos módulos y ejecuta el comando correspondiente al módulo seleccionado.

### Factory

`src/utils/ContractFactory.js` implementa la creación de contratos mediante `ContractFactory.createContract()`.

Centraliza la construcción de `Contract`, incluyendo código de contrato, duración, fechas, precio, condiciones y estado inicial.

### Dependency Injection / Container

`src/config/container.js` centraliza la construcción de `TransactionManager`, `ContractService`, `FinanceService` y `NutritionService`, inyectando sus dependencias.

## Consideraciones técnicas

- El proyecto utiliza **ES Modules** mediante `"type": "module"` en `package.json`.
- La persistencia utiliza **MySQL** mediante `mysql2/promise`.
- Las operaciones SQL utilizan parámetros preparados mediante `connection.execute()` / `pool.execute()`.
- Las operaciones de contratos, pagos y nutrición utilizan `TransactionManager` para ejecutar transacciones con `BEGIN`, `COMMIT` y `ROLLBACK`.
- La base de datos utiliza **InnoDB**, claves foráneas, restricciones `CHECK`, índices y algunas claves únicas.
- Las operaciones financieras convierten los importes a centavos para realizar cálculos monetarios.
- `dayjs` se utiliza para el manejo y validación de fechas.
- `dotenv` carga la configuración desde variables de entorno.
- La interfaz de consola utiliza `inquirer` y `@inquirer/prompts`, junto con `chalk` para la salida formateada.
- No existe un script de pruebas definido en `package.json`.
- La estructura de la base de datos y sus relaciones se documentan adicionalmente en `database-design/RESULTADO.md`.

## Créditos

- **Autor:** lestergarcia711
- **Proyecto:** `gym-core-system-cli`
- **Licencia:** ISC
- **Repositorio:** https://github.com/lestergarcia711/gym-core-system-cli
