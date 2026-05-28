-- ============================================================
-- SEED DATA - Amakuru y'Igerageza
-- Inzego z'Ubutegetsi → Roles → Abakoresha → Ibibazo
-- ============================================================

USE system_yibanze;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. AKARERE (Districts)
-- ============================================================
INSERT INTO akarere (id, izina, code) VALUES
  (1, 'Gasabo',     'GSB'),
  (2, 'Kicukiro',   'KCK'),
  (3, 'Nyarugenge', 'NYR'),
  (4, 'Bugesera',   'BGS'),
  (5, 'Rwamagana',  'RWM');

-- ============================================================
-- 2. UMURENGE (Sectors)
-- ============================================================
INSERT INTO umurenge (id, izina, code, akarere_id) VALUES
  (1, 'Remera',      'REM', 1),
  (2, 'Kimironko',   'KIM', 1),
  (3, 'Gikondo',     'GKD', 2),
  (4, 'Nyamirambo',  'NYM', 3),
  (5, 'Rilima',      'RIL', 4);

-- ============================================================
-- 3. AKAGARI (Cells)
-- ============================================================
INSERT INTO akagari (id, izina, code, umurenge_id) VALUES
  (1, 'Bibare',       'BIB', 1),
  (2, 'Rukiri I',     'RK1', 1),
  (3, 'Gikondo I',    'GK1', 3),
  (4, 'Nyamirambo I', 'NY1', 4);

-- ============================================================
-- 4. UMUDUGUDU (Villages)
-- ============================================================
INSERT INTO umudugudu (id, izina, code, akagari_id) VALUES
  (1, 'Bibare I',    'BB1',  1),
  (2, 'Bibare II',   'BB2',  1),
  (3, 'Rukiri I A',  'RK1A', 2),
  (4, 'Gikondo I A', 'GK1A', 3);

-- ============================================================
-- 5. ROLES (already inserted by schema, but ensure they exist)
-- ============================================================
INSERT IGNORE INTO roles (id, izina, slug, description) VALUES
  (1, 'Umuturage',            'umuturage',         'Umuturage asanzwe'),
  (2, 'Umukuru w\'Umudugudu', 'umukuru_umudugudu', 'Umuyobozi w\'Umudugudu'),
  (3, 'ES w\'Akagari',        'es_akagari',         'Umunyamabanga Nshingwabikorwa w\'Akagari'),
  (4, 'ES w\'Umurenge',       'es_umurenge',        'Umunyamabanga Nshingwabikorwa w\'Umurenge'),
  (5, 'Umuyobozi w\'Akarere', 'admin_akarere',      'Umuyobozi Mukuru w\'Akarere');

-- ============================================================
-- 6. ABAKORESHA (Test Users)
-- Ijambo banga ryose: Test@1234
-- bcrypt hash (cost 10): $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- ============================================================
INSERT INTO abakoresha
  (id, indangamuntu, telephone, amazina, ijambo_banga, email,
   role_id, umudugudu_id, akagari_id, umurenge_id, akarere_id,
   nida_verified, status)
VALUES
  -- Umuturage
  (1, '1199780123456789', '0781234567', 'UWIMANA Jean Pierre',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'jean@example.com', 1, 1, 1, 1, 1, TRUE, 'active'),

  -- Umukuru w'Umudugudu
  (2, '1199780234567890', '0782345678', 'HABIMANA Emmanuel',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'emmanuel@example.com', 2, 1, 1, 1, 1, TRUE, 'active'),

  -- ES w'Akagari
  (3, '1199780345678901', '0783456789', 'MUKAMANA Alice',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'alice@example.com', 3, 1, 1, 1, 1, TRUE, 'active'),

  -- ES w'Umurenge
  (4, '1199780456789012', '0784567890', 'NIYONZIMA Patrick',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'patrick@example.com', 4, 1, 1, 1, 1, TRUE, 'active'),

  -- Umuyobozi w'Akarere
  (5, '1199780567890123', '0785678901', 'BIZIMANA Robert',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'robert@example.com', 5, 1, 1, 1, 1, TRUE, 'active');

-- ============================================================
-- 7. IBIBAZO (Sample Issues)
-- ============================================================
INSERT INTO ibibazo
  (id, ticket_number, umutwe, ibisobanuro, icyiciro, intera, status,
   umuturage_id, umudugudu_id, akagari_id, umurenge_id, akarere_id,
   urwego_rwahawe)
