-- ============================================================
-- SYSTEM Y'IBANZE - DATABASE SCHEMA (Production-Grade)
-- Constraints, Indexes, na Check constraints zuzuye
-- ============================================================

CREATE DATABASE IF NOT EXISTS system_yibanze
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE system_yibanze;

-- Disable FK checks mu gihe cyo gushyiraho tables
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. INZEGO Z'UBUTEGETSI
-- ============================================================

CREATE TABLE IF NOT EXISTS akarere (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  izina      VARCHAR(100) NOT NULL,
  code       VARCHAR(10)  NOT NULL UNIQUE,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_akarere_izina CHECK (CHAR_LENGTH(TRIM(izina)) >= 2)
) ENGINE=InnoDB COMMENT='Akarere (District)';

CREATE TABLE IF NOT EXISTS umurenge (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  izina      VARCHAR(100) NOT NULL,
  code       VARCHAR(10)  NOT NULL UNIQUE,
  akarere_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_umurenge_akarere FOREIGN KEY (akarere_id)
    REFERENCES akarere(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_umurenge_izina CHECK (CHAR_LENGTH(TRIM(izina)) >= 2)
) ENGINE=InnoDB COMMENT='Umurenge (Sector)';

CREATE TABLE IF NOT EXISTS akagari (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  izina       VARCHAR(100) NOT NULL,
  code        VARCHAR(10)  NOT NULL UNIQUE,
  umurenge_id INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_akagari_umurenge FOREIGN KEY (umurenge_id)
    REFERENCES umurenge(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Akagari (Cell)';

CREATE TABLE IF NOT EXISTS umudugudu (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  izina      VARCHAR(100) NOT NULL,
  code       VARCHAR(10)  NOT NULL UNIQUE,
  akagari_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_umudugudu_akagari FOREIGN KEY (akagari_id)
    REFERENCES akagari(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Umudugudu (Village)';

-- ============================================================
-- 2. ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id          TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  izina       VARCHAR(60)  NOT NULL UNIQUE,
  slug        VARCHAR(50)  NOT NULL UNIQUE,
  description VARCHAR(255)
) ENGINE=InnoDB COMMENT='Inzego z\'Uruhare';

INSERT IGNORE INTO roles (id, izina, slug, description) VALUES
  (1, 'Umuturage',             'umuturage',          'Umuturage asanzwe'),
  (2, 'Umukuru w\'Umudugudu',  'umukuru_umudugudu',  'Umuyobozi w\'Umudugudu'),
  (3, 'ES w\'Akagari',         'es_akagari',          'Umunyamabanga Nshingwabikorwa w\'Akagari'),
  (4, 'ES w\'Umurenge',        'es_umurenge',         'Umunyamabanga Nshingwabikorwa w\'Umurenge'),
  (5, 'Umuyobozi w\'Akarere',  'admin_akarere',       'Umuyobozi Mukuru w\'Akarere');

-- ============================================================
-- 3. ABAKORESHA
-- ============================================================

CREATE TABLE IF NOT EXISTS abakoresha (
  id              INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  indangamuntu    VARCHAR(16)   NOT NULL UNIQUE COMMENT 'National ID (16 digits)',
  telephone       VARCHAR(15)   NOT NULL UNIQUE,
  amazina         VARCHAR(100)  NOT NULL,
  ijambo_banga    VARCHAR(255)  NOT NULL,
  email           VARCHAR(150)  UNIQUE,
  role_id         TINYINT UNSIGNED NOT NULL DEFAULT 1,
  umudugudu_id    INT UNSIGNED,
  akagari_id      INT UNSIGNED,
  umurenge_id     INT UNSIGNED,
  akarere_id      INT UNSIGNED,
  nida_verified   BOOLEAN       DEFAULT FALSE,
  nida_data       JSON,
  status          ENUM('active','inactive','suspended') DEFAULT 'active',
  foto            VARCHAR(255),
  refresh_token   TEXT,
  last_login      TIMESTAMP     NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Constraints
  CONSTRAINT fk_user_role      FOREIGN KEY (role_id)      REFERENCES roles(id),
  CONSTRAINT fk_user_umudugudu FOREIGN KEY (umudugudu_id) REFERENCES umudugudu(id),
  CONSTRAINT fk_user_akagari   FOREIGN KEY (akagari_id)   REFERENCES akagari(id),
  CONSTRAINT fk_user_umurenge  FOREIGN KEY (umurenge_id)  REFERENCES umurenge(id),
  CONSTRAINT fk_user_akarere   FOREIGN KEY (akarere_id)   REFERENCES akarere(id),
  -- Check constraints
  CONSTRAINT chk_indangamuntu  CHECK (indangamuntu REGEXP '^1[0-9]{15}$'),
  CONSTRAINT chk_telephone     CHECK (telephone REGEXP '^0[7][2-9][0-9]{7}$'),
  CONSTRAINT chk_email         CHECK (email IS NULL OR email REGEXP '^[^@]+@[^@]+\\.[^@]+$')
) ENGINE=InnoDB COMMENT='Abakoresha bose';

CREATE INDEX idx_abakoresha_role      ON abakoresha(role_id);
CREATE INDEX idx_abakoresha_umudugudu ON abakoresha(umudugudu_id);
CREATE INDEX idx_abakoresha_akagari   ON abakoresha(akagari_id);
CREATE INDEX idx_abakoresha_umurenge  ON abakoresha(umurenge_id);
CREATE INDEX idx_abakoresha_akarere   ON abakoresha(akarere_id);
CREATE INDEX idx_abakoresha_status    ON abakoresha(status);

-- ============================================================
-- 4. IBIBAZO (ISSUES / TICKETS)
-- ============================================================

CREATE TABLE IF NOT EXISTS ibibazo (
  id              INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  ticket_number   VARCHAR(20)   NOT NULL UNIQUE,
  umutwe          VARCHAR(200)  NOT NULL,
  ibisobanuro     TEXT          NOT NULL,
  icyiciro        ENUM('umutekano','isuku','imibereho','ibikorwa_remezo',
                       'uburezi','ubuzima','ubuhinzi','ibindi')
                  NOT NULL DEFAULT 'ibindi',
  intera          ENUM('yoroheje','hagati','ikomeye','byihutirwa')
                  DEFAULT 'yoroheje',
  status          ENUM('gutegereza','mu_gikorwa','yashyizwe_hejuru',
                       'yemejwe','yanzwe','ifunzwe')
                  DEFAULT 'gutegereza',
  umuturage_id    INT UNSIGNED  NOT NULL,
  umudugudu_id    INT UNSIGNED  NOT NULL,
  akagari_id      INT UNSIGNED,
  umurenge_id     INT UNSIGNED,
  akarere_id      INT UNSIGNED,
  urwego_rwahawe  ENUM('umudugudu','akagari','umurenge','akarere')
                  DEFAULT 'umudugudu',
  wahawe_id       INT UNSIGNED,
  igihe_cyarangiye TIMESTAMP    NULL,
  yemejwe_igihe   TIMESTAMP     NULL,
  attachments     JSON,
  latitude        DECIMAL(10,8),
  longitude       DECIMAL(11,8),
  inyenyeri       TINYINT UNSIGNED,
  igitekerezo_nyuma TEXT,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Constraints
  CONSTRAINT fk_ikibazo_umuturage FOREIGN KEY (umuturage_id) REFERENCES abakoresha(id),
  CONSTRAINT fk_ikibazo_umudugudu FOREIGN KEY (umudugudu_id) REFERENCES umudugudu(id),
  CONSTRAINT fk_ikibazo_akagari   FOREIGN KEY (akagari_id)   REFERENCES akagari(id),
  CONSTRAINT fk_ikibazo_umurenge  FOREIGN KEY (umurenge_id)  REFERENCES umurenge(id),
  CONSTRAINT fk_ikibazo_akarere   FOREIGN KEY (akarere_id)   REFERENCES akarere(id),
  CONSTRAINT fk_ikibazo_wahawe    FOREIGN KEY (wahawe_id)    REFERENCES abakoresha(id),
  CONSTRAINT chk_inyenyeri        CHECK (inyenyeri IS NULL OR (inyenyeri >= 1 AND inyenyeri <= 5)),
  CONSTRAINT chk_latitude         CHECK (latitude  IS NULL OR (latitude  BETWEEN -90  AND 90)),
  CONSTRAINT chk_longitude        CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180))
) ENGINE=InnoDB COMMENT='Ibibazo / Tickets';

CREATE INDEX idx_ibibazo_status    ON ibibazo(status);
CREATE INDEX idx_ibibazo_icyiciro  ON ibibazo(icyiciro);
CREATE INDEX idx_ibibazo_intera    ON ibibazo(intera);
CREATE INDEX idx_ibibazo_umuturage ON ibibazo(umuturage_id);
CREATE INDEX idx_ibibazo_umudugudu ON ibibazo(umudugudu_id);
CREATE INDEX idx_ibibazo_akagari   ON ibibazo(akagari_id);
CREATE INDEX idx_ibibazo_umurenge  ON ibibazo(umurenge_id);
CREATE INDEX idx_ibibazo_akarere   ON ibibazo(akarere_id);
CREATE INDEX idx_ibibazo_urwego    ON ibibazo(urwego_rwahawe);
CREATE INDEX idx_ibibazo_created   ON ibibazo(created_at);
-- Composite index kuri dashboard queries
CREATE INDEX idx_ibibazo_akarere_status ON ibibazo(akarere_id, status);
CREATE INDEX idx_ibibazo_akarere_date   ON ibibazo(akarere_id, created_at);

-- ============================================================
-- 5. IBYAKOZWE (AUDIT LOGS)
-- ============================================================

CREATE TABLE IF NOT EXISTS ibyakozwe (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ikibazo_id     INT UNSIGNED NOT NULL,
  ukoreye        INT UNSIGNED NOT NULL,
  igikorwa       ENUM('byashyizwe','byakirwa','byashyizwe_hejuru',
                      'byemejwe','byanzwe','byasubijwe','byakemutse',
                      'byafunzwe','igitekerezo') NOT NULL,
  urwego_bwasaga ENUM('umudugudu','akagari','umurenge','akarere'),
  urwego_bwageze ENUM('umudugudu','akagari','umurenge','akarere'),
  ibisobanuro    TEXT,
  ip_address     VARCHAR(45) COMMENT 'IP ya uwakoreye (IPv4/IPv6)',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_ikibazo FOREIGN KEY (ikibazo_id)
    REFERENCES ibibazo(id) ON DELETE CASCADE,
  CONSTRAINT fk_log_ukoreye FOREIGN KEY (ukoreye)
    REFERENCES abakoresha(id)
) ENGINE=InnoDB COMMENT='Ibyakozwe - Audit Trail';

CREATE INDEX idx_ibyakozwe_ikibazo ON ibyakozwe(ikibazo_id);
CREATE INDEX idx_ibyakozwe_ukoreye ON ibyakozwe(ukoreye);
CREATE INDEX idx_ibyakozwe_created ON ibyakozwe(created_at);

-- ============================================================
-- 6. IMPUSHYA (CERTIFICATES)
-- ============================================================

CREATE TABLE IF NOT EXISTS impushya (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cert_number   VARCHAR(20)  NOT NULL UNIQUE,
  ubwoko        ENUM('indangamuntu','ubutaka','ubuzima','ubuturage','ubukene','ibindi') NOT NULL,
  umuturage_id  INT UNSIGNED NOT NULL,
  umudugudu_id  INT UNSIGNED NOT NULL,
  status        ENUM('gutegereza','yemejwe','yanzwe') DEFAULT 'gutegereza',
  ibisobanuro   TEXT,
  yemejwe_na    INT UNSIGNED,
  yemejwe_igihe TIMESTAMP NULL,
  inyandiko     VARCHAR(255),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cert_umuturage FOREIGN KEY (umuturage_id) REFERENCES abakoresha(id),
  CONSTRAINT fk_cert_umudugudu FOREIGN KEY (umudugudu_id) REFERENCES umudugudu(id),
  CONSTRAINT fk_cert_yemejwe   FOREIGN KEY (yemejwe_na)   REFERENCES abakoresha(id)
) ENGINE=InnoDB COMMENT='Impushya / Certificates';

CREATE INDEX idx_impushya_umuturage ON impushya(umuturage_id);
CREATE INDEX idx_impushya_status    ON impushya(status);

-- ============================================================
-- 7. UBUTUMWA (NOTIFICATIONS)
-- ============================================================

CREATE TABLE IF NOT EXISTS ubutumwa (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uwakiriye_id INT UNSIGNED NOT NULL,
  ubwoko       ENUM('ikibazo','impushya','sisitemu','ubutumwa') DEFAULT 'sisitemu',
  umutwe       VARCHAR(200) NOT NULL,
  ibisobanuro  TEXT,
  reference_id INT UNSIGNED,
  yasomwe      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_uwakiriye FOREIGN KEY (uwakiriye_id)
    REFERENCES abakoresha(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Ubutumwa / Notifications';

CREATE INDEX idx_ubutumwa_uwakiriye ON ubutumwa(uwakiriye_id);
CREATE INDEX idx_ubutumwa_yasomwe   ON ubutumwa(yasomwe);
CREATE INDEX idx_ubutumwa_created   ON ubutumwa(created_at);

-- ============================================================
-- 8. INYANDIKO Z'IBANGA (INTERNAL MESSAGES)
-- ============================================================

CREATE TABLE IF NOT EXISTS inyandiko_zibanga (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ikibazo_id   INT UNSIGNED NOT NULL,
  uwanditse_id INT UNSIGNED NOT NULL,
  ubutumwa     TEXT         NOT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msg_ikibazo   FOREIGN KEY (ikibazo_id)   REFERENCES ibibazo(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_uwanditse FOREIGN KEY (uwanditse_id) REFERENCES abakoresha(id),
  CONSTRAINT chk_ubutumwa_len CHECK (CHAR_LENGTH(ubutumwa) >= 2)
) ENGINE=InnoDB COMMENT='Inyandiko z\'Ibanga hagati y\'Abayobozi';

CREATE INDEX idx_inyandiko_ikibazo ON inyandiko_zibanga(ikibazo_id);

-- ============================================================
-- 9. IBIKORWA (GOVERNMENT PROJECTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS ibikorwa (
  id                   INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  izina                VARCHAR(200)  NOT NULL,
  ibisobanuro          TEXT,
  icyiciro             ENUM('ibikorwa_remezo','uburezi','ubuzima','ubuhinzi','ibindi')
                       DEFAULT 'ibindi',
  status               ENUM('gutegurwa','mu_gikorwa','byarangiye','byahagaritswe')
                       DEFAULT 'gutegurwa',
  akarere_id           INT UNSIGNED,
  umurenge_id          INT UNSIGNED,
  ingenzi              DECIMAL(15,2) DEFAULT 0.00,
  ingenzi_yakoreshejwe DECIMAL(15,2) DEFAULT 0.00,
  itariki_itangira     DATE,
  itariki_irangira     DATE,
  aho_bigeze           TINYINT UNSIGNED DEFAULT 0,
  created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_proj_akarere  FOREIGN KEY (akarere_id)  REFERENCES akarere(id),
  CONSTRAINT fk_proj_umurenge FOREIGN KEY (umurenge_id) REFERENCES umurenge(id),
  CONSTRAINT chk_aho_bigeze   CHECK (aho_bigeze BETWEEN 0 AND 100),
  CONSTRAINT chk_ingenzi      CHECK (ingenzi >= 0),
  CONSTRAINT chk_dates        CHECK (
    itariki_itangira IS NULL OR itariki_irangira IS NULL OR
    itariki_irangira >= itariki_itangira
  )
) ENGINE=InnoDB COMMENT='Ibikorwa rya Leta';

CREATE INDEX idx_ibikorwa_akarere ON ibikorwa(akarere_id);
CREATE INDEX idx_ibikorwa_status  ON ibikorwa(status);

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;
