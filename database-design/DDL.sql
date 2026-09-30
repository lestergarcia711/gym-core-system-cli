CREATE DATABASE IF NOT EXISTS gym_core_system_db;
USE gym_core_system_db;

CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dpi VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(30) NOT NULL,
  last_name VARCHAR(30) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = INNODB;

CREATE TABLE training_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  duration_month INT NOT NULL,
  phisical_goals TEXT NOT NULL,
  level ENUM('principiante', 'intermedio', 'avanzado') NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  required_metrics JSON NOT NULL DEFAULT (JSON_ARRAY('Peso', 'Grasa')),
  CONSTRAINT chk_plan_duration CHECK (duration_month > 0),
  CONSTRAINT chk_plan_price CHECK (price >= 0)
) ENGINE = INNODB;

CREATE TABLE contracts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contract_code VARCHAR(60) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  plan_id INT NOT NULL,
  conditions TEXT NOT NULL,
  duration_month INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('activo', 'renovado', 'cancelado', 'completado') NOT NULL DEFAULT 'activo',
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (plan_id) REFERENCES training_plans(id),
  INDEX idx_contracts_customer_status (customer_id, status),
  CONSTRAINT chk_contract_dates CHECK (end_date > start_date),
  CONSTRAINT chk_contract_price CHECK (price >= 0)
) ENGINE = INNODB;

CREATE TABLE phisical_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  contract_id INT NOT NULL,
  week_number INT NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  body_fat_percentage DECIMAL(4,2) NOT NULL,
  measurements_json TEXT NOT NULL,
  photo_url VARCHAR(255),
  comments TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  UNIQUE KEY uq_tracking_contract_week (contract_id, week_number)
) ENGINE = INNODB;

CREATE TABLE nutrition_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  contract_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  INDEX idx_nutrition_contract (contract_id)
) ENGINE = INNODB;

CREATE TABLE nutrition_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nutrition_plan_id INT NOT NULL,
  day_of_week ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo') NOT NULL,
  meal_type ENUM('desayuno', 'almuerzo', 'cena', 'snack') NOT NULL,
  food_description VARCHAR(255) NOT NULL,
  estimated_calories INT NOT NULL,
  FOREIGN KEY (nutrition_plan_id) REFERENCES nutrition_plans(id),
  CONSTRAINT chk_item_calories CHECK (estimated_calories >= 0)
) ENGINE = INNODB;

CREATE TABLE financial_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT DEFAULT NULL,
  contract_id INT DEFAULT NULL,
  type ENUM('ingreso', 'egreso') NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  INDEX idx_ledger_date (transaction_date),
  CONSTRAINT chk_ledger_amount CHECK (amount > 0)
) ENGINE = INNODB;