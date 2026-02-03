--
-- PostgreSQL database dump
--

\restrict jAefDBbSgllohaUyQ7t73tmA68frdd6brJOc3tBaopowq6nK07gIdqTnrlIhHSu

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-02-03 14:11:15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 227 (class 1259 OID 24952)
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 24901)
-- Name: calendario_eventos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendario_eventos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(255) NOT NULL,
    descripcion text,
    fecha timestamp without time zone NOT NULL,
    nivel public.enum_calendario_eventos_nivel DEFAULT 'todos'::public.enum_calendario_eventos_nivel NOT NULL,
    tipo public.enum_calendario_eventos_tipo DEFAULT 'general'::public.enum_calendario_eventos_tipo NOT NULL,
    entrenador_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    grupo_competitivo character varying(255) DEFAULT NULL::character varying,
    hora time without time zone,
    ubicacion character varying(255),
    tipo_personalizado character varying(255)
);


ALTER TABLE public.calendario_eventos OWNER TO postgres;

--
-- TOC entry 5170 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN calendario_eventos.grupo_competitivo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.calendario_eventos.grupo_competitivo IS 'Grupo competitivo específico. Null = para todos los grupos';


--
-- TOC entry 5171 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN calendario_eventos.hora; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.calendario_eventos.hora IS 'Hora del evento';


--
-- TOC entry 5172 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN calendario_eventos.ubicacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.calendario_eventos.ubicacion IS 'Ubicación del evento';


--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN calendario_eventos.tipo_personalizado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.calendario_eventos.tipo_personalizado IS 'Tipo personalizado cuando tipo = otro';


--
-- TOC entry 220 (class 1259 OID 16453)
-- Name: deportistas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deportistas (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    fecha_nacimiento timestamp with time zone,
    altura double precision,
    peso double precision,
    nivel_actual public.enum_deportistas_nivel_actual DEFAULT '1_basico'::public.enum_deportistas_nivel_actual,
    estado public.enum_deportistas_estado_new DEFAULT 'activo'::public.enum_deportistas_estado_new,
    foto_perfil character varying(255),
    contacto_emergencia_nombre character varying(255),
    contacto_emergencia_telefono character varying(255),
    contacto_emergencia_parentesco character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    nivel_sugerido public.enum_deportistas_nivel_sugerido,
    cambio_nivel_pendiente boolean DEFAULT false,
    fecha_ultimo_cambio_nivel timestamp with time zone,
    porcentaje_completado double precision DEFAULT 0.0,
    nivel_deportivo character varying(50),
    acepta_terminos boolean DEFAULT false,
    documento_identidad character varying(255),
    equipo_competitivo public.equipo_competitivo_enum DEFAULT 'sin_equipo'::public.equipo_competitivo_enum,
    direccion character varying(255),
    eps character varying(100),
    talla_camiseta character varying(10),
    ciudad_nacimiento character varying(100) DEFAULT NULL::character varying
);


ALTER TABLE public.deportistas OWNER TO postgres;

--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN deportistas.altura; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.deportistas.altura IS 'Altura en metros (ej: 1.65)';


--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN deportistas.peso; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.deportistas.peso IS 'Peso en kilogramos (ej: 55.5)';


--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN deportistas.nivel_sugerido; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.deportistas.nivel_sugerido IS 'Siguiente nivel sugerido cuando completa el 100%';


--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN deportistas.cambio_nivel_pendiente; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.deportistas.cambio_nivel_pendiente IS 'Indica si hay un cambio de nivel pendiente de aprobación';


--
-- TOC entry 5178 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN deportistas.fecha_ultimo_cambio_nivel; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.deportistas.fecha_ultimo_cambio_nivel IS 'Fecha del último cambio de nivel aprobado';


--
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN deportistas.porcentaje_completado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.deportistas.porcentaje_completado IS 'Porcentaje completado del nivel actual (0-100)';


--
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN deportistas.documento_identidad; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.deportistas.documento_identidad IS 'URL del documento de identidad en PDF (Cloudinary)';


