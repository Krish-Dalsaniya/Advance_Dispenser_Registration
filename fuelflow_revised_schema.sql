-- ============================================================
--  FUELFLOW ERP — REVISED SCHEMA (PostgreSQL)
--  Aligned to Team Lead's Updated Workflow
-- ============================================================
--
--  KEY WORKFLOW CHANGES FROM PREVIOUS VERSION:
--
--  A. DISPENSER MODEL  →  now defined by a fixed matrix:
--       dispenser_series  (Nitro / Hydro / Oxy / Ozone / Titan / Helium)
--       dispenser_type    (Mini / Tower / Storage)
--       fuel_type         (DEF / Diesel)
--     All six product lines are enforced via CHECK constraints.
--
--  B. PRODUCT MASTER  →  model + physical hardware components
--     assembled by the company.  This is the "catalogue" product
--     visible in the sales book.
--
--  C. CUSTOMER ORDER  →  customer first decides:
--       (i)  IoT-based  OR  Non-IoT dispenser
--       (ii) If IoT, they configure:
--              • Nozzle count        (1 / 2 / 3 / 4)
--              • Dispensing speed    (4 / 21)
--              • Connectivity        (Ethernet / WiFi / Bluetooth /
--                                     ModbusRS485 / GSM2G / GSM4G / GPS)
--              • Keyboard format     (4x6 / 5x5)
--
--  D. FIRMWARE VERSION  →  every IoT order generates a unique
--     firmware_version record (version string + UUID).
--     This version_id drives future OTA updates.
--
--  E. OTA UPDATE TABLE  →  new table to track every OTA push
--     issued against a device's firmware_version.
--
--  ALL existing fixes from the previous revision are retained.
-- ============================================================


-- ============================================================
-- 1. USER & ACCESS CONTROL TABLES (unchanged from v1)
-- ============================================================

