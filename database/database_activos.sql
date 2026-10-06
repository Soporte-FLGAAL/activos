CREATE DATABASE IF NOT EXISTS Activos;

USE Activos;

-- =========================================================
-- ROLES Y PERMISOS
-- =========================================================
CREATE TABLE IF NOT EXISTS Roles(
    Rol_id INT NOT NULL AUTO_INCREMENT,
    Rol_nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY(Rol_id)
);

CREATE TABLE IF NOT EXISTS Permisos(
    PerM_id INT NOT NULL AUTO_INCREMENT,
    PerM_nombre VARCHAR(50) NOT NULL,
    PRIMARY KEY(PerM_id)
);

CREATE TABLE IF NOT EXISTS Rol_Permisos(
    RP_rol INT NOT NULL,
    RP_permiso INT NOT NULL,
    PRIMARY KEY (RP_rol, RP_permiso),
    FOREIGN KEY (RP_rol) REFERENCES Roles(Rol_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (RP_permiso) REFERENCES Permisos(PerM_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Usuario(
    Usu_id INT NOT NULL AUTO_INCREMENT,
    Usu_nombres VARCHAR(50) NOT NULL,
    Usu_ap_paterno VARCHAR(25) NOT NULL,
    Usu_ap_materno VARCHAR(25),
    Usu_telefono VARCHAR(13),
    Usu_correo VARCHAR(255) NOT NULL UNIQUE,
    Usu_password VARCHAR(255) NOT NULL,
    Usu_status ENUM ('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    Usu_fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Usu_ultimo_acceso DATETIME NULL,
    PRIMARY KEY (Usu_id)
);

-- =========================================================
-- TOKENS
-- =========================================================

CREATE TABLE IF NOT EXISTS RefreshTokens (
  RT_id INT NOT NULL AUTO_INCREMENT,
  RT_usuario INT NOT NULL,
  RT_token VARCHAR(500) NOT NULL,
  RT_expiracion DATETIME NOT NULL,
  RT_creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (RT_id),
  UNIQUE KEY uq_token (RT_token),
  FOREIGN KEY (RT_usuario) REFERENCES Usuario(Usu_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================================================
-- CATALOGOS PARA VALORES QUE FORMAN PARTE DEL MODELO
-- =========================================================
CREATE TABLE IF NOT EXISTS Acciones_movimiento(
    AcM_id INT NOT NULL AUTO_INCREMENT,
    AcM_nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (AcM_id)
);

CREATE TABLE IF NOT EXISTS Tipo_movimiento_placa(
    TpMP_id INT NOT NULL AUTO_INCREMENT,
    TpMP_nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (TpMP_id)
);

CREATE TABLE IF NOT EXISTS Tipo_tarjeta(
    TpT_id INT NOT NULL AUTO_INCREMENT,
    TpT_nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (TpT_id)
);

-- =========================================================
-- AUDITORIA
-- =========================================================
CREATE TABLE IF NOT EXISTS Movimientos(
    Mov_id INT NOT NULL AUTO_INCREMENT,
    Mov_tabla_afectada VARCHAR(30) NOT NULL,
    Mov_registro_afectado VARCHAR(25) NOT NULL,
    Mov_accion INT NOT NULL,
    Mov_detalles JSON NOT NULL,
    Mov_fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Mov_usu_id INT,
    PRIMARY KEY (Mov_id),
    FOREIGN KEY (Mov_accion) REFERENCES Acciones_movimiento(AcM_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (Mov_usu_id) REFERENCES Usuario(Usu_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- =========================================================
-- CATALOGOS DEL DOMINIO
-- =========================================================
CREATE TABLE IF NOT EXISTS Tipo_unidad(
    TpU_id INT NOT NULL AUTO_INCREMENT,
    TpU_nombre VARCHAR(30) NOT NULL,
    TpU_nombre_corto VARCHAR(15),
    PRIMARY KEY (TpU_id)
);

CREATE TABLE IF NOT EXISTS Empresas(
    Emp_id INT NOT NULL AUTO_INCREMENT,
    Emp_nombre VARCHAR(100) NOT NULL,
    Emp_nombre_corto VARCHAR(20),
    Emp_direccion VARCHAR(150),
    Emp_rfc VARCHAR(13) NOT NULL,
    PRIMARY KEY (Emp_id)
);

CREATE TABLE IF NOT EXISTS Estado_unidad(
    EsU_id INT NOT NULL AUTO_INCREMENT,
    EsU_estado VARCHAR(20) NOT NULL,
    PRIMARY KEY (EsU_id)
);

CREATE TABLE IF NOT EXISTS Combustible(
    Com_id INT NOT NULL AUTO_INCREMENT,
    Com_nombre VARCHAR(30) NOT NULL,
    PRIMARY KEY (Com_id)
);

CREATE TABLE IF NOT EXISTS Periodos(
    Per_id INT NOT NULL AUTO_INCREMENT,
    Per_nombre VARCHAR(15) NOT NULL,
    PRIMARY KEY (Per_id)
);

CREATE TABLE IF NOT EXISTS Tipo_poliza(
    TpP_id INT NOT NULL AUTO_INCREMENT,
    TpP_nombre VARCHAR(30) NOT NULL,
    PRIMARY KEY (TpP_id)
);

-- =========================================================
-- RELACION USUARIO - EMPRESA - ROL
-- Un usuario puede tener distintos roles en distintas empresas.
-- =========================================================
CREATE TABLE IF NOT EXISTS Usuario_Empresas(
    UE_usuario INT NOT NULL,
    UE_empresa INT NOT NULL,
    UE_rol INT NOT NULL,
    PRIMARY KEY (UE_usuario, UE_empresa),
    FOREIGN KEY (UE_usuario) REFERENCES Usuario(Usu_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (UE_empresa) REFERENCES Empresas(Emp_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (UE_rol) REFERENCES Roles(Rol_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- =========================================================
-- UNIDADES
-- Se usa Uni_id como PK tecnica. Uni_no_economico NO es UNIQUE
-- por decision explicita del proyecto.
-- Las verificaciones se mantienen dentro de Unidades porque
-- no se requiere historial para ellas.
-- =========================================================
CREATE TABLE IF NOT EXISTS Unidades(
    Uni_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    Uni_no_economico VARCHAR(15) NOT NULL,
    Uni_status ENUM ('ALTA', 'BAJA') NOT NULL,
    Uni_tipo INT NOT NULL,
    Uni_estado INT NOT NULL,
    Uni_combustible INT NOT NULL,
    Uni_no_serie VARCHAR(25) NOT NULL,
    Uni_no_motor VARCHAR(20) NOT NULL,
    Uni_anio_modelo YEAR NOT NULL,
    Uni_modelo VARCHAR(25) NOT NULL,
    Uni_marca VARCHAR(25) NOT NULL,
    Uni_ejes INT,
    Uni_llantas INT NOT NULL,
    Uni_viapass VARCHAR(15) NOT NULL,
    Uni_propietario INT NOT NULL,
    Uni_empresa_actual INT NOT NULL,
    Uni_fecha_alta_SCT DATE NOT NULL,
    Uni_valor_factura DECIMAL(12,2) NOT NULL,
    Uni_factura_url VARCHAR(255),
    Uni_fecha_verificacion_mecanica DATE NOT NULL,
    Uni_costo_verificacion_mecanica DECIMAL(12,2) NOT NULL,
    Uni_periodo_verificacion_mecanica INT NOT NULL,
    Uni_fecha_verificacion_contaminantes DATE NOT NULL,
    Uni_costo_verificacion_contaminantes DECIMAL(12,2) NOT NULL,
    Uni_periodo_verificacion_contaminantes INT NOT NULL,
    Uni_url_verificacion_contaminantes VARCHAR(255),
    Uni_url_verificacion_mecanica VARCHAR(255),
    PRIMARY KEY (Uni_id),
    FOREIGN KEY (Uni_tipo) REFERENCES Tipo_unidad(TpU_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (Uni_estado) REFERENCES Estado_unidad(EsU_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (Uni_combustible) REFERENCES Combustible(Com_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (Uni_propietario) REFERENCES Empresas(Emp_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (Uni_empresa_actual) REFERENCES Empresas(Emp_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (Uni_periodo_verificacion_mecanica) REFERENCES Periodos(Per_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (Uni_periodo_verificacion_contaminantes) REFERENCES Periodos(Per_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- =========================================================
-- ASEGURADORAS Y POLIZAS
-- El numero de poliza no es unique globalmente porque distintas
-- aseguradoras pueden utilizar el mismo numero.
-- =========================================================
CREATE TABLE IF NOT EXISTS Aseguradoras(
	Ase_id INT NOT NULL AUTO_INCREMENT,
    Ase_nombre VARCHAR(100) NOT NULL,
    Ase_direccion VARCHAR(150) NOT NULL,
    Ase_telefono VARCHAR(13) NOT NULL,
    Ase_rfc VARCHAR(13) NOT NULL,
    PRIMARY KEY(Ase_id)
);

CREATE TABLE IF NOT EXISTS Responsables_Aseguradoras(
	RA_id INT NOT NULL AUTO_INCREMENT,
    RA_aseguradora INT NOT NULL,
    RA_responsable VARCHAR(100) NOT NULL,
    RA_puesto_responsable VARCHAR(50),
    RA_telefono VARCHAR(13) NOT NULL,
    RA_empresa_responsable INT, 
    PRIMARY KEY (RA_id),
    FOREIGN KEY (RA_aseguradora) REFERENCES Aseguradoras(Ase_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
    FOREIGN KEY (RA_empresa_responsable) REFERENCES Empresas(Emp_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Polizas(
    Pol_id INT NOT NULL AUTO_INCREMENT,
    Pol_poliza VARCHAR(15) NOT NULL,
    Pol_aseguradora INT NOT NULL,
    Pol_unidad_id BIGINT UNSIGNED NOT NULL,
    Pol_tipo_poliza INT NOT NULL,
    Pol_fecha_inicio DATE NOT NULL,
    Pol_fecha_fin DATE NOT NULL,
    Pol_costo DECIMAL(12,2) NOT NULL,
    Pol_url VARCHAR(255),
    PRIMARY KEY (Pol_id),
    FOREIGN KEY (Pol_aseguradora) REFERENCES Aseguradoras(Ase_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (Pol_unidad_id) REFERENCES Unidades(Uni_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (Pol_tipo_poliza) REFERENCES Tipo_poliza(TpP_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Una poliza puede tener uno o muchos endosos.
CREATE TABLE IF NOT EXISTS Endoso(
    End_id INT NOT NULL AUTO_INCREMENT,
    End_endoso VARCHAR(6) NOT NULL,
    End_poliza INT NOT NULL,
    End_url VARCHAR(255),
    PRIMARY KEY (End_id),
    UNIQUE KEY uq_endoso_poliza_numero (End_poliza, End_endoso),
    FOREIGN KEY (End_poliza) REFERENCES Polizas(Pol_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Un endoso puede tener uno o muchos incisos.
CREATE TABLE IF NOT EXISTS Inciso(
    Inc_id INT NOT NULL AUTO_INCREMENT,
    Inc_endoso INT NOT NULL,
    Inc_inciso VARCHAR(6) NOT NULL,
    Inc_url VARCHAR(255),
    PRIMARY KEY (Inc_id),
    UNIQUE KEY uq_inciso_endoso_numero (Inc_endoso, Inc_inciso),
    FOREIGN KEY (Inc_endoso) REFERENCES Endoso(End_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- =========================================================
-- PERMISOS ESPECIALES
-- =========================================================
CREATE TABLE IF NOT EXISTS Doble_articulado(
    PDA_id INT NOT NULL AUTO_INCREMENT,
    PDA_permiso VARCHAR(30) NOT NULL,
    PDA_unidad_id BIGINT UNSIGNED NOT NULL,
    PDA_fecha_obtencion DATE NOT NULL,
    PDA_fecha_vencimiento DATE NOT NULL,
    PDA_url VARCHAR(255),
    PRIMARY KEY (PDA_id),
    FOREIGN KEY (PDA_unidad_id) REFERENCES Unidades(Uni_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS SICT(
    SICT_id INT NOT NULL AUTO_INCREMENT,
    SICT_permiso VARCHAR(30) NOT NULL,
    SICT_unidad_id BIGINT UNSIGNED NOT NULL,
    SICT_fecha_obtencion DATE NOT NULL,
    SICT_fecha_vencimiento DATE NOT NULL,
    SICT_url VARCHAR(255),
    PRIMARY KEY (SICT_id),
    FOREIGN KEY (SICT_unidad_id) REFERENCES Unidades(Uni_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- =========================================================
-- PLACAS
-- Se conserva la relacion Placa -> Tarjeta de circulacion.
-- El historial de movimientos de placa se mantiene en Detalle_placas.
-- =========================================================
CREATE TABLE IF NOT EXISTS Placas(
    Pla_id INT NOT NULL AUTO_INCREMENT,
    Pla_placas VARCHAR(10) NOT NULL UNIQUE,
    Pla_status VARCHAR(20) NOT NULL,
    Pla_propietario INT,
    Pla_empresa_actual INT NOT NULL,
    PRIMARY KEY (Pla_id),
    FOREIGN KEY (Pla_propietario) REFERENCES Empresas(Emp_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    FOREIGN KEY (Pla_empresa_actual) REFERENCES Empresas(Emp_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Detalle_placas(
    DP_id INT NOT NULL AUTO_INCREMENT,
    DP_placas_id INT NOT NULL,
    DP_tipo_movimiento INT NOT NULL,
    DP_costo DECIMAL(12,2) NOT NULL,
    DP_fecha DATE NOT NULL,
    DP_url VARCHAR(255),
    PRIMARY KEY (DP_id),
    FOREIGN KEY (DP_placas_id) REFERENCES Placas(Pla_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (DP_tipo_movimiento) REFERENCES Tipo_movimiento_placa(TpMP_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- =========================================================
-- TARJETA DE CIRCULACION
-- La tarjeta queda asociada a una unidad y sus placas.
-- Esta relacion es coherente con el uso del tramite/documentacion
-- vehicular en las fuentes oficiales consultadas.
-- =========================================================
CREATE TABLE IF NOT EXISTS Tarjeta_circulacion(
    TC_id INT NOT NULL AUTO_INCREMENT,
    TC_tarjeta VARCHAR(50) NOT NULL UNIQUE,
    TC_unidad_id BIGINT UNSIGNED NOT NULL,
    TC_costo DECIMAL(12,2) NOT NULL,
    TC_tipo INT NOT NULL,
    TC_status VARCHAR(20) NOT NULL,
    TC_no_original VARCHAR(50),
    TC_placas_id INT NOT NULL,
    TC_fecha_obtencion DATE NOT NULL,
    TC_fecha_vencimiento DATE,
    TC_fecha_reposicion DATE,
    TC_costo_reposicion DECIMAL(12,2),
    TC_url VARCHAR(255),
    TC_url_reposicion VARCHAR(255),
    PRIMARY KEY (TC_id),
    FOREIGN KEY (TC_unidad_id) REFERENCES Unidades(Uni_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (TC_tipo) REFERENCES Tipo_tarjeta(TpT_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (TC_placas_id) REFERENCES Placas(Pla_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Cotejos(
    Cot_id INT NOT NULL AUTO_INCREMENT,
    Cot_tarjeta_id INT NOT NULL,
    Cot_tarjeta_cotejo VARCHAR(50) NOT NULL,
    Cot_fecha DATE NOT NULL,
    PRIMARY KEY (Cot_id),
    FOREIGN KEY (Cot_tarjeta_id) REFERENCES Tarjeta_circulacion(TC_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Archivos (
  Arc_id INT NOT NULL AUTO_INCREMENT,
  Arc_uuid CHAR(36) NOT NULL UNIQUE,
  Arc_nombre_original VARCHAR(255) NOT NULL,
  Arc_ruta VARCHAR(500) NOT NULL,          -- ruta relativa: uploads/{tipo}/{uuid}.ext
  Arc_mime VARCHAR(100) NOT NULL,
  Arc_tamano INT NOT NULL,                 -- bytes
  Arc_tipo VARCHAR(30) NOT NULL,           -- factura | poliza | tarjeta | sict | ...
  Arc_empresa INT NOT NULL,
  Arc_subido_por INT NOT NULL,
  Arc_fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (Arc_id),
  FOREIGN KEY (Arc_empresa) REFERENCES Empresas(Emp_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (Arc_subido_por) REFERENCES Usuario(Usu_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_arc_empresa (Arc_empresa),
  INDEX idx_arc_uuid (Arc_uuid)
);

-- =========================================================
-- INDICES
-- =========================================================
-- Unidades por empresa y estatus.
CREATE INDEX idx_uni_empresa_status ON Unidades (Uni_empresa_actual, Uni_status);

-- Busqueda del numero economico, serie y motor.
CREATE INDEX idx_uni_no_economico ON Unidades (Uni_no_economico);
CREATE INDEX idx_uni_no_serie ON Unidades (Uni_no_serie);
CREATE INDEX idx_uni_no_motor ON Unidades (Uni_no_motor);

-- FKs y consultas frecuentes de unidades.
CREATE INDEX idx_uni_propietario ON Unidades (Uni_propietario);
CREATE INDEX idx_uni_tipo_estado ON Unidades (Uni_tipo, Uni_estado);

-- Placas por empresa y estatus.
CREATE INDEX idx_pla_empresa_status ON Placas (Pla_empresa_actual, Pla_status);
CREATE INDEX idx_pla_propietario ON Placas (Pla_propietario);

-- Pólizas: numero visible, aseguradora y vigencia.
CREATE INDEX idx_pol_numero ON Polizas (Pol_poliza);
CREATE INDEX idx_pol_aseguradora_numero ON Polizas (Pol_aseguradora, Pol_poliza);
CREATE INDEX idx_pol_unidad_fin ON Polizas (Pol_unidad_id, Pol_fecha_fin);
CREATE INDEX idx_pol_fecha_fin ON Polizas (Pol_fecha_fin);

-- Relaciones y consulta de endosos/incisos.
CREATE INDEX idx_end_poliza ON Endoso (End_poliza);
CREATE INDEX idx_inc_endoso ON Inciso (Inc_endoso);

-- Permisos especiales por unidad y vencimiento.
CREATE INDEX idx_pda_unidad_vencimiento ON Doble_articulado (PDA_unidad_id, PDA_fecha_vencimiento);
CREATE INDEX idx_sict_unidad_vencimiento ON SICT (SICT_unidad_id, SICT_fecha_vencimiento);

-- Tarjetas por unidad, placa, vencimiento y estatus.
CREATE INDEX idx_tc_unidad ON Tarjeta_circulacion (TC_unidad_id);
CREATE INDEX idx_tc_placas ON Tarjeta_circulacion (TC_placas_id);
CREATE INDEX idx_tc_vencimiento ON Tarjeta_circulacion (TC_fecha_vencimiento);
CREATE INDEX idx_tc_status ON Tarjeta_circulacion (TC_status);

-- Historial de movimientos y detalle de placas.
CREATE INDEX idx_mov_fecha ON Movimientos (Mov_fecha);
CREATE INDEX idx_mov_tabla_registro ON Movimientos (Mov_tabla_afectada, Mov_registro_afectado);
CREATE INDEX idx_mov_usu_fecha ON Movimientos (Mov_usu_id, Mov_fecha);
CREATE INDEX idx_dp_placa_fecha ON Detalle_placas (DP_placas_id, DP_fecha);
CREATE INDEX idx_dp_fecha_tipo ON Detalle_placas (DP_fecha, DP_tipo_movimiento);

-- Cotejos.
CREATE INDEX idx_cot_tarjeta_fecha ON Cotejos (Cot_tarjeta_id, Cot_fecha);
CREATE INDEX idx_cot_fecha ON Cotejos (Cot_fecha);

-- Verificaciones vigentes en Unidades (sin historial).
CREATE INDEX idx_uni_verif_mecanica ON Unidades (Uni_fecha_verificacion_mecanica);
CREATE INDEX idx_uni_verif_contam ON Unidades (Uni_fecha_verificacion_contaminantes);