--
-- TOC entry 225 (class 1259 OID 24839)
-- Name: deportistas_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deportistas_backup (
    id uuid,
    user_id uuid,
    fecha_nacimiento timestamp with time zone,
    altura double precision,
    peso double precision,
    nivel_actual public.enum_deportistas_nivel_actual,
    estado public.enum_deportistas_estado,
    foto_perfil character varying(255),
    contacto_emergencia_nombre character varying(255),
    contacto_emergencia_telefono character varying(255),
    contacto_emergencia_parentesco character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    nivel_sugerido character varying(50),
    cambio_nivel_pendiente boolean,
    fecha_ultimo_cambio_nivel timestamp without time zone
);


ALTER TABLE public.deportistas_backup OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16604)
-- Name: evaluaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evaluaciones (
    id uuid NOT NULL,
    deportista_id uuid NOT NULL,
    habilidad_id uuid NOT NULL,
    entrenador_id uuid NOT NULL,
    fecha_evaluacion timestamp with time zone,
    puntuacion integer,
    completado boolean DEFAULT false,
    observaciones text,
    video_url character varying(255),
    intentos integer DEFAULT 1,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.evaluaciones OWNER TO postgres;

--
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN evaluaciones.intentos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.evaluaciones.intentos IS 'Número de veces que se ha evaluado esta habilidad';


--
-- TOC entry 223 (class 1259 OID 16630)
-- Name: grupos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grupos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    entrenador_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.grupos OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16588)
-- Name: habilidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.habilidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    nivel public.enum_habilidades_nivel,
    tipo character varying(50) DEFAULT 'habilidad'::character varying,
    orden integer DEFAULT 0,
    activa boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    categoria character varying(50),
    obligatoria boolean DEFAULT true,
    puntuacion_minima integer DEFAULT 3 NOT NULL
);


ALTER TABLE public.habilidades OWNER TO postgres;

--
-- TOC entry 5182 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN habilidades.categoria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.habilidades.categoria IS 'Categoría: habilidad, ejercicio_accesorio, postura';


--
-- TOC entry 5183 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN habilidades.obligatoria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.habilidades.obligatoria IS 'true si es obligatoria para pasar de nivel';


--
-- TOC entry 5184 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN habilidades.puntuacion_minima; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.habilidades.puntuacion_minima IS 'Puntuación mínima (1-5) para considerar completada la habilidad';


--
-- TOC entry 224 (class 1259 OID 16654)
-- Name: historial_niveles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_niveles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deportista_id uuid NOT NULL,
    nivel_anterior character varying(50),
    nivel_nuevo character varying(50) NOT NULL,
    aprobado_por uuid,
    fecha_cambio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    observaciones text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.historial_niveles OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 24987)
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    evento_id uuid,
    tipo character varying(50) DEFAULT 'nuevo_evento'::character varying NOT NULL,
    titulo character varying(200) NOT NULL,
    mensaje text NOT NULL,
    leida boolean DEFAULT false,
    fecha_leida timestamp without time zone,
    prioridad character varying(20) DEFAULT 'media'::character varying,
    icono character varying(10) DEFAULT '📢'::character varying,
    url character varying(500),
    metadata jsonb,
    expira_en timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_notificaciones_prioridad CHECK (((prioridad)::text = ANY ((ARRAY['baja'::character varying, 'media'::character varying, 'alta'::character varying, 'urgente'::character varying])::text[]))),
    CONSTRAINT chk_notificaciones_tipo CHECK (((tipo)::text = ANY ((ARRAY['nuevo_evento'::character varying, 'evento_modificado'::character varying, 'evento_eliminado'::character varying, 'recordatorio_24h'::character varying, 'recordatorio_1h'::character varying, 'evento_hoy'::character varying, 'evaluacion_pendiente'::character varying, 'nivel_completado'::character varying, 'promocion_aprobada'::character varying, 'mensaje_sistema'::character varying])::text[])))
);


ALTER TABLE public.notificaciones OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16397)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    nombre character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255),
    role public.enum_users_role DEFAULT 'deportista'::public.enum_users_role,
    telefono character varying(255),
    activo boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    reset_password_code character varying(255),
    reset_password_expires timestamp with time zone,
    acepta_terminos boolean DEFAULT true,
    fecha_nacimiento date,
    requiere_registro boolean DEFAULT true,
    grupos_competitivos json DEFAULT '[]'::json NOT NULL,
    niveles_asignados json DEFAULT '[]'::json NOT NULL,
    verification_token character varying(255),
    verification_token_expires timestamp with time zone,
    token_registro character varying(255),
    foto_perfil character varying(255),
    apellidos character varying(255) DEFAULT ''::character varying,
    tipo_documento public.tipo_documento_enum,
    numero_documento character varying(50) DEFAULT NULL::character varying,
    ciudad character varying(100) DEFAULT NULL::character varying,
    direccion character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5185 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN users.reset_password_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.reset_password_code IS 'Código de 6 dígitos para recuperación';