CREATE TABLE user_role_master (
    role_id          VARCHAR(36)  PRIMARY KEY,
    role_name        VARCHAR(100) NOT NULL UNIQUE,
    role_description VARCHAR(255),
    is_active        BOOLEAN      DEFAULT TRUE,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permission_master (
    permission_id   VARCHAR(36)  PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL,
    module_name     VARCHAR(100) NOT NULL,
    description     VARCHAR(255),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_master (
    user_id        VARCHAR(36)  PRIMARY KEY,
    role_id        VARCHAR(36)  NOT NULL,
    username       VARCHAR(100) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    first_name     VARCHAR(100),
    last_name      VARCHAR(100),
    email          VARCHAR(150) UNIQUE,
    mobile_no      VARCHAR(20),
    department     VARCHAR(100),
    designation    VARCHAR(100),
    is_active      BOOLEAN      DEFAULT TRUE,
    last_login     TIMESTAMP,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES user_role_master(role_id)
);

CREATE TABLE role_permission_map (
    id            VARCHAR(36)  PRIMARY KEY,
    role_id       VARCHAR(36)  NOT NULL,
    permission_id VARCHAR(36)  NOT NULL,
    can_view      BOOLEAN      DEFAULT FALSE,
    can_create    BOOLEAN      DEFAULT FALSE,
    can_edit      BOOLEAN      DEFAULT FALSE,
    can_delete    BOOLEAN      DEFAULT FALSE,
    can_approve   BOOLEAN      DEFAULT FALSE,
    UNIQUE (role_id, permission_id),
    FOREIGN KEY (role_id)       REFERENCES user_role_master(role_id),
    FOREIGN KEY (permission_id) REFERENCES permission_master(permission_id)
);


-- ============================================================
-- 2. CUSTOMER & SITE TABLES (unchanged from v1)
-- ============================================================

CREATE TABLE customer_master (
    customer_id    VARCHAR(36)  PRIMARY KEY,
    customer_code  VARCHAR(50)  UNIQUE,
    customer_name  VARCHAR(150) NOT NULL,
    company_name   VARCHAR(200),
    contact_person VARCHAR(150),
    mobile_no      VARCHAR(20),
    email          VARCHAR(150),
    address_line1  VARCHAR(255),
    address_line2  VARCHAR(255),
    city           VARCHAR(100),
    state          VARCHAR(100),
    country        VARCHAR(100) DEFAULT 'India',
    pincode        VARCHAR(10),
    gst_no         VARCHAR(20),
    status         VARCHAR(20)  DEFAULT 'active',
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_location_master (
    site_location_id VARCHAR(36)  PRIMARY KEY,
    customer_id      VARCHAR(36)  NOT NULL,
    site_name        VARCHAR(200),
    address_line1    VARCHAR(255),
    address_line2    VARCHAR(255),
    city             VARCHAR(100),
    state            VARCHAR(100),
    country          VARCHAR(100) DEFAULT 'India',
    pincode          VARCHAR(20),
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer_master(customer_id)
);


-- ============================================================
-- 3. COMPONENT MASTER TABLES (unchanged from v1)
--    All retain standardised soft-delete audit columns.
-- ============================================================

CREATE TABLE gsm_tech_master (
    gsm_tech_id        VARCHAR(36)  PRIMARY KEY,
    tech_name          VARCHAR(50)  NOT NULL,
    tech_description   VARCHAR(255),
    frequency_band     VARCHAR(100),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE motherboard_master (
    motherboard_id          VARCHAR(36)  PRIMARY KEY,
    mcu_id                  VARCHAR(100),
    esp32_mac_address       VARCHAR(20),
    ethernet_mac_address    VARCHAR(20),
    bt_mac_address          VARCHAR(20),
    power_mcu_id            VARCHAR(100),
    pcb_number              VARCHAR(100),
    production_serial_no    VARCHAR(100) UNIQUE,
    manufacturing_date_time TIMESTAMP,
    manufacturing_batch     VARCHAR(50),
    entry_done_by           VARCHAR(36),
    entry_date_time         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address        VARCHAR(45),
    entry_location          VARCHAR(255),
    is_deleted              BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id      VARCHAR(36),
    delete_date_time        TIMESTAMP,
    delete_location         VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE motherboard_firmware_master (
    mb_firmware_id       VARCHAR(36)  PRIMARY KEY,
    motherboard_id       VARCHAR(36)  NOT NULL,
    version_no           VARCHAR(20),
    firmware_description VARCHAR(255),
    file_name            VARCHAR(255),
    checksum             VARCHAR(100),
    entry_done_by        VARCHAR(36),
    entry_date_time      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address     VARCHAR(45),
    entry_location       VARCHAR(255),
    is_deleted           BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id   VARCHAR(36),
    delete_date_time     TIMESTAMP,
    delete_location      VARCHAR(255),
    FOREIGN KEY (motherboard_id)     REFERENCES motherboard_master(motherboard_id),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE motherboard_firmware_feature_master (
    mb_feature_id       VARCHAR(36)  PRIMARY KEY,
    version_no          VARCHAR(20),
    feature_name        VARCHAR(150),
    feature_description VARCHAR(500),
    entry_done_by       VARCHAR(36),
    entry_date_time     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address    VARCHAR(45),
    entry_location      VARCHAR(255),
    is_deleted          BOOLEAN      DEFAULT FALSE,
    FOREIGN KEY (entry_done_by) REFERENCES user_master(user_id)
);

CREATE TABLE gsm_master (
    gsm_id                  VARCHAR(36)  PRIMARY KEY,
    mcu_id                  VARCHAR(100),
    gsm_tech_id             VARCHAR(36),
    pcb_number              VARCHAR(100),
    production_serial_no    VARCHAR(100) UNIQUE,
    manufacturing_date_time TIMESTAMP,
    manufacturing_batch     VARCHAR(50),
    entry_done_by           VARCHAR(36),
    entry_date_time         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address        VARCHAR(45),
    entry_location          VARCHAR(255),
    is_deleted              BOOLEAN      DEFAULT FALSE,
    is_damaged              BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id      VARCHAR(36),
    delete_date_time        TIMESTAMP,
    delete_location         VARCHAR(255),
    FOREIGN KEY (gsm_tech_id)        REFERENCES gsm_tech_master(gsm_tech_id),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE gsm_firmware_master (
    gsm_firmware_id      VARCHAR(36)  PRIMARY KEY,
    gsm_id               VARCHAR(36)  NOT NULL,
    version_no           VARCHAR(20),
    firmware_description VARCHAR(255),
    file_name            VARCHAR(255),
    checksum             VARCHAR(100),
    entry_done_by        VARCHAR(36),
    entry_date_time      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address     VARCHAR(45),
    entry_location       VARCHAR(255),
    is_deleted           BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id   VARCHAR(36),
    delete_date_time     TIMESTAMP,
    delete_location      VARCHAR(255),
    FOREIGN KEY (gsm_id)             REFERENCES gsm_master(gsm_id),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE pump_master (
    pump_id               VARCHAR(36)  PRIMARY KEY,
    pump_serial_no        VARCHAR(100) UNIQUE,
    model_no              VARCHAR(100),
    manufacturer          VARCHAR(150),
    entry_done_by         VARCHAR(36),
    entry_date_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address      VARCHAR(45),
    entry_location        VARCHAR(255),
    is_deleted            BOOLEAN      DEFAULT FALSE,
    is_damaged            BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id    VARCHAR(36),
    delete_date_time      TIMESTAMP,
    delete_location       VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE solenoid_valve_master (
    solenoid_valve_id  VARCHAR(36)  PRIMARY KEY,
    solenoid_serial_no VARCHAR(100) UNIQUE,
    model_no           VARCHAR(100),
    manufacturer       VARCHAR(150),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE flowmeter_master (
    flowmeter_id        VARCHAR(36)  PRIMARY KEY,
    flowmeter_serial_no VARCHAR(100) UNIQUE,
    model_no            VARCHAR(100),
    manufacturer        VARCHAR(150),
    entry_done_by       VARCHAR(36),
    entry_date_time     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address    VARCHAR(45),
    entry_location      VARCHAR(255),
    is_deleted          BOOLEAN      DEFAULT FALSE,
    is_damaged          BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id  VARCHAR(36),
    delete_date_time    TIMESTAMP,
    delete_location     VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE flowmeter_firmware_master (
    flowmeter_firmware_id VARCHAR(36)  PRIMARY KEY,
    flowmeter_id          VARCHAR(36)  NOT NULL,
    version_no            VARCHAR(20),
    firmware_description  VARCHAR(255),
    file_name             VARCHAR(255),
    checksum              VARCHAR(100),
    entry_done_by         VARCHAR(36),
    entry_date_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address      VARCHAR(45),
    entry_location        VARCHAR(255),
    is_deleted            BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id    VARCHAR(36),
    delete_date_time      TIMESTAMP,
    delete_location       VARCHAR(255),
    FOREIGN KEY (flowmeter_id)       REFERENCES flowmeter_master(flowmeter_id),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE nozzle_master (
    nozzle_id          VARCHAR(36)  PRIMARY KEY,
    nozzle_serial_no   VARCHAR(100) UNIQUE,
    nozzle_type        VARCHAR(50),
    manufacturer       VARCHAR(150),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE filter_master (
    filter_id          VARCHAR(36)  PRIMARY KEY,
    filter_serial_no   VARCHAR(100) UNIQUE,
    filter_type        VARCHAR(50),
    model_no           VARCHAR(100),
    manufacturer       VARCHAR(150),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE smps_master (
    smps_id            VARCHAR(36)  PRIMARY KEY,
    smps_serial_no     VARCHAR(100) UNIQUE,
    model_no           VARCHAR(100),
    manufacturer       VARCHAR(150),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE relay_box_master (
    relay_box_id        VARCHAR(36)  PRIMARY KEY,
    relay_box_serial_no VARCHAR(100) UNIQUE,
    model_no            VARCHAR(100),
    manufacturer        VARCHAR(150),
    entry_done_by       VARCHAR(36),
    entry_date_time     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address    VARCHAR(45),
    entry_location      VARCHAR(255),
    is_deleted          BOOLEAN      DEFAULT FALSE,
    is_damaged          BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id  VARCHAR(36),
    delete_date_time    TIMESTAMP,
    delete_location     VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE transformer_master (
    transformer_id        VARCHAR(36)  PRIMARY KEY,
    transformer_serial_no VARCHAR(100) UNIQUE,
    input_voltage         VARCHAR(20),
    output_voltage        VARCHAR(20),
    rating                VARCHAR(50),
    entry_done_by         VARCHAR(36),
    entry_date_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address      VARCHAR(45),
    entry_location        VARCHAR(255),
    is_deleted            BOOLEAN      DEFAULT FALSE,
    is_damaged            BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id    VARCHAR(36),
    delete_date_time      TIMESTAMP,
    delete_location       VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE emi_emc_filter_master (
    emi_emc_filter_id  VARCHAR(36)  PRIMARY KEY,
    filter_serial_no   VARCHAR(100) UNIQUE,
    rating             VARCHAR(50),
    model_no           VARCHAR(100),
    manufacturer       VARCHAR(150),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE printer_master (
    printer_id         VARCHAR(36)  PRIMARY KEY,
    printer_serial_no  VARCHAR(100) UNIQUE,
    printer_type       VARCHAR(50),
    model_no           VARCHAR(100),
    manufacturer       VARCHAR(150),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE printer_firmware_master (
    printer_firmware_id  VARCHAR(36)  PRIMARY KEY,
    printer_id           VARCHAR(36)  NOT NULL,
    version_no           VARCHAR(20),
    firmware_description VARCHAR(255),
    file_name            VARCHAR(255),
    checksum             VARCHAR(100),
    entry_done_by        VARCHAR(36),
    entry_date_time      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address     VARCHAR(45),
    entry_location       VARCHAR(255),
    is_deleted           BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id   VARCHAR(36),
    delete_date_time     TIMESTAMP,
    delete_location      VARCHAR(255),
    FOREIGN KEY (printer_id)         REFERENCES printer_master(printer_id),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE battery_master (
    battery_id         VARCHAR(36)  PRIMARY KEY,
    battery_serial_no  VARCHAR(100) UNIQUE,
    battery_type       VARCHAR(50),
    capacity           VARCHAR(50),
    manufacturer       VARCHAR(150),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE speaker_master (
    speaker_id         VARCHAR(36)  PRIMARY KEY,
    speaker_serial_no  VARCHAR(100) UNIQUE,
    model_no           VARCHAR(100),
    manufacturer       VARCHAR(150),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE amplifier_master (
    amplifier_id        VARCHAR(36)  PRIMARY KEY,
    amplifier_serial_no VARCHAR(100) UNIQUE,
    model_no            VARCHAR(100),
    manufacturer        VARCHAR(150),
    entry_done_by       VARCHAR(36),
    entry_date_time     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address    VARCHAR(45),
    entry_location      VARCHAR(255),
    is_deleted          BOOLEAN      DEFAULT FALSE,
    is_damaged          BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id  VARCHAR(36),
    delete_date_time    TIMESTAMP,
    delete_location     VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE tank_sensor_master (
    tank_sensor_id        VARCHAR(36)  PRIMARY KEY,
    tank_sensor_serial_no VARCHAR(100) UNIQUE,
    model_no              VARCHAR(100),
    manufacturer          VARCHAR(150),
    entry_done_by         VARCHAR(36),
    entry_date_time       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address      VARCHAR(45),
    entry_location        VARCHAR(255),
    is_deleted            BOOLEAN      DEFAULT FALSE,
    is_damaged            BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id    VARCHAR(36),
    delete_date_time      TIMESTAMP,
    delete_location       VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE tank_sensor_firmware_master (
    tank_sensor_firmware_id VARCHAR(36)  PRIMARY KEY,
    tank_sensor_id          VARCHAR(36)  NOT NULL,
    version_no              VARCHAR(20),
    firmware_description    VARCHAR(255),
    file_name               VARCHAR(255),
    checksum                VARCHAR(100),
    entry_done_by           VARCHAR(36),
    entry_date_time         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address        VARCHAR(45),
    entry_location          VARCHAR(255),
    is_deleted              BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id      VARCHAR(36),
    delete_date_time        TIMESTAMP,
    delete_location         VARCHAR(255),
    FOREIGN KEY (tank_sensor_id)     REFERENCES tank_sensor_master(tank_sensor_id),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE quality_sensor_master (
    quality_sensor_id        VARCHAR(36)  PRIMARY KEY,
    quality_sensor_serial_no VARCHAR(100) UNIQUE,
    model_no                 VARCHAR(100),
    manufacturer             VARCHAR(150),
    entry_done_by            VARCHAR(36),
    entry_date_time          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address         VARCHAR(45),
    entry_location           VARCHAR(255),
    is_deleted               BOOLEAN      DEFAULT FALSE,
    is_damaged               BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id       VARCHAR(36),
    delete_date_time         TIMESTAMP,
    delete_location          VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE rccb_master (
    rccb_id            VARCHAR(36)  PRIMARY KEY,
    rccb_serial_no     VARCHAR(100) UNIQUE,
    model_no           VARCHAR(100),
    manufacturer       VARCHAR(150),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE spd_master (
    spd_id             VARCHAR(36)  PRIMARY KEY,
    spd_serial_no      VARCHAR(100) UNIQUE,
    model_no           VARCHAR(100),
    manufacturer       VARCHAR(150),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE back_panel_pcb_master (
    back_panel_pcb_id  VARCHAR(36)  PRIMARY KEY,
    pcb_serial_no      VARCHAR(100) UNIQUE,
    pcb_version        VARCHAR(20),
    manufacturer       VARCHAR(150),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE dc_meter_master (
    dc_meter_id        VARCHAR(36)  PRIMARY KEY,
    dc_motor_serial_no VARCHAR(100) UNIQUE,
    manufacturer       VARCHAR(150),
    entry_done_by      VARCHAR(36),
    entry_date_time    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address   VARCHAR(45),
    entry_location     VARCHAR(255),
    is_deleted         BOOLEAN      DEFAULT FALSE,
    is_damaged         BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id VARCHAR(36),
    delete_date_time   TIMESTAMP,
    delete_location    VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE pressure_sensor_master (
    pressure_sensor_id        VARCHAR(36)  PRIMARY KEY,
    pressure_sensor_serial_no VARCHAR(100) UNIQUE,
    model_no                  VARCHAR(100),
    manufacturer              VARCHAR(150),
    entry_done_by             VARCHAR(36),
    entry_date_time           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address          VARCHAR(45),
    entry_location            VARCHAR(255),
    is_deleted                BOOLEAN      DEFAULT FALSE,
    is_damaged                BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id        VARCHAR(36),
    delete_date_time          TIMESTAMP,
    delete_location           VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);


-- ============================================================
-- 4. DISPENSER MODEL MASTER  [REVISED]
--
--  Each dispenser model is now identified by a SERIES NAME
--  which encodes both the dispenser_type and fuel_type:
--
--    Series    │ Dispenser Type │ Fuel Type
--    ──────────┼────────────────┼──────────
--    Nitro     │ Mini           │ DEF
--    Hydro     │ Mini           │ Diesel
--    Oxy       │ Tower          │ DEF
--    Ozone     │ Tower          │ Diesel
--    Titan     │ Storage        │ DEF
--    Helium    │ Storage        │ Diesel
--
--  The dispenser_type and fuel_type columns are derived from
--  the series and stored for easy querying / filtering.
--  A CHECK constraint prevents invalid combinations.
-- ============================================================

CREATE TABLE dispenser_model_master (
    dispenser_model_id  VARCHAR(36)  PRIMARY KEY,

    -- NEW: series name replaces freeform dispenser_type + fuel_type
    series_name         VARCHAR(20)  NOT NULL
                            CHECK (series_name IN ('Nitro','Hydro','Oxy','Ozone','Titan','Helium')),

    -- Derived / stored for convenience — set by application logic
    dispenser_type      VARCHAR(20)  NOT NULL
                            CHECK (dispenser_type IN ('Mini','Tower','Storage')),
    fuel_type           VARCHAR(20)  NOT NULL
                            CHECK (fuel_type IN ('DEF','Diesel')),

    -- Ensure series ↔ type+fuel consistency at DB level
    CONSTRAINT chk_series_type_fuel CHECK (
        (series_name = 'Nitro'  AND dispenser_type = 'Mini'    AND fuel_type = 'DEF')    OR
        (series_name = 'Hydro'  AND dispenser_type = 'Mini'    AND fuel_type = 'Diesel') OR
        (series_name = 'Oxy'    AND dispenser_type = 'Tower'   AND fuel_type = 'DEF')    OR
        (series_name = 'Ozone'  AND dispenser_type = 'Tower'   AND fuel_type = 'Diesel') OR
        (series_name = 'Titan'  AND dispenser_type = 'Storage' AND fuel_type = 'DEF')    OR
        (series_name = 'Helium' AND dispenser_type = 'Storage' AND fuel_type = 'Diesel')
    ),

    model_name          VARCHAR(150) NOT NULL,  -- e.g. "Nitro-X1", "Hydro-Pro-D2"
    model_description   TEXT,

    entry_done_by       VARCHAR(36),
    entry_date_time     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    entry_ip_address    VARCHAR(45),
    entry_location      VARCHAR(255),
    is_deleted          BOOLEAN      DEFAULT FALSE,
    is_damaged          BOOLEAN      DEFAULT FALSE,
    deleted_by_user_id  VARCHAR(36),
    delete_date_time    TIMESTAMP,
    delete_location     VARCHAR(255),
    FOREIGN KEY (entry_done_by)      REFERENCES user_master(user_id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES user_master(user_id)
);


-- ============================================================
-- 5. PRODUCT MASTER  [REVISED]
--
--  A Product is the physical machine assembled by the company.
--  It is defined by:
--    • A dispenser model (series + type + fuel)
--    • Serial numbers of every hardware component
--
--  The product has NO IoT configuration at this stage —
--  that happens later when the customer places an order.
--  Products appear in the "Sales Book" as catalogue items.
--
--  NOTE: configuration_id from the previous version is REMOVED.
--  IoT configuration now lives in customer_order_iot_config.
-- ============================================================

CREATE TABLE product_master (
    product_id              VARCHAR(36)  PRIMARY KEY,
    product_name            VARCHAR(200) NOT NULL,
    product_description     TEXT,
    dispenser_model_id      VARCHAR(36)  NOT NULL,

    -- Hardware component serial assignments
    motherboard_id          VARCHAR(36),
    gsm_id                  VARCHAR(36),
    pump_id                 VARCHAR(36),
    solenoid_valve_id       VARCHAR(36),
    flowmeter_id            VARCHAR(36),
    nozzle_id               VARCHAR(36),
    filter_id               VARCHAR(36),
    smps_id                 VARCHAR(36),
    relay_box_id            VARCHAR(36),
    transformer_id          VARCHAR(36),
    emi_emc_filter_id       VARCHAR(36),
    printer_id              VARCHAR(36),
    battery_id              VARCHAR(36),
    speaker_id              VARCHAR(36),
    tank_sensor_id          VARCHAR(36),
    quality_sensor_id       VARCHAR(36),
    amplifier_id            VARCHAR(36),
    rccb_id                 VARCHAR(36),
    spd_id                  VARCHAR(36),
    back_panel_pcb_id       VARCHAR(36),
    dc_meter_id             VARCHAR(36),
    pressure_sensor_id      VARCHAR(36),

    production_serial_no    VARCHAR(100) UNIQUE,
    manufacturing_date_time TIMESTAMP,
    manufacturing_batch     VARCHAR(50),
    entry_done_by           VARCHAR(36),
    entry_date_time         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (dispenser_model_id)  REFERENCES dispenser_model_master(dispenser_model_id),
    FOREIGN KEY (motherboard_id)      REFERENCES motherboard_master(motherboard_id),
    FOREIGN KEY (gsm_id)              REFERENCES gsm_master(gsm_id),
    FOREIGN KEY (pump_id)             REFERENCES pump_master(pump_id),
    FOREIGN KEY (solenoid_valve_id)   REFERENCES solenoid_valve_master(solenoid_valve_id),
    FOREIGN KEY (flowmeter_id)        REFERENCES flowmeter_master(flowmeter_id),
    FOREIGN KEY (nozzle_id)           REFERENCES nozzle_master(nozzle_id),
    FOREIGN KEY (filter_id)           REFERENCES filter_master(filter_id),
    FOREIGN KEY (smps_id)             REFERENCES smps_master(smps_id),
    FOREIGN KEY (relay_box_id)        REFERENCES relay_box_master(relay_box_id),
    FOREIGN KEY (transformer_id)      REFERENCES transformer_master(transformer_id),
    FOREIGN KEY (emi_emc_filter_id)   REFERENCES emi_emc_filter_master(emi_emc_filter_id),
    FOREIGN KEY (printer_id)          REFERENCES printer_master(printer_id),
    FOREIGN KEY (battery_id)          REFERENCES battery_master(battery_id),
    FOREIGN KEY (speaker_id)          REFERENCES speaker_master(speaker_id),
    FOREIGN KEY (tank_sensor_id)      REFERENCES tank_sensor_master(tank_sensor_id),
    FOREIGN KEY (quality_sensor_id)   REFERENCES quality_sensor_master(quality_sensor_id),
    FOREIGN KEY (amplifier_id)        REFERENCES amplifier_master(amplifier_id),
    FOREIGN KEY (rccb_id)             REFERENCES rccb_master(rccb_id),
    FOREIGN KEY (spd_id)              REFERENCES spd_master(spd_id),
    FOREIGN KEY (back_panel_pcb_id)   REFERENCES back_panel_pcb_master(back_panel_pcb_id),
    FOREIGN KEY (dc_meter_id)         REFERENCES dc_meter_master(dc_meter_id),
    FOREIGN KEY (pressure_sensor_id)  REFERENCES pressure_sensor_master(pressure_sensor_id),
    FOREIGN KEY (entry_done_by)       REFERENCES user_master(user_id)
);

CREATE TABLE product_images (
    image_id    VARCHAR(36)  PRIMARY KEY,
    product_id  VARCHAR(36)  NOT NULL,
    image_name  VARCHAR(255),
    image_path  VARCHAR(500),
    is_primary  BOOLEAN      DEFAULT FALSE,
    uploaded_by VARCHAR(36),
    uploaded_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id)  REFERENCES product_master(product_id),
    FOREIGN KEY (uploaded_by) REFERENCES user_master(user_id)
);

CREATE TABLE product_documents (
    document_id   VARCHAR(36)  PRIMARY KEY,
    product_id    VARCHAR(36)  NOT NULL,
    document_name VARCHAR(255),
    document_type VARCHAR(50),
    file_path     VARCHAR(500),
    uploaded_by   VARCHAR(36),
    uploaded_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id)  REFERENCES product_master(product_id),
    FOREIGN KEY (uploaded_by) REFERENCES user_master(user_id)
);

CREATE TABLE product_features (
    feature_id          VARCHAR(36)  PRIMARY KEY,
    product_id          VARCHAR(36)  NOT NULL,
    feature_name        VARCHAR(150),
    feature_description VARCHAR(500),
    display_order       INT,
    FOREIGN KEY (product_id) REFERENCES product_master(product_id)
);

CREATE TABLE product_specifications (
    spec_id    VARCHAR(36)  PRIMARY KEY,
    product_id VARCHAR(36)  NOT NULL,
    spec_name  VARCHAR(150),
    spec_value VARCHAR(255),
    spec_unit  VARCHAR(50),
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product_master(product_id)
);


-- ============================================================
-- 6. SALES TABLES  [REVISED]
--
--  sales_order        — the parent order header
--  sales_order_items  — line items: which products, how many
--
--  The sales order now captures whether the customer wants
--  an IoT dispenser or not via the is_iot_order flag on
--  the order item.  If IoT, the FK customer_iot_config_id
--  points to the full IoT configuration record created in
--  the next section (section 7).
-- ============================================================

CREATE TABLE sales_order (
    sales_id        VARCHAR(36)   PRIMARY KEY,
    customer_id     VARCHAR(36)   NOT NULL,
    site_id         VARCHAR(36),
    order_date      DATE          NOT NULL,
    po_number       VARCHAR(100),
    remarks         TEXT,
    status          VARCHAR(30)   DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','dispatched','delivered','cancelled')),
    total_amount    DECIMAL(14,2) DEFAULT 0,
    discount_amount DECIMAL(14,2) DEFAULT 0,
    tax_amount      DECIMAL(14,2) DEFAULT 0,
    net_amount      DECIMAL(14,2) GENERATED ALWAYS AS
                        (total_amount - discount_amount + tax_amount) STORED,
    created_by      VARCHAR(36),
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer_master(customer_id),
    FOREIGN KEY (site_id)     REFERENCES site_location_master(site_location_id),
    FOREIGN KEY (created_by)  REFERENCES user_master(user_id)
);

-- sales_order_items is created AFTER customer_order_iot_config (section 7)
-- so that the FK to customer_order_iot_config(config_id) can be declared inline.
-- Placeholder comment — actual CREATE TABLE is in section 7b below.


-- ============================================================
-- 7. CUSTOMER IoT CONFIGURATION  [NEW]
--
--  Created ONLY when a customer selects an IoT-based dispenser.
--  The customer chooses four feature dimensions:
--
--    nozzle_count      : 1 / 2 / 3 / 4
--    dispensing_speed  : 4  / 21         (litres/min or rate code)
--    connectivity      : one or more of the supported protocols
--                        stored as a comma-separated list or
--                        as individual boolean flags (flags used
--                        here for query-friendliness)
--    keyboard_format   : 4x6 / 5x5
--
--  Once saved, a FIRMWARE VERSION record is auto-generated
--  (see section 8) and linked via firmware_version_id.
-- ============================================================

CREATE TABLE customer_order_iot_config (
    config_id             VARCHAR(36)  PRIMARY KEY,

    -- Linked to the sales order item this config belongs to.
    -- (The FK on sales_order_items.customer_iot_config_id is the
    --  other side of this relationship.)
    sales_id              VARCHAR(36)  NOT NULL,
    product_id            VARCHAR(36)  NOT NULL,   -- which product model is being configured

    -- ── Feature selections ────────────────────────────────────
    nozzle_count          SMALLINT     NOT NULL
                              CHECK (nozzle_count IN (1, 2, 3, 4)),

    dispensing_speed      SMALLINT     NOT NULL
                              CHECK (dispensing_speed IN (4, 21)),

    -- Connectivity options (individual boolean flags)
    conn_ethernet         BOOLEAN      DEFAULT FALSE,
    conn_wifi             BOOLEAN      DEFAULT FALSE,
    conn_bluetooth        BOOLEAN      DEFAULT FALSE,
    conn_modbus_rs485     BOOLEAN      DEFAULT FALSE,
    conn_gsm_2g           BOOLEAN      DEFAULT FALSE,
    conn_gsm_4g           BOOLEAN      DEFAULT FALSE,
    conn_gps              BOOLEAN      DEFAULT FALSE,

    keyboard_format       VARCHAR(10)  NOT NULL
                              CHECK (keyboard_format IN ('4x6', '5x5')),

    -- ── Result ───────────────────────────────────────────────
    -- FK to the firmware version generated from this config.
    -- Populated immediately after config is saved.
    firmware_version_id   VARCHAR(36),             -- FK set after firmware_version table creation

    config_notes          TEXT,
    configured_by         VARCHAR(36)  NOT NULL,
    configured_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    approved_by           VARCHAR(36),
    approved_at           TIMESTAMP,
    is_active             BOOLEAN      DEFAULT TRUE,

    FOREIGN KEY (sales_id)        REFERENCES sales_order(sales_id),
    FOREIGN KEY (product_id)      REFERENCES product_master(product_id),
    FOREIGN KEY (configured_by)   REFERENCES user_master(user_id),
    FOREIGN KEY (approved_by)     REFERENCES user_master(user_id)
    -- firmware_version_id FK added via ALTER TABLE after section 8
);

-- Ensure at least one connectivity option is chosen for IoT orders
-- (enforced at application layer; a DB-level check is shown below as optional)
-- ALTER TABLE customer_order_iot_config
--   ADD CONSTRAINT chk_at_least_one_connectivity CHECK (
--     conn_ethernet OR conn_wifi OR conn_bluetooth OR
--     conn_modbus_rs485 OR conn_gsm_2g OR conn_gsm_4g OR conn_gps
--   );


-- ============================================================
-- 7b. SALES ORDER ITEMS
--     Defined here (after customer_order_iot_config) so the
--     FK to customer_order_iot_config can be declared inline.
-- ============================================================

CREATE TABLE sales_order_items (
    item_id                VARCHAR(36)   PRIMARY KEY,
    sales_id               VARCHAR(36)   NOT NULL,
    product_id             VARCHAR(36)   NOT NULL,
    quantity               INT           NOT NULL DEFAULT 1,
    unit_price             DECIMAL(12,2),
    line_total             DECIMAL(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

    -- Customer chooses IoT or Non-IoT at order-item level
    is_iot_order           BOOLEAN       NOT NULL DEFAULT FALSE,

    -- If is_iot_order = TRUE, points to the IoT configuration record
    customer_iot_config_id VARCHAR(36),

    FOREIGN KEY (sales_id)               REFERENCES sales_order(sales_id),
    FOREIGN KEY (product_id)             REFERENCES product_master(product_id),
    FOREIGN KEY (customer_iot_config_id) REFERENCES customer_order_iot_config(config_id)
);


-- ============================================================
-- 8. FIRMWARE VERSION MASTER  [NEW]
--
--  One record is created per IoT configuration event.
--  The version string is generated by the application using
--  the config parameters (e.g. "NZ2-SPD21-ETH-WIFI-4x6-v1.0.0").
--  The version_id (UUID) is the stable identifier used for
--  all future OTA push operations.
--
--  This replaces the old dispenser_configuration table which
--  mixed model config with firmware generation.
-- ============================================================

CREATE TABLE firmware_version_master (
    firmware_version_id   VARCHAR(36)  PRIMARY KEY,

    -- Linked back to the IoT config that generated this version
    iot_config_id         VARCHAR(36)  NOT NULL,

    -- Human-readable version string — generated by app logic
    -- Format example: "HYDRO-NZ2-SPD21-ETH-GSM4G-4x6-v1.0.0"
    version_string        VARCHAR(100) NOT NULL UNIQUE,

    -- Snapshot of the feature set baked into this version
    nozzle_count          SMALLINT,
    dispensing_speed      SMALLINT,
    conn_ethernet         BOOLEAN      DEFAULT FALSE,
    conn_wifi             BOOLEAN      DEFAULT FALSE,
    conn_bluetooth        BOOLEAN      DEFAULT FALSE,
    conn_modbus_rs485     BOOLEAN      DEFAULT FALSE,
    conn_gsm_2g           BOOLEAN      DEFAULT FALSE,
    conn_gsm_4g           BOOLEAN      DEFAULT FALSE,
    conn_gps              BOOLEAN      DEFAULT FALSE,
    keyboard_format       VARCHAR(10),

    -- Binary / release info
    firmware_file_name    VARCHAR(255),
    firmware_checksum     VARCHAR(100),
    release_notes         TEXT,

    -- Lifecycle
    is_stable             BOOLEAN      DEFAULT FALSE,   -- promoted to stable after QA
    is_deprecated         BOOLEAN      DEFAULT FALSE,
    created_by            VARCHAR(36)  NOT NULL,
    created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    approved_by           VARCHAR(36),
    approved_at           TIMESTAMP,

    FOREIGN KEY (iot_config_id)  REFERENCES customer_order_iot_config(config_id),
    FOREIGN KEY (created_by)     REFERENCES user_master(user_id),
    FOREIGN KEY (approved_by)    REFERENCES user_master(user_id)
);

-- Now add the deferred FKs that needed both tables to exist first
ALTER TABLE customer_order_iot_config
    ADD CONSTRAINT fk_iot_config_firmware_version
        FOREIGN KEY (firmware_version_id) REFERENCES firmware_version_master(firmware_version_id);


-- ============================================================
-- 9. OTA UPDATE TABLE — defined after device_registration (section 11)
--    so the FK to device_registration can be declared inline.
--    See section 11b.
-- ============================================================


-- ============================================================
-- 10. PROJECT TABLES (unchanged from v1)
-- ============================================================

CREATE TABLE project_master (
    project_id   VARCHAR(36)  PRIMARY KEY,
    project_name VARCHAR(200) NOT NULL,
    customer_id  VARCHAR(36),
    project_type VARCHAR(100),
    status       VARCHAR(30)  DEFAULT 'active'
                     CHECK (status IN ('planning','active','on_hold','completed','cancelled')),
    start_date   DATE,
    end_date     DATE,
    description  TEXT,
    created_by   VARCHAR(36),
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer_master(customer_id),
    FOREIGN KEY (created_by)  REFERENCES user_master(user_id)
);

CREATE TABLE project_team_master (
    team_id            VARCHAR(36)   PRIMARY KEY,
    project_id         VARCHAR(36)   NOT NULL,
    user_id            VARCHAR(36)   NOT NULL,
    role_in_project    VARCHAR(100),
    allocation_percent DECIMAL(5,2)  DEFAULT 100.00,
    start_date         DATE,
    end_date           DATE,
    UNIQUE (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES project_master(project_id),
    FOREIGN KEY (user_id)    REFERENCES user_master(user_id)
);


-- ============================================================
-- 11. DEVICE REGISTRATION TABLE  [REVISED]
--
--  When a technician deploys the product on-site the unit
--  becomes a "Device".  For IoT devices the firmware_version_id
--  from the customer's IoT config is recorded here, enabling
--  OTA tracking.  Non-IoT devices leave firmware_version_id NULL.
-- ============================================================

CREATE TABLE device_registration (
    device_id             VARCHAR(36)  PRIMARY KEY,
    dispenser_id          VARCHAR(36)  NOT NULL,   -- FK → product_master
    sale_id               VARCHAR(36)  NOT NULL,
    customer_id           VARCHAR(36)  NOT NULL,
    model_id              VARCHAR(36),
    -- NEW: firmware version installed at time of registration
    firmware_version_id   VARCHAR(36),             -- NULL for non-IoT devices
    serial_number         VARCHAR(100) UNIQUE NOT NULL,
    project_id            VARCHAR(36),
    device_uid            VARCHAR(100) UNIQUE,
    iot_sim_no            VARCHAR(50),
    imei_no               VARCHAR(20),
    mac_address           VARCHAR(20),
    installation_date     DATE,
    warranty_start        DATE,
    warranty_end          DATE,
    installed_by          VARCHAR(36),
    status                VARCHAR(20)  DEFAULT 'active'
                              CHECK (status IN ('active','inactive','under_repair','retired')),
    created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispenser_id)          REFERENCES product_master(product_id),
    FOREIGN KEY (firmware_version_id)   REFERENCES firmware_version_master(firmware_version_id),
    FOREIGN KEY (customer_id)           REFERENCES customer_master(customer_id),
    FOREIGN KEY (model_id)              REFERENCES dispenser_model_master(dispenser_model_id),
    FOREIGN KEY (sale_id)               REFERENCES sales_order(sales_id),
    FOREIGN KEY (project_id)            REFERENCES project_master(project_id),
    FOREIGN KEY (installed_by)          REFERENCES user_master(user_id)
);

-- OTA log FK to device_registration (device_registration must exist first)


-- ============================================================
-- 11b. OTA UPDATE TABLE  [NEW]
--
--  Tracks every OTA firmware push issued to a registered device.
--  Each push targets a device + a new firmware_version.
--  Status lifecycle: scheduled → in_progress → success / failed
-- ============================================================

CREATE TABLE ota_update_log (
    ota_id              VARCHAR(36)  PRIMARY KEY,
    device_id           VARCHAR(36)  NOT NULL,
    from_firmware_id    VARCHAR(36),
    to_firmware_id      VARCHAR(36)  NOT NULL,
    triggered_by        VARCHAR(36)  NOT NULL,
    triggered_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    started_at          TIMESTAMP,
    completed_at        TIMESTAMP,
    status              VARCHAR(20)  NOT NULL DEFAULT 'scheduled'
                            CHECK (status IN ('scheduled','in_progress','success','failed','rolled_back')),
    failure_reason      TEXT,
    retry_count         SMALLINT     DEFAULT 0,
    notes               TEXT,
    FOREIGN KEY (device_id)          REFERENCES device_registration(device_id),
    FOREIGN KEY (from_firmware_id)   REFERENCES firmware_version_master(firmware_version_id),
    FOREIGN KEY (to_firmware_id)     REFERENCES firmware_version_master(firmware_version_id),
    FOREIGN KEY (triggered_by)       REFERENCES user_master(user_id)
);
ALTER TABLE ota_update_log
    ADD CONSTRAINT fk_ota_device
        FOREIGN KEY (device_id) REFERENCES device_registration(device_id);


-- ============================================================
-- 12. SUPPORT TICKET (unchanged from v1)
-- ============================================================

CREATE TABLE support_ticket (
    ticket_id            VARCHAR(36)  PRIMARY KEY,
    ticket_no            VARCHAR(50)  NOT NULL UNIQUE,
    customer_id          VARCHAR(36)  NOT NULL,
    device_id            VARCHAR(36),
    project_id           VARCHAR(36),
    created_by_user_id   VARCHAR(36),
    assigned_to_user_id  VARCHAR(36),
    subject              VARCHAR(300),
    issue_category       VARCHAR(100),
    priority             VARCHAR(20)  NOT NULL DEFAULT 'medium'
                             CHECK (priority IN ('low','medium','high','critical')),
    status               VARCHAR(50)  NOT NULL DEFAULT 'open'
                             CHECK (status IN ('open','in_progress','pending_customer','resolved','closed')),
    issue_description    TEXT,
    opened_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_response_at     TIMESTAMP,
    resolved_at          TIMESTAMP,
    closed_at            TIMESTAMP,
    updated_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id)          REFERENCES customer_master(customer_id),
    FOREIGN KEY (device_id)            REFERENCES device_registration(device_id),
    FOREIGN KEY (project_id)           REFERENCES project_master(project_id),
    FOREIGN KEY (created_by_user_id)   REFERENCES user_master(user_id),
    FOREIGN KEY (assigned_to_user_id)  REFERENCES user_master(user_id)
);


-- ============================================================
-- 13. CHAT TABLES (unchanged from v1)
-- ============================================================

CREATE TABLE chat_conversation (
    conversation_id    VARCHAR(36)  PRIMARY KEY,
    ticket_id          VARCHAR(36),
    created_by_user_id VARCHAR(36),
    chat_type          VARCHAR(50),
    conversation_name  VARCHAR(200),
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id)          REFERENCES support_ticket(ticket_id),
    FOREIGN KEY (created_by_user_id) REFERENCES user_master(user_id)
);

CREATE TABLE chat_participant (
    participant_id   VARCHAR(36)  PRIMARY KEY,
    conversation_id  VARCHAR(36)  NOT NULL,
    user_id          VARCHAR(36),
    customer_id      VARCHAR(36),
    participant_type VARCHAR(50),
    is_admin         BOOLEAN      NOT NULL DEFAULT FALSE,
    joined_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at          TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversation(conversation_id),
    FOREIGN KEY (user_id)         REFERENCES user_master(user_id),
    FOREIGN KEY (customer_id)     REFERENCES customer_master(customer_id)
);

CREATE TABLE chat_message (
    message_id            VARCHAR(36)  PRIMARY KEY,
    conversation_id       VARCHAR(36)  NOT NULL,
    sender_participant_id VARCHAR(36),
    message_text          TEXT,
    message_type          VARCHAR(50)  NOT NULL DEFAULT 'text',
    is_internal_note      BOOLEAN      NOT NULL DEFAULT FALSE,
    sent_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id)       REFERENCES chat_conversation(conversation_id),
    FOREIGN KEY (sender_participant_id) REFERENCES chat_participant(participant_id)
);

CREATE TABLE chat_message_attachment (
    attachment_id VARCHAR(36)  PRIMARY KEY,
    message_id    VARCHAR(36)  NOT NULL,
    file_name     VARCHAR(200),
    file_path     VARCHAR(500),
    file_type     VARCHAR(100),
    uploaded_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES chat_message(message_id)
);

CREATE TABLE chat_message_read (
    message_id     VARCHAR(36) NOT NULL,
    participant_id VARCHAR(36) NOT NULL,
    read_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, participant_id),
    FOREIGN KEY (message_id)     REFERENCES chat_message(message_id),
    FOREIGN KEY (participant_id) REFERENCES chat_participant(participant_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

-- User & access
CREATE INDEX idx_user_role                 ON user_master(role_id);

-- Customer & site
CREATE INDEX idx_site_location_customer    ON site_location_master(customer_id);

-- Components
CREATE INDEX idx_mb_firmware_mb            ON motherboard_firmware_master(motherboard_id);
CREATE INDEX idx_gsm_firmware_gsm          ON gsm_firmware_master(gsm_id);

-- Dispenser model
CREATE INDEX idx_dispenser_model_series    ON dispenser_model_master(series_name);
CREATE INDEX idx_dispenser_model_type      ON dispenser_model_master(dispenser_type);
CREATE INDEX idx_dispenser_model_fuel      ON dispenser_model_master(fuel_type);

-- Product
CREATE INDEX idx_product_model             ON product_master(dispenser_model_id);

-- Sales
CREATE INDEX idx_sales_order_customer      ON sales_order(customer_id);
CREATE INDEX idx_sales_order_site          ON sales_order(site_id);
CREATE INDEX idx_sales_items_sales         ON sales_order_items(sales_id);
CREATE INDEX idx_sales_items_product       ON sales_order_items(product_id);
CREATE INDEX idx_sales_items_iot_config    ON sales_order_items(customer_iot_config_id);

-- IoT Configuration
CREATE INDEX idx_iot_config_sales          ON customer_order_iot_config(sales_id);
CREATE INDEX idx_iot_config_product        ON customer_order_iot_config(product_id);
CREATE INDEX idx_iot_config_firmware       ON customer_order_iot_config(firmware_version_id);

-- Firmware version
CREATE INDEX idx_fw_version_iot_config     ON firmware_version_master(iot_config_id);
CREATE INDEX idx_fw_version_string         ON firmware_version_master(version_string);

-- OTA
CREATE INDEX idx_ota_device                ON ota_update_log(device_id);
CREATE INDEX idx_ota_to_firmware           ON ota_update_log(to_firmware_id);
CREATE INDEX idx_ota_status                ON ota_update_log(status);

-- Project
CREATE INDEX idx_project_customer          ON project_master(customer_id);
CREATE INDEX idx_project_team_project      ON project_team_master(project_id);
CREATE INDEX idx_project_team_user         ON project_team_master(user_id);

-- Device
CREATE INDEX idx_device_dispenser          ON device_registration(dispenser_id);
CREATE INDEX idx_device_customer           ON device_registration(customer_id);
CREATE INDEX idx_device_sale               ON device_registration(sale_id);
CREATE INDEX idx_device_project            ON device_registration(project_id);
CREATE INDEX idx_device_firmware_version   ON device_registration(firmware_version_id);

-- Support
CREATE INDEX idx_support_ticket_customer   ON support_ticket(customer_id);
CREATE INDEX idx_support_ticket_device     ON support_ticket(device_id);
CREATE INDEX idx_support_ticket_assigned   ON support_ticket(assigned_to_user_id);

-- Chat
CREATE INDEX idx_chat_conv_ticket          ON chat_conversation(ticket_id);
CREATE INDEX idx_chat_participant_conv     ON chat_participant(conversation_id);
CREATE INDEX idx_chat_msg_conversation     ON chat_message(conversation_id);
CREATE INDEX idx_chat_msg_read_participant ON chat_message_read(participant_id);


-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Roles
INSERT INTO user_role_master (role_id, role_name, role_description) VALUES
('ROLE-001', 'Admin',      'Full system access'),
('ROLE-002', 'Engineer',   'Hardware and firmware management'),
('ROLE-003', 'Sales',      'Sales order and customer management'),
('ROLE-004', 'Technician', 'Field installation and device registration');

-- Permissions
INSERT INTO permission_master (permission_id, permission_name, module_name, description) VALUES
('PERM-001', 'VIEW_CUSTOMER',      'Customer',  'View customer records'),
('PERM-002', 'CREATE_ORDER',       'Sales',     'Create sales orders'),
('PERM-003', 'MANAGE_FIRMWARE',    'Firmware',  'Upload and manage firmware versions'),
('PERM-004', 'REGISTER_DEVICE',    'Device',    'Register field devices'),
('PERM-005', 'MANAGE_USERS',       'Admin',     'Create and manage system users'),
('PERM-006', 'PUSH_OTA',           'OTA',       'Trigger OTA firmware updates'),
('PERM-007', 'CONFIGURE_IOT',      'IoT',       'Create IoT configurations for orders');

-- Role-Permission Mapping
INSERT INTO role_permission_map (id, role_id, permission_id, can_view, can_create, can_edit, can_delete, can_approve) VALUES
('RPM-001', 'ROLE-001', 'PERM-005', TRUE, TRUE, TRUE, TRUE,  TRUE),
('RPM-002', 'ROLE-003', 'PERM-001', TRUE, TRUE, TRUE, FALSE, FALSE),
('RPM-003', 'ROLE-003', 'PERM-002', TRUE, TRUE, TRUE, FALSE, TRUE),
('RPM-004', 'ROLE-002', 'PERM-003', TRUE, TRUE, TRUE, FALSE, FALSE),
('RPM-005', 'ROLE-004', 'PERM-004', TRUE, TRUE, FALSE,FALSE, FALSE),
('RPM-006', 'ROLE-002', 'PERM-006', TRUE, TRUE, TRUE, FALSE, FALSE),
('RPM-007', 'ROLE-002', 'PERM-007', TRUE, TRUE, TRUE, FALSE, FALSE);

-- Users
INSERT INTO user_master (user_id, role_id, username, password_hash, first_name, last_name, email, mobile_no, department, designation) VALUES
('USR-001', 'ROLE-001', 'admin',       'hashed_admin123', 'Raj',   'Shah',  'raj.shah@company.com',    '9876500001', 'IT',      'System Admin'),
('USR-002', 'ROLE-002', 'eng_arjun',   'hashed_arjun456', 'Arjun', 'Mehta', 'arjun.mehta@company.com', '9876500002', 'R&D',     'Senior Engineer'),
('USR-003', 'ROLE-003', 'sales_priya', 'hashed_priya789', 'Priya', 'Patel', 'priya.patel@company.com', '9876500003', 'Sales',   'Sales Executive'),
('USR-004', 'ROLE-004', 'tech_kamal',  'hashed_kamal000', 'Kamal', 'Joshi', 'kamal.joshi@company.com', '9876500004', 'Support', 'Field Technician');

-- Customers
INSERT INTO customer_master (customer_id, customer_code, customer_name, company_name, contact_person, mobile_no, email, address_line1, city, state, country, pincode, gst_no) VALUES
('CUST-001', 'C-RFP-001', 'Ramesh Fuel Point',   'Ramesh Enterprises',      'Ramesh Patel',  '9876501001', 'ramesh@rfp.com',    '12, Station Road', 'Surat',     'Gujarat', 'India', '395001', '24AAACR1234A1Z5'),
('CUST-002', 'C-BPW-002', 'Bharat Petro Works',  'Bharat Petroleum Retail', 'Suresh Kumar',  '9876501002', 'suresh@bpw.com',    '88, NH-48',        'Pune',      'Maharashtra','India','411001','27AABCB5678B2Y9'),
('CUST-003', 'C-GGA-003', 'Gujarat Gas Agency',  'GGA Fuels Pvt Ltd',       'Hetal Desai',   '9876501003', 'hetal@gga.com',     'Plot 5, GIDC',     'Ahmedabad', 'Gujarat', 'India', '380025', '24AADCG9012C3X1');

-- Site Locations
INSERT INTO site_location_master (site_location_id, customer_id, site_name, address_line1, city, state, pincode) VALUES
('SITE-001', 'CUST-001', 'Surat Main Station',      '12, Station Road',  'Surat',     'Gujarat',     '395001'),
('SITE-002', 'CUST-002', 'Pune Highway Depot',       '88, NH-48',         'Pune',      'Maharashtra', '411001'),
('SITE-003', 'CUST-003', 'Ahmedabad GIDC Outlet',   'Plot 5, GIDC',      'Ahmedabad', 'Gujarat',     '380025');

-- ── Component samples ─────────────────────────────────────────────────────────

INSERT INTO motherboard_master (motherboard_id, mcu_id, esp32_mac_address, ethernet_mac_address, bt_mac_address, production_serial_no, manufacturing_date_time, manufacturing_batch, entry_done_by) VALUES
('MB-001', 'ESP32-S3-01A', 'A4:CF:12:B3:00:01', 'A4:CF:12:B3:10:01', 'A4:CF:12:B3:20:01', 'SN-MB-001', '2025-01-15 09:00:00', 'BATCH-2025-01', 'USR-002'),
('MB-002', 'ESP32-S3-02B', 'A4:CF:12:B3:00:02', 'A4:CF:12:B3:10:02', 'A4:CF:12:B3:20:02', 'SN-MB-002', '2025-01-15 09:00:00', 'BATCH-2025-01', 'USR-002');

INSERT INTO motherboard_firmware_master (mb_firmware_id, motherboard_id, version_no, firmware_description, entry_done_by) VALUES
('MBF-001', 'MB-001', 'v2.1.0', 'Base firmware for Nitro/Hydro series', 'USR-002'),
('MBF-002', 'MB-002', 'v2.1.1', 'Base firmware for Oxy/Ozone series',   'USR-002');

INSERT INTO gsm_tech_master (gsm_tech_id, tech_name, frequency_band, entry_done_by) VALUES
('GT-001', 'GSM 2G', '900/1800 MHz', 'USR-002'),
('GT-002', 'GSM 4G', 'B1/B3/B5/B8',  'USR-002');

INSERT INTO gsm_master (gsm_id, gsm_tech_id, production_serial_no, manufacturing_date_time, manufacturing_batch, entry_done_by) VALUES
('GSM-001', 'GT-002', 'SN-GSM-001', '2025-01-20 10:00:00', 'BATCH-2025-01', 'USR-002'),
('GSM-002', 'GT-002', 'SN-GSM-002', '2025-01-20 10:00:00', 'BATCH-2025-01', 'USR-002');

INSERT INTO gsm_firmware_master (gsm_firmware_id, gsm_id, version_no, firmware_description, entry_done_by) VALUES
('GSMF-001', 'GSM-001', 'v1.5.0', 'Stable 4G firmware', 'USR-002'),
('GSMF-002', 'GSM-002', 'v1.5.0', 'Stable 4G firmware', 'USR-002');

INSERT INTO pump_master       (pump_id,   pump_serial_no,   model_no,     manufacturer, entry_done_by) VALUES ('PUMP-001','SN-PUMP-001','PM-400-X','FlowTech','USR-002'),('PUMP-002','SN-PUMP-002','PM-400-X','FlowTech','USR-002');
INSERT INTO solenoid_valve_master (solenoid_valve_id, solenoid_serial_no, model_no, manufacturer, entry_done_by) VALUES ('SV-001','SN-SV-001','SV-12VDC','Danfoss','USR-002'),('SV-002','SN-SV-002','SV-12VDC','Danfoss','USR-002');
INSERT INTO flowmeter_master  (flowmeter_id, flowmeter_serial_no, model_no, manufacturer, entry_done_by) VALUES ('FM-001','SN-FM-001','FM-OVL-25','OVAL Corp','USR-002'),('FM-002','SN-FM-002','FM-OVL-25','OVAL Corp','USR-002');
INSERT INTO nozzle_master     (nozzle_id,  nozzle_serial_no,  nozzle_type, manufacturer, entry_done_by) VALUES ('NOZ-001','SN-NOZ-001','Standard','OPW','USR-002'),('NOZ-002','SN-NOZ-002','Standard','OPW','USR-002');
INSERT INTO filter_master     (filter_id,  filter_serial_no,  filter_type, model_no, manufacturer, entry_done_by) VALUES ('FLT-001','SN-FLT-001','Inline','FL-10M','Cim-Tek','USR-002');
INSERT INTO smps_master       (smps_id,   smps_serial_no,   model_no, manufacturer, entry_done_by) VALUES ('SMPS-001','SN-SMPS-001','SMPS-5A','Mean Well','USR-002');
INSERT INTO relay_box_master  (relay_box_id, relay_box_serial_no, model_no, manufacturer, entry_done_by) VALUES ('RLY-001','SN-RLY-001','RB-8CH','Omron','USR-002');
INSERT INTO transformer_master (transformer_id, transformer_serial_no, input_voltage, output_voltage, rating, entry_done_by) VALUES ('TRF-001','SN-TRF-001','230V','12V','5A','USR-002');
INSERT INTO emi_emc_filter_master (emi_emc_filter_id, filter_serial_no, rating, model_no, manufacturer, entry_done_by) VALUES ('EMI-001','SN-EMI-001','10A','FMAC-0932','Schaffner','USR-002');
INSERT INTO printer_master    (printer_id, printer_serial_no, printer_type, model_no, manufacturer, entry_done_by) VALUES ('PRT-001','SN-PRT-001','Thermal','TP-805','Epson','USR-002'),('PRT-002','SN-PRT-002','Thermal','TP-805','Epson','USR-002');
INSERT INTO battery_master    (battery_id, battery_serial_no, battery_type, capacity, manufacturer, entry_done_by) VALUES ('BAT-001','SN-BAT-001','Li-Ion','5000mAh','Exide','USR-002');
INSERT INTO speaker_master    (speaker_id, speaker_serial_no, model_no, manufacturer, entry_done_by) VALUES ('SPK-001','SN-SPK-001','SP-3W-8OHM','Visaton','USR-002');
INSERT INTO amplifier_master  (amplifier_id, amplifier_serial_no, model_no, manufacturer, entry_done_by) VALUES ('AMP-001','SN-AMP-001','LM386-MOD','Texas Instruments','USR-002');
INSERT INTO tank_sensor_master (tank_sensor_id, tank_sensor_serial_no, model_no, manufacturer, entry_done_by) VALUES ('TS-001','SN-TS-001','TS-4000-Pro','Veeder-Root','USR-002');
INSERT INTO quality_sensor_master (quality_sensor_id, quality_sensor_serial_no, model_no, manufacturer, entry_done_by) VALUES ('QS-001','SN-QS-001','QS-F200','Micro Motion','USR-002');
INSERT INTO rccb_master       (rccb_id, rccb_serial_no, model_no, manufacturer, entry_done_by) VALUES ('RCCB-001','SN-RCCB-001','RCCB-40A-30mA','Legrand','USR-002');
INSERT INTO spd_master        (spd_id,  spd_serial_no,  model_no, manufacturer, entry_done_by) VALUES ('SPD-001','SN-SPD-001','SPD-T2-25KA','Phoenix Contact','USR-002');
INSERT INTO back_panel_pcb_master (back_panel_pcb_id, pcb_serial_no, pcb_version, manufacturer, entry_done_by) VALUES ('BP-001','SN-BP-001','v1.4','InHouse Mfg','USR-002');
INSERT INTO dc_meter_master   (dc_meter_id, dc_motor_serial_no, manufacturer, entry_done_by) VALUES ('DCM-001','SN-DCM-001','Eastron Electronics','USR-002');
INSERT INTO pressure_sensor_master (pressure_sensor_id, pressure_sensor_serial_no, model_no, manufacturer, entry_done_by) VALUES ('PS-001','SN-PS-001','PS-300-G','WIKA','USR-002');

-- ── Dispenser Models (using new series_name matrix) ───────────────────────────

INSERT INTO dispenser_model_master
    (dispenser_model_id, series_name, dispenser_type, fuel_type, model_name, model_description, entry_done_by)
VALUES
('DM-001', 'Nitro',  'Mini',    'DEF',    'Nitro-X1',   'Mini DEF dispenser, single nozzle',       'USR-003'),
('DM-002', 'Hydro',  'Mini',    'Diesel', 'Hydro-D2',   'Mini Diesel dispenser, dual nozzle',      'USR-003'),
('DM-003', 'Oxy',    'Tower',   'DEF',    'Oxy-T1',     'Tower DEF dispenser',                     'USR-003'),
('DM-004', 'Ozone',  'Tower',   'Diesel', 'Ozone-T2',   'Tower Diesel dispenser, high capacity',   'USR-003'),
('DM-005', 'Titan',  'Storage', 'DEF',    'Titan-S1',   'Storage DEF dispenser, bulk station',     'USR-003'),
('DM-006', 'Helium', 'Storage', 'Diesel', 'Helium-S2',  'Storage Diesel dispenser, bulk station',  'USR-003');

-- ── Products (physical assembled machines in the warehouse) ──────────────────

INSERT INTO product_master
    (product_id, product_name, product_description, dispenser_model_id,
     motherboard_id, gsm_id, pump_id, solenoid_valve_id, flowmeter_id, nozzle_id,
     filter_id, smps_id, relay_box_id, transformer_id, emi_emc_filter_id,
     printer_id, battery_id, speaker_id, tank_sensor_id, quality_sensor_id,
     amplifier_id, rccb_id, spd_id, back_panel_pcb_id, dc_meter_id, pressure_sensor_id,
     production_serial_no, manufacturing_date_time, manufacturing_batch, entry_done_by)
VALUES
('PROD-001', 'Nitro-X1 Unit A',  'Mini DEF dispenser unit #1',    'DM-001',
 'MB-001','GSM-001','PUMP-001','SV-001','FM-001','NOZ-001','FLT-001','SMPS-001','RLY-001','TRF-001','EMI-001','PRT-001','BAT-001','SPK-001','TS-001','QS-001','AMP-001','RCCB-001','SPD-001','BP-001','DCM-001','PS-001',
 'SN-PROD-20250201','2025-02-01 08:00:00','BATCH-2025-02','USR-002'),

('PROD-002', 'Hydro-D2 Unit A',  'Mini Diesel dispenser unit #1', 'DM-002',
 'MB-002','GSM-002','PUMP-002','SV-002','FM-002','NOZ-002','FLT-001','SMPS-001','RLY-001','TRF-001','EMI-001','PRT-002','BAT-001','SPK-001','TS-001','QS-001','AMP-001','RCCB-001','SPD-001','BP-001','DCM-001','PS-001',
 'SN-PROD-20250202','2025-02-02 08:00:00','BATCH-2025-02','USR-002');

-- ── Sales Orders ──────────────────────────────────────────────────────────────

INSERT INTO sales_order (sales_id, customer_id, site_id, order_date, po_number, remarks, status, total_amount, tax_amount, created_by) VALUES
('SO-001', 'CUST-001', 'SITE-001', '2025-03-01', 'PO-RFP-2025-001', 'Urgent delivery', 'confirmed', 255000.00, 45900.00, 'USR-003'),
('SO-002', 'CUST-002', 'SITE-002', '2025-03-15', 'PO-BPW-2025-012', 'Standard delivery','confirmed', 190000.00, 34200.00, 'USR-003');

-- ── IoT Configuration for SO-001 item (customer chose IoT with 2 nozzles) ────
-- Step 1: Insert IoT config (firmware_version_id will be set after version is created)
INSERT INTO customer_order_iot_config
    (config_id, sales_id, product_id, nozzle_count, dispensing_speed,
     conn_ethernet, conn_wifi, conn_gsm_4g, conn_gps,
     keyboard_format, config_notes, configured_by, approved_by)
VALUES
('IOT-CFG-001', 'SO-001', 'PROD-001', 2, 21,
 TRUE, FALSE, TRUE, TRUE,
 '4x6', 'Customer Ramesh requested 2-nozzle IoT with Ethernet + GSM4G + GPS', 'USR-002', 'USR-001');

-- Step 2: Create the firmware version generated from the above config
INSERT INTO firmware_version_master
    (firmware_version_id, iot_config_id, version_string,
     nozzle_count, dispensing_speed,
     conn_ethernet, conn_gsm_4g, conn_gps,
     keyboard_format, firmware_file_name, firmware_checksum,
     release_notes, is_stable, created_by, approved_by)
VALUES
('FW-VER-001', 'IOT-CFG-001',
 'NITRO-NZ2-SPD21-ETH-GSM4G-GPS-KBD4x6-v1.0.0',
 2, 21, TRUE, TRUE, TRUE,
 '4x6', 'nitro_nz2_spd21_eth_gsm4g_gps_kbd4x6_v1.0.0.bin',
 'a3f7d91e4c2b0855',
 'Initial firmware for Ramesh Fuel Point IoT config', FALSE, 'USR-002', 'USR-001');

-- Step 3: Link the firmware version back to the IoT config
UPDATE customer_order_iot_config
   SET firmware_version_id = 'FW-VER-001'
 WHERE config_id = 'IOT-CFG-001';

-- ── Sales Order Items ─────────────────────────────────────────────────────────

INSERT INTO sales_order_items (item_id, sales_id, product_id, quantity, unit_price, is_iot_order, customer_iot_config_id) VALUES
('SOI-001', 'SO-001', 'PROD-001', 2, 85000.00, TRUE,  'IOT-CFG-001'),
('SOI-002', 'SO-002', 'PROD-002', 1, 95000.00, FALSE, NULL);          -- Non-IoT order

-- ── Projects ──────────────────────────────────────────────────────────────────

INSERT INTO project_master (project_id, project_name, customer_id, project_type, status, start_date, end_date, description, created_by) VALUES
('PROJ-001', 'Ramesh Surat IoT Installation',  'CUST-001', 'New Installation', 'active',   '2025-03-10', '2025-04-10', 'Install 2 Nitro-X1 IoT dispensers at Surat', 'USR-003'),
('PROJ-002', 'Bharat Petro Pune Standard',     'CUST-002', 'New Installation', 'active',   '2025-03-20', '2025-04-30', 'Install 1 Hydro-D2 non-IoT dispenser',      'USR-003');

INSERT INTO project_team_master (team_id, project_id, user_id, role_in_project, allocation_percent, start_date, end_date) VALUES
('PT-001', 'PROJ-001', 'USR-004', 'Lead Technician',  100.00, '2025-03-10', '2025-04-10'),
('PT-002', 'PROJ-001', 'USR-002', 'Technical Support', 50.00, '2025-03-10', '2025-04-10'),
('PT-003', 'PROJ-002', 'USR-004', 'Lead Technician',  100.00, '2025-03-20', '2025-04-30');

-- ── Device Registrations ──────────────────────────────────────────────────────

INSERT INTO device_registration
    (device_id, dispenser_id, sale_id, customer_id, model_id, firmware_version_id,
     serial_number, project_id, device_uid, iot_sim_no, imei_no, mac_address,
     installation_date, warranty_start, warranty_end, installed_by, status)
VALUES
-- IoT device — firmware_version_id set from customer's IoT config
('DEV-001', 'PROD-001', 'SO-001', 'CUST-001', 'DM-001', 'FW-VER-001',
 'FIELD-SN-001', 'PROJ-001', 'UID-A1B2C3D4E5F6', '9898100001',
 '356712104567890', 'A4:CF:12:B3:01:01',
 '2025-03-25', '2025-03-25', '2026-03-25', 'USR-004', 'active'),

-- Non-IoT device — no firmware_version_id
('DEV-002', 'PROD-002', 'SO-002', 'CUST-002', 'DM-002', NULL,
 'FIELD-SN-002', 'PROJ-002', NULL, NULL, NULL, NULL,
 '2025-04-02', '2025-04-02', '2026-04-02', 'USR-004', 'active');

-- ── OTA Update Log (sample scheduled push for DEV-001) ───────────────────────

-- (Assumes a v1.1.0 firmware exists for the same config — shown as placeholder)
-- INSERT INTO firmware_version_master (...) VALUES ('FW-VER-002', ...);
-- INSERT INTO ota_update_log (ota_id, device_id, from_firmware_id, to_firmware_id, triggered_by, status)
-- VALUES ('OTA-001', 'DEV-001', 'FW-VER-001', 'FW-VER-002', 'USR-002', 'scheduled');

-- ── Support Tickets ───────────────────────────────────────────────────────────

INSERT INTO support_ticket
    (ticket_id, ticket_no, customer_id, device_id, project_id,
     created_by_user_id, assigned_to_user_id,
     subject, issue_category, priority, status, issue_description)
VALUES
('TKT-001', 'TICK-2025-001', 'CUST-001', 'DEV-001', 'PROJ-001',
 'USR-004', 'USR-002',
 'Display not turning on after power cycle', 'Hardware', 'high', 'open',
 'LCD display does not turn on after a power reset. All other indicators normal.'),
('TKT-002', 'TICK-2025-002', 'CUST-001', 'DEV-001', 'PROJ-001',
 'USR-004', 'USR-002',
 'GSM module losing connectivity intermittently', 'IoT', 'medium', 'in_progress',
 'Device drops GSM4G connection every few hours. SIM active, signal strength checked.');
