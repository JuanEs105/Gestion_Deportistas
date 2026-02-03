--
-- PostgreSQL database dump
--

\restrict ESMhbp5EhycyB9uI7PEAENA6DTEFogYbnABv2n3Idqt36NvtEJZdEazvsyhF23K

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-02-03 14:35:03

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

--
-- TOC entry 5119 (class 0 OID 41408)
-- Dependencies: 219
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SequelizeMeta" (name) FROM stdin;
\.


--
-- TOC entry 5120 (class 0 OID 41443)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, nombre, apellidos, email, password, role, tipo_documento, numero_documento, ciudad, telefono, direccion, fecha_nacimiento, activo, acepta_terminos, niveles_asignados, grupos_competitivos, foto_perfil, reset_password_code, reset_password_expires, verification_token, verification_token_expires, requiere_registro, token_registro, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5125 (class 0 OID 41689)
-- Dependencies: 225
-- Data for Name: calendario_eventos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calendario_eventos (id, titulo, descripcion, fecha, hora, ubicacion, nivel, grupo_competitivo, tipo, tipo_personalizado, entrenador_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5121 (class 0 OID 41531)
-- Dependencies: 221
-- Data for Name: deportistas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deportistas (id, user_id, fecha_nacimiento, ciudad_nacimiento, altura, peso, nivel_deportivo, direccion, eps, talla_camiseta, nivel_actual, nivel_sugerido, equipo_competitivo, cambio_nivel_pendiente, fecha_ultimo_cambio_nivel, estado, foto_perfil, documento_identidad, contacto_emergencia_nombre, contacto_emergencia_telefono, contacto_emergencia_parentesco, acepta_terminos, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5122 (class 0 OID 41579)
-- Dependencies: 222
-- Data for Name: habilidades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.habilidades (id, nombre, descripcion, nivel, categoria, obligatoria, puntuacion_minima, tipo, orden, activa, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5123 (class 0 OID 41601)
-- Dependencies: 223
-- Data for Name: evaluaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evaluaciones (id, deportista_id, habilidad_id, entrenador_id, fecha_evaluacion, puntuacion, completado, observaciones, video_url, intentos, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5124 (class 0 OID 41634)
-- Dependencies: 224
-- Data for Name: historial_niveles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historial_niveles (id, deportista_id, nivel_anterior, nivel_nuevo, aprobado_por, fecha_cambio, observaciones, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5126 (class 0 OID 41749)
-- Dependencies: 226
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notificaciones (id, user_id, evento_id, tipo, titulo, mensaje, leida, fecha_leida, prioridad, icono, url, metadata, expira_en, created_at, updated_at) FROM stdin;
\.


-- Completed on 2026-02-03 14:35:03

--
-- PostgreSQL database dump complete
--

\unrestrict ESMhbp5EhycyB9uI7PEAENA6DTEFogYbnABv2n3Idqt36NvtEJZdEazvsyhF23K