VALUES
  (1, 'ISS-2024-001001',
   'Inzira y\'Umudugudu Yarangiye',
   'Inzira y\'umudugudu wacu yarangiye cyane. Imodoka ntishobora kunyura neza cyane cyane mu gihe cy\'imvura.',
   'ibikorwa_remezo', 'ikomeye', 'gutegereza',
   1, 1, 1, 1, 1, 'umudugudu'),

  (2, 'ISS-2024-001002',
   'Isuku ry\'Akarere Ntirikorwa',
   'Isuku ry\'akarere kacu ntirikorwa neza. Imyanda irakusanywa rimwe gusa mu cyumweru.',
   'isuku', 'hagati', 'mu_gikorwa',
   1, 1, 1, 1, 1, 'akagari'),

  (3, 'ISS-2024-001003',
   'Umutekano w\'Ijoro',
   'Mu mudugudu wacu nta muco w\'ijoro. Abantu batinya kugenda nijoro.',
   'umutekano', 'byihutirwa', 'yashyizwe_hejuru',
   1, 1, 1, 1, 1, 'umurenge'),

  (4, 'ISS-2024-001004',
   'Amazi Meza Ntabaho',
   'Amazi meza ntabaho mu mudugudu wacu. Abaturage bafata amazi mu nzuzi.',
   'imibereho', 'ikomeye', 'yemejwe',
   1, 1, 1, 1, 1, 'akarere'),

  (5, 'ISS-2024-001005',
   'Ishuri Ryabuze Amasomo',
   'Ishuri rya Remera Primary ryabuze amasomo kubera nta mwarimu.',
   'uburezi', 'hagati', 'gutegereza',
   1, 1, 1, 1, 1, 'umudugudu');

-- ============================================================
-- 8. IBYAKOZWE (Action Logs)
-- ============================================================
INSERT INTO ibyakozwe (ikibazo_id, ukoreye, igikorwa, urwego_bwageze, ibisobanuro) VALUES
  (1, 1, 'byashyizwe',        'umudugudu', 'Ikibazo cyashyizwe na umuturage.'),
  (2, 1, 'byashyizwe',        'umudugudu', 'Ikibazo cyashyizwe na umuturage.'),
  (2, 2, 'byakirwa',          'umudugudu', 'Ikibazo cyakirwa na Umukuru w\'Umudugudu.'),
  (3, 1, 'byashyizwe',        'umudugudu', 'Ikibazo cyashyizwe na umuturage.'),
  (3, 2, 'byashyizwe_hejuru', 'akagari',   'Ikibazo cyashyizwe hejuru ku Akagari kubera intera yacyo.'),
  (4, 1, 'byashyizwe',        'umudugudu', 'Ikibazo cyashyizwe na umuturage.'),
  (4, 5, 'byakemutse',        'akarere',   'Amazi meza yashyizweho. Ikibazo gikemutse.');

-- ============================================================
-- 9. IMPUSHYA (Sample Certificates)
-- ============================================================
INSERT INTO impushya (cert_number, ubwoko, umuturage_id, umudugudu_id, status, ibisobanuro) VALUES
  ('CERT-2024-001001', 'ubuturage', 1, 1, 'gutegereza',
   'Nsaba indangagaciro y\'ubuturage kugira ngo nkore akazi.'),
  ('CERT-2024-001002', 'ubukene',   1, 1, 'yemejwe',
   'Nsaba indangagaciro y\'ubukene kugira ngo nbone inkunga.');

-- ============================================================
-- 10. IBIKORWA (Sample Projects)
-- ============================================================
INSERT INTO ibikorwa
  (izina, ibisobanuro, icyiciro, status, akarere_id, umurenge_id,
   ingenzi, itariki_itangira, itariki_irangira, aho_bigeze)
VALUES
  ('Kubaka Inzira ya Remera - Kimironko',
   'Kubaka inzira nshya hagati ya Remera na Kimironko.',
   'ibikorwa_remezo', 'mu_gikorwa', 1, 1,
   500000000.00, '2024-01-15', '2024-12-31', 45),

  ('Gushyiraho Amazi Meza mu Gikondo',
   'Gushyiraho sisitemu y\'amazi meza mu Gikondo.',
   'ibikorwa_remezo', 'gutegurwa', 1, NULL,
   300000000.00, '2024-06-01', '2025-06-30', 0),

  ('Kubaka Ishuri rya Nyamirambo',
   'Kubaka amashuri mashya mu Nyamirambo.',
   'uburezi', 'mu_gikorwa', 1, NULL,
   200000000.00, '2024-03-01', '2024-11-30', 70);

-- ============================================================
-- 11. UBUTUMWA (Sample Notifications)
-- ============================================================
INSERT INTO ubutumwa (uwakiriye_id, ubwoko, umutwe, ibisobanuro, reference_id, yasomwe) VALUES
  (1, 'ikibazo',  'Ikibazo cyawe gikemutse!',
   'Ikibazo #ISS-2024-001004 gikemutse. Amazi meza yashyizweho.', 4, FALSE),
  (1, 'impushya', 'Impushya yawe yemejwe!',
   'Impushya CERT-2024-001002 yemejwe. Ushobora kuyikura.', 2, FALSE),
  (2, 'ikibazo',  'Ikibazo gishya mu Mudugudu wawe',
   'Ikibazo gishya: Inzira y\'Umudugudu Yarangiye', 1, FALSE);

SET FOREIGN_KEY_CHECKS = 1;