--
-- TOC entry 5186 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN users.reset_password_expires; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.reset_password_expires IS 'Fecha de expiración del código';


--
-- TOC entry 5187 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN users.acepta_terminos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.acepta_terminos IS 'Indica si aceptó términos y condiciones';


--
-- TOC entry 5163 (class 0 OID 24952)
-- Dependencies: 227
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SequelizeMeta" (name) FROM stdin;
20260106232523-add-documento-identidad-to-deportistas.js
20260112_agregar_equipos_competencia_baby_titans.js
20260113151900-add-grupo-competitivo-to-calendario.js
YYYYMMDDHHMMSS-update-puntuacion-escala.js
\.


--
-- TOC entry 5162 (class 0 OID 24901)
-- Dependencies: 226
-- Data for Name: calendario_eventos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calendario_eventos (id, titulo, descripcion, fecha, nivel, tipo, entrenador_id, created_at, updated_at, grupo_competitivo, hora, ubicacion, tipo_personalizado) FROM stdin;
\.


--
-- TOC entry 5156 (class 0 OID 16453)
-- Dependencies: 220
-- Data for Name: deportistas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deportistas (id, user_id, fecha_nacimiento, altura, peso, nivel_actual, estado, foto_perfil, contacto_emergencia_nombre, contacto_emergencia_telefono, contacto_emergencia_parentesco, created_at, updated_at, nivel_sugerido, cambio_nivel_pendiente, fecha_ultimo_cambio_nivel, porcentaje_completado, nivel_deportivo, acepta_terminos, documento_identidad, equipo_competitivo, direccion, eps, talla_camiseta, ciudad_nacimiento) FROM stdin;
\.


--
-- TOC entry 5161 (class 0 OID 24839)
-- Dependencies: 225
-- Data for Name: deportistas_backup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deportistas_backup (id, user_id, fecha_nacimiento, altura, peso, nivel_actual, estado, foto_perfil, contacto_emergencia_nombre, contacto_emergencia_telefono, contacto_emergencia_parentesco, created_at, updated_at, nivel_sugerido, cambio_nivel_pendiente, fecha_ultimo_cambio_nivel) FROM stdin;
ffd5176e-0a2b-4f5e-9569-0714ba4c19eb	5bec28f8-ce58-4616-8a1e-737ed8a3342e	2001-05-14 19:00:00-05	1.75	68	1_basico	activo	\N	\N	\N	\N	2025-12-28 19:27:54.107-05	2025-12-28 19:27:54.107-05	\N	f	\N
c5c72ebe-0cc1-4091-9d6f-bbbdbbac51f5	e87d11a8-3563-40c6-a497-38d6310be3b5	2000-01-01 00:00:00-05	1.75	65	1_basico	activo	\N	\N	\N	\N	2025-12-28 20:39:05.275-05	2025-12-28 20:39:05.275-05	\N	f	\N
c24291aa-384f-4270-95dd-2c59e1d318e8	62a375ce-2105-4f98-a65e-53d18be252e0	1999-12-31 19:00:00-05	1.8	65	1_basico	activo	\N				2025-12-28 20:39:05.828-05	2025-12-30 18:26:13.192-05	\N	f	\N
1e4dc13d-1bce-48f8-8ecd-e0df65af21d8	1b669c5f-13ed-4cdd-85b6-41910ded5d08	1999-12-31 19:00:00-05	1.75	65	1_basico	activo	https://res.cloudinary.com/dktqe9go6/image/upload/v1767196779/deportistas/elvpjpq36nblznimxrmz.jpg				2025-12-28 20:39:05.573-05	2025-12-31 11:36:32.275-05	\N	f	\N
\.


