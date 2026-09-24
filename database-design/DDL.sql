Drop DATABASE IF EXISTS gym_core_system_db;
CREATE DATABASE IF NOT EXISTS gym_core_system_db;
USE gym_core_system_db;

CREATE TABLE customers(
id INT PRIMARY KEY AUTO_INCREMENT,
dpi VARCHAR(20) UNIQUE NOT NULL,
first_name VARCHAR(30) NOT NULL,
last_name VARCHAR(30) NOT NULL,
email VARCHAR(150)UNIQUE NOT NULL,
phone_number VARCHAR(20) NOT NULL,
active BIT(1) DEFAULT b'1',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)ENGINE = INNODB;


CREATE TABLE training_plans(
id INT PRIMARY KEY auto_increment,
name VARCHAR(100) NOT NULL,
duration_month INT NOT NULL,
phisical_goals TEXT NOT NULL,
level ENUM('principiante', 'intermedio', 'avanzado') NOT NULL,
active BIT(1) DEFAULT b'1',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)ENGINE = INNODB;

CREATE TABLE contracts(
id INT PRIMARY KEY AUTO_INCREMENT,
contract_code VARCHAR(60) UNIQUE NOT NULL,
customer_id INT NOT NULL,
plan_id INT NOT NULL,
conditions TEXT NOT NULL,
duration_month INT NOT NULL,
price DECIMAL(10,2)NOT NULL,
start_date DATE NOT NULL,
end_date DATE NOT NULL,
status ENUM('activo','renovado', 'cancelado', 'completado') default 'activo',
FOREIGN KEY(customer_id)REFERENCES customers(id),
FOREIGN KEY(plan_id)REFERENCES training_plans(id)
)ENGINE =INNODB;

CREATE TABLE phisical_tracking (
id INT PRIMARY KEY  AUTO_INCREMENT,
customer_id INT NOT NULL,
contract_id INT NOT NULL,
week_number INT NOT NULL,
weight_kg DECIMAL(5,2) NOT NULL,
body_fat_percentage DECIMAL (4,2) NOT NULL,
measurements_json TEXT NOT NULL,
photo_url VARCHAR(255),
comments TEXT,
recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(customer_id)REFERENCES customers(id),
FOREIGN KEY(contract_id)REFERENCES contracts(id)
)ENGINE = INNODB;

CREATE TABLE nutritional_plans (
id INT PRIMARY KEY AUTO_INCREMENT,
customer_id INT NOT NULL,
contract_id INT NOT NULL,
days_of_week ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo')NOT NULL,
food_description TEXT NOT NULL,
estimates_calories INT NOT NULL,
FOREIGN KEY(customer_id)REFERENCES customers(id),
FOREIGN KEY(contract_id)REFERENCES contracts(id)
)ENGINE = INNODB;

CREATE TABLE financial_ledger(
id INT AUTO_INCREMENT PRIMARY KEY,
customer_id INT DEFAULT NULL,
contract_id INT DEFAULT NULL,
type ENUM('ingreso', 'egreso') NOT NULL,
category VARCHAR(100) NOT NULL,
amount DECIMAL(10,2) NOT NULL,
transaction_date DATE NOT NULL,
description TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(customer_id)REFERENCES customers(id),
FOREIGN KEY(contract_id)REFERENCES contracts(id)
)ENGINE = INNODB;