--
-- TOC entry 5158 (class 0 OID 16604)
-- Dependencies: 222
-- Data for Name: evaluaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evaluaciones (id, deportista_id, habilidad_id, entrenador_id, fecha_evaluacion, puntuacion, completado, observaciones, video_url, intentos, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5159 (class 0 OID 16630)
-- Dependencies: 223
-- Data for Name: grupos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grupos (id, nombre, descripcion, entrenador_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5157 (class 0 OID 16588)
-- Dependencies: 221
-- Data for Name: habilidades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.habilidades (id, nombre, descripcion, nivel, tipo, orden, activa, created_at, updated_at, categoria, obligatoria, puntuacion_minima) FROM stdin;
15df66be-a3e4-4997-aeec-cf93a4911f75	Extensión de brazos	\N	1_basico	habilidad	9	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
af15d0f4-9214-46af-a54f-7809ec2abf86	Rondada tempo flick	\N	4	habilidad	12	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
a2cc5f50-030e-4b5e-9ad1-116bc0640c58	Parada de manos rollo	\N	1_medio	habilidad	2	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
81a8522a-9b5e-4c80-9767-a4270614e868	Carrera a pique	\N	1_medio	habilidad	3	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
96fd4dc4-c125-4596-ae26-4ffbdb47ceba	Rollo adelante	\N	1_basico	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
c73082fd-7ac5-487d-968a-5ba71842572e	Arco	\N	1_basico	habilidad	2	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
0ae28916-b98c-49f4-bfeb-7305a0053cca	Medialuna	\N	1_basico	habilidad	3	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
b0c5981a-ce0e-4979-88e7-6ff1af6b9c6a	Rollo atrás agrupado	\N	1_basico	habilidad	4	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
813d5c39-0293-410a-acc8-90aa0a13f95b	Parada de manos contra la pared	\N	1_basico	habilidad	5	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
03ac2037-e369-421d-a789-eef6e3b30a6a	Parada de manos	\N	1_basico	habilidad	6	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
0d6452c0-776f-45f2-ba3d-527a03672a72	Rollo atrás carpado	\N	1_basico	habilidad	7	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
119669b9-b251-4591-add3-29d128e73c77	Rollo atrás extendido	\N	1_basico	habilidad	8	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
2cea9ab9-6267-42cb-b92b-e2bddf55dc95	Bajar en arco	\N	1_basico	habilidad	9	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
ffbc53c6-5797-4234-94f5-abda06424844	Salto T y salto touchdown	\N	1_basico	habilidad	10	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
4516c32e-2f92-4ac9-a6f9-a0ccc64177d2	Bajada en arco atrás y devuelta a pararse	\N	1_basico	habilidad	11	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
bc523a64-8d8a-4421-b6a6-a70902f30cb8	Bajar en arco pasada	\N	1_basico	habilidad	12	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
8b108860-631f-4c18-9107-786baaab1804	Pateo con una sola pierna a la pared	\N	1_basico	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
8926aed2-0ed1-4761-b8b2-ce6557fa3d2f	Pateo a la pared con cambio de pierna	\N	1_basico	habilidad	2	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
e7c0cc7c-ed20-4cd1-b79e-c99a7ba9a4e8	Arco pasar con ayuda de la pared (dominar cada uno de los niveles de arco pasada)	\N	1_basico	habilidad	3	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
26d4a8d8-21c9-458e-8ad8-1a373e4b56c1	Parada de manos caída supino	\N	1_basico	habilidad	4	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
03851a46-2773-44eb-813f-3ce7cd754d22	Parada de manos desde la pared rollo adelante	\N	1_basico	habilidad	5	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
4db80679-e978-4b45-bfc0-9abdc56da251	Parada de manos arco hacia adelante	\N	1_basico	habilidad	6	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
bce691bc-4a82-4ed9-babb-d00318272419	Parada de manos con pique caída supino	\N	1_basico	habilidad	7	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
7177e080-c165-4307-896d-4b39a8055dd2	Canoa	\N	1_basico	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
4bd0d3b1-bd20-4a1c-b99f-d014398fa350	Posición gimnástica supino	\N	1_basico	habilidad	2	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
38b21721-27ab-4aad-9013-9d17570307ef	Posición vela	\N	1_basico	habilidad	3	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
1534592b-0891-4541-bb60-c04975f6fb90	Salto extensión	\N	1_basico	habilidad	4	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
f21a4454-22ba-4409-8fb2-80f5d8731277	Yo - yo	\N	1_basico	habilidad	5	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
95a7f714-eaef-428e-a124-54e789225a93	Posiciones básicas para los brazos	\N	1_basico	habilidad	6	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
8bdb5805-5225-4c54-9e65-50eb69502514	Puntas de pies	\N	1_basico	habilidad	7	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
c936dfd1-156e-4a18-92f3-193d77f4b59f	Extensión de pies	\N	1_basico	habilidad	8	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
454a6ccd-9345-4450-8b3f-979d09bbafff	Tercera	\N	1_medio	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
24142ba4-62c8-4be3-b966-a0414b75839f	Cuarta	\N	1_medio	habilidad	4	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
4b3ee9b1-1fb4-4e4d-8ab5-99c116f473a7	Pasada atrás	\N	1_medio	habilidad	5	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
1d7b4c13-ed5d-400d-b47b-562d6cca64da	Pasada adelante	\N	1_medio	habilidad	6	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
d5522df6-bb0f-4da1-983a-8d8c959efa4c	Pasada atrás con cambio	\N	1_medio	habilidad	7	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
f4426b67-96ed-4d27-ab98-c7a6192d4b13	Ante salto medialuna	\N	1_medio	habilidad	8	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
161198b7-828c-4ec6-84d3-181f25a8209f	Pescado	\N	1_medio	habilidad	9	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
b03782ab-1f00-48f5-8aeb-7c3bad15acd9	Pasada de arco piernas juntas con altura	\N	1_medio	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
ad4b3c34-2c25-4f43-863b-104beac2dd88	Media luna a caer con dos pies (uno a uno)	\N	1_medio	habilidad	2	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
bb8fdea5-bd6a-4956-a2d4-42966c2935a9	Ante salto	\N	1_medio	habilidad	3	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
edb42df5-5845-4a5c-8aae-eeb5a9d9bcbe	Parada de cabeza	\N	1_medio	habilidad	4	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
db2d5b60-285b-4b1b-a45e-dacd679fea71	Split	\N	1_medio	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
79b84ede-9750-4498-83ef-a860670088b2	Spagari	\N	1_medio	habilidad	2	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
72d8cb84-3da1-4114-a215-55191fb471a3	Y	\N	1_medio	habilidad	3	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
51177473-657d-4b8f-83ff-01ead7652fd6	Classe	\N	1_medio	habilidad	4	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
5f55befc-d68d-443d-88b8-dedfba2dd33a	Salto extensión con medio giro	\N	1_medio	habilidad	5	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
b221c391-b2b0-4871-bc29-24994a0cf5f5	Posiciones básicas de ante salto	\N	1_medio	habilidad	6	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
97f20d30-c0b1-42fa-a536-2a740f3b8417	Canoa con brazos arriba	\N	1_medio	habilidad	7	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
a2dd8bf6-03d9-4b2a-937d-96b19bd40535	Quinta	\N	1_avanzado	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
809fa58b-d1eb-4006-a765-9c329eff051c	Valdez	\N	1_avanzado	habilidad	2	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
8b75ea14-e864-4208-b926-b231b8c433c2	Rondada	\N	1_avanzado	habilidad	3	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
8072822a-eb30-4176-af79-10ae1bbc351b	Pescado	\N	1_avanzado	habilidad	4	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
bc9e8208-304b-45e2-97b1-cf807aa6e9aa	Paloma	\N	1_avanzado	habilidad	5	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
b25e0990-3573-4e26-af98-eb6fca014ea2	Entrada en tigre caída supino	\N	1_avanzado	habilidad	6	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
9bda347d-1af1-4e74-a7e7-54c936107c41	Tigre	\N	1_avanzado	habilidad	7	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
ca176871-5893-4d26-b954-4d5ede13ff35	Paloma Rondada	\N	1_avanzado	habilidad	8	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
c9445b5a-55a4-4360-9533-b5119e24aa6a	Flick en tumbl track a postura	\N	1_avanzado	habilidad	9	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
29cec546-040e-4abd-b245-f2bb8bfde91e	Pasada de arco atrás con dos piernas	\N	1_avanzado	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
6f24e735-952b-4918-9abc-6ebe334058f5	Salto extensión con giro completo	\N	1_avanzado	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	postura	t	4
2c60a807-f5dd-4589-80fa-837913ca6c6b	Flick estático	\N	2	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
569fd2d9-6453-4aa3-986e-99761023866d	Rondada Flick	\N	2	habilidad	2	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
b4377719-7cae-4ff2-9fa0-7a8fbc868664	Rondada dos flick	\N	2	habilidad	3	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
9792cf29-dd01-49e0-8de7-77c575ebda0f	Flick a una pierna	\N	2	habilidad	4	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
edb86a4a-0398-413b-850f-3f0532fb5f90	Pasada atrás flick	\N	2	habilidad	5	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
8c1714f3-0d49-4d53-a4d2-313e258b67eb	Quinta flick	\N	2	habilidad	6	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
536e10c5-4608-48fb-a79a-7e4d58bf48c9	Media luna flick	\N	2	habilidad	7	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
5d7496a9-ca11-4443-b5cb-5a98643ef640	Paloma a dos pies	\N	2	habilidad	8	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
ac486faf-0ea3-4d96-92e1-36eb52b252a1	Dos Flick desde estático	\N	2	habilidad	9	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
e0273d88-12eb-4be5-8bb2-30aabf88ede6	Salto T/Touchdown con flick	\N	2	habilidad	10	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
aecd035f-3a6d-4e7a-a09f-0b7c54c137aa	Rondada 3 flick	\N	2	habilidad	11	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
4c1e5431-1603-4bb0-a912-0662372066c9	3 flick desde estático	\N	2	habilidad	12	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
78d45f51-6bb0-4c71-ace6-6fd47f40e3be	Mortal en tumbl track	\N	2	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
523ab055-af11-40f8-916c-7ddcf0c8860c	Parada de manos caída con medio giro caída	\N	2	habilidad	2	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	ejercicio_accesorio	t	4
cc9d64da-c5de-4999-8806-9457d6aab4c1	Mortal adelante	\N	3	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
99cd8481-93bc-4efd-aa74-f8978f70cfa4	Rondada mortal atrás	\N	3	habilidad	2	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
a68733ca-e118-48a8-9f62-4896313a554c	Rueda libre	\N	3	habilidad	3	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
6c66ce70-a0ab-403f-86a7-48c884b2e6a5	Rondada flick Mortal atrás	\N	3	habilidad	4	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
8d90e792-a664-4b5c-9bf9-fcf2225a57fd	Paloma a dos pies mortal adelante	\N	3	habilidad	5	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
3eb1eac0-c416-4181-8582-fbbb1029992f	Mortal atrás agrupado	\N	4	habilidad	1	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
ba97ab7d-2f05-4a02-bfc1-0208eecd354c	Media luna mortal atrás	\N	4	habilidad	2	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
fa9d5976-9d7e-4aff-bb33-e0e555a10e4d	Rondada tempo	\N	4	habilidad	3	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	4
51cd1178-99cc-495b-bee9-d00916770a52	2 flick mortal atrás	\N	4	habilidad	4	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
57545b01-4f74-4444-a527-d4f4efea1975	Rondada flick mortal atrás extendido	\N	4	habilidad	5	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
3ce4acbd-30fd-42b9-99c9-26e4f158745d	Pasada mortal atrás	\N	4	habilidad	6	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
65ea9d1b-4211-4bdf-8d64-c7b0812ee3d3	Salto ruso/ front dos flick mortal atrás agrupado	\N	4	habilidad	7	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
1d7668cb-7399-4ffa-9b06-8cfebd26bbfb	Rondada mortal atrás extendido	\N	4	habilidad	8	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
239b898e-8101-4683-aee2-dc9583702d97	Rondada flick mortal atrás extendido	\N	4	habilidad	9	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
0a2e926b-1d0e-4f19-9415-7c63ffef2cbc	Mortal adelante a desigualar rondada	\N	4	habilidad	10	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
94d066b3-2059-4944-8bfc-214652bbbccd	Mortal adelante rondada flick mortal agrupado	\N	4	habilidad	11	t	2025-12-31 23:54:17.161	2025-12-31 23:54:17.161	habilidad	t	3
\.


--
-- TOC entry 5160 (class 0 OID 16654)
-- Dependencies: 224
-- Data for Name: historial_niveles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historial_niveles (id, deportista_id, nivel_anterior, nivel_nuevo, aprobado_por, fecha_cambio, observaciones, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5164 (class 0 OID 24987)
-- Dependencies: 228
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notificaciones (id, user_id, evento_id, tipo, titulo, mensaje, leida, fecha_leida, prioridad, icono, url, metadata, expira_en, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5155 (class 0 OID 16397)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, nombre, email, password, role, telefono, activo, created_at, updated_at, reset_password_code, reset_password_expires, acepta_terminos, fecha_nacimiento, requiere_registro, grupos_competitivos, niveles_asignados, verification_token, verification_token_expires, token_registro, foto_perfil, apellidos, tipo_documento, numero_documento, ciudad, direccion) FROM stdin;
f8755d7e-1772-4aff-9f10-04da9775fa4c	Administrador del Sistema	admin@deportes.com	$2a$10$6czRKW8ZnXKHF3yOZ4Fw6eDIv6oliIs..fzIiIQ73lMn9KXqAK6Ha	admin	+57 300 000 0001	t	2026-01-03 17:39:55.922-05	2026-01-03 17:39:55.922-05	\N	\N	f	\N	t	[]	[]	\N	\N	\N	\N		\N	\N	\N	\N
\.


--
-- TOC entry 4989 (class 2606 OID 24957)
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- TOC entry 4983 (class 2606 OID 24918)
-- Name: calendario_eventos calendario_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendario_eventos
    ADD CONSTRAINT calendario_eventos_pkey PRIMARY KEY (id);


--
-- TOC entry 4962 (class 2606 OID 16466)
-- Name: deportistas deportistas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deportistas
    ADD CONSTRAINT deportistas_pkey PRIMARY KEY (id);


--
-- TOC entry 4971 (class 2606 OID 16618)
-- Name: evaluaciones evaluaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4976 (class 2606 OID 16641)
-- Name: grupos grupos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grupos
    ADD CONSTRAINT grupos_pkey PRIMARY KEY (id);


--
-- TOC entry 4967 (class 2606 OID 16603)
-- Name: habilidades habilidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habilidades
    ADD CONSTRAINT habilidades_pkey PRIMARY KEY (id);


--
-- TOC entry 4980 (class 2606 OID 16667)
-- Name: historial_niveles historial_niveles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_niveles
    ADD CONSTRAINT historial_niveles_pkey PRIMARY KEY (id);


--
-- TOC entry 4997 (class 2606 OID 25005)
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4956 (class 2606 OID 25028)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4958 (class 2606 OID 25030)
-- Name: users users_email_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key1 UNIQUE (email);


--
-- TOC entry 4960 (class 2606 OID 16411)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4963 (class 1259 OID 24869)
-- Name: habilidades_activa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX habilidades_activa ON public.habilidades USING btree (activa);


--
-- TOC entry 4964 (class 1259 OID 24868)
-- Name: habilidades_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX habilidades_categoria ON public.habilidades USING btree (categoria);


--
-- TOC entry 4965 (class 1259 OID 24867)
-- Name: habilidades_nivel; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX habilidades_nivel ON public.habilidades USING btree (nivel);


--
-- TOC entry 4977 (class 1259 OID 24870)
-- Name: historial_niveles_deportista_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX historial_niveles_deportista_id ON public.historial_niveles USING btree (deportista_id);


--
-- TOC entry 4978 (class 1259 OID 24871)
-- Name: historial_niveles_fecha_cambio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX historial_niveles_fecha_cambio ON public.historial_niveles USING btree (fecha_cambio);


--
-- TOC entry 4984 (class 1259 OID 24926)
-- Name: idx_calendario_entrenador; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendario_entrenador ON public.calendario_eventos USING btree (entrenador_id);


--
-- TOC entry 4985 (class 1259 OID 24924)
-- Name: idx_calendario_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendario_fecha ON public.calendario_eventos USING btree (fecha);


--
-- TOC entry 4986 (class 1259 OID 24985)
-- Name: idx_calendario_fecha_nivel; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendario_fecha_nivel ON public.calendario_eventos USING btree (fecha, nivel);


--
-- TOC entry 4987 (class 1259 OID 24984)
-- Name: idx_calendario_nivel; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendario_nivel ON public.calendario_eventos USING btree (nivel);


--
-- TOC entry 4972 (class 1259 OID 16704)
-- Name: idx_evaluaciones_deportista; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluaciones_deportista ON public.evaluaciones USING btree (deportista_id);


--
-- TOC entry 4973 (class 1259 OID 16706)
-- Name: idx_evaluaciones_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluaciones_fecha ON public.evaluaciones USING btree (fecha_evaluacion);


--
-- TOC entry 4974 (class 1259 OID 16705)
-- Name: idx_evaluaciones_habilidad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluaciones_habilidad ON public.evaluaciones USING btree (habilidad_id);


--
-- TOC entry 4968 (class 1259 OID 16651)
-- Name: idx_habilidades_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_habilidades_categoria ON public.habilidades USING btree (categoria);


--
-- TOC entry 4969 (class 1259 OID 16695)
-- Name: idx_habilidades_nivel; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_habilidades_nivel ON public.habilidades USING btree (nivel);


--
-- TOC entry 4981 (class 1259 OID 16678)
-- Name: idx_historial_deportista; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_deportista ON public.historial_niveles USING btree (deportista_id);


--
-- TOC entry 4990 (class 1259 OID 25021)
-- Name: idx_notificaciones_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificaciones_created_at ON public.notificaciones USING btree (created_at);


--
-- TOC entry 4991 (class 1259 OID 25017)
-- Name: idx_notificaciones_evento_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificaciones_evento_id ON public.notificaciones USING btree (evento_id);


--
-- TOC entry 4992 (class 1259 OID 25019)
-- Name: idx_notificaciones_leida; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificaciones_leida ON public.notificaciones USING btree (leida);


--
-- TOC entry 4993 (class 1259 OID 25020)
-- Name: idx_notificaciones_prioridad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificaciones_prioridad ON public.notificaciones USING btree (prioridad);


--
-- TOC entry 4994 (class 1259 OID 25018)
-- Name: idx_notificaciones_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificaciones_tipo ON public.notificaciones USING btree (tipo);


--
-- TOC entry 4995 (class 1259 OID 25016)
-- Name: idx_notificaciones_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificaciones_user_id ON public.notificaciones USING btree (user_id);


--
-- TOC entry 5007 (class 2620 OID 24930)
-- Name: calendario_eventos update_calendario_eventos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_calendario_eventos_updated_at BEFORE UPDATE ON public.calendario_eventos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4998 (class 2606 OID 25065)
-- Name: deportistas deportistas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deportistas
    ADD CONSTRAINT deportistas_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4999 (class 2606 OID 16619)
-- Name: evaluaciones evaluaciones_deportista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_deportista_id_fkey FOREIGN KEY (deportista_id) REFERENCES public.deportistas(id);


--
-- TOC entry 5000 (class 2606 OID 16624)
-- Name: evaluaciones evaluaciones_entrenador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_entrenador_id_fkey FOREIGN KEY (entrenador_id) REFERENCES public.users(id);


--
-- TOC entry 5004 (class 2606 OID 24919)
-- Name: calendario_eventos fk_calendario_eventos_entrenador; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendario_eventos
    ADD CONSTRAINT fk_calendario_eventos_entrenador FOREIGN KEY (entrenador_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5001 (class 2606 OID 16642)
-- Name: grupos grupos_entrenador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grupos
    ADD CONSTRAINT grupos_entrenador_id_fkey FOREIGN KEY (entrenador_id) REFERENCES public.users(id);


--
-- TOC entry 5002 (class 2606 OID 16673)
-- Name: historial_niveles historial_niveles_aprobado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_niveles
    ADD CONSTRAINT historial_niveles_aprobado_por_fkey FOREIGN KEY (aprobado_por) REFERENCES public.users(id);


--
-- TOC entry 5003 (class 2606 OID 16668)
-- Name: historial_niveles historial_niveles_deportista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_niveles
    ADD CONSTRAINT historial_niveles_deportista_id_fkey FOREIGN KEY (deportista_id) REFERENCES public.deportistas(id) ON DELETE CASCADE;


--
-- TOC entry 5005 (class 2606 OID 25011)
-- Name: notificaciones notificaciones_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.calendario_eventos(id) ON DELETE CASCADE;


--
-- TOC entry 5006 (class 2606 OID 25006)
-- Name: notificaciones notificaciones_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-02-03 14:11:15

--
-- PostgreSQL database dump complete
--

\unrestrict jAefDBbSgllohaUyQ7t73tmA68frdd6brJOc3tBaopowq6nK07gIdqTnrlIhHSu

