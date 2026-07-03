--
-- PostgreSQL database dump
--

\restrict MT7mIOv7elNwlFdcvZvXz0D9fyEr9gzq4Jh0pSaFmc4IJnlwMkRyc62nTSItFhZ

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-03-10 11:40:54

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
-- TOC entry 6 (class 2615 OID 17450)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 960 (class 1247 OID 17463)
-- Name: display_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.display_status_type AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public.display_status_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 17467)
-- Name: activation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activation (
    id integer NOT NULL,
    code character varying(10),
    customer_id integer,
    package_id integer,
    installation integer,
    install_date date,
    install_time character varying(10),
    staff_id integer,
    device_model character varying(100),
    device_serial character varying(200),
    remark character varying(200),
    status character varying(10),
    image_1 character varying(200),
    image_2 character varying(200),
    image_3 character varying(200),
    device_id character varying(100),
    display_status character varying(10) DEFAULT 'ACTIVE'::character varying
);


ALTER TABLE public.activation OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17474)
-- Name: activation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.activation ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.activation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 225 (class 1259 OID 17475)
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    id integer NOT NULL,
    street_address character varying(200),
    city character varying(100),
    state character varying(100),
    postal_code character varying(20),
    country character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17480)
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.addresses_id_seq OWNER TO postgres;

--
-- TOC entry 5389 (class 0 OID 0)
-- Dependencies: 226
-- Name: addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;


--
-- TOC entry 227 (class 1259 OID 17481)
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id bigint NOT NULL,
    event_time timestamp with time zone DEFAULT now() NOT NULL,
    actor_user_id bigint,
    actor_username character varying(150),
    action character varying(30) NOT NULL,
    entity_table character varying(80) NOT NULL,
    entity_id character varying(80),
    module character varying(80),
    endpoint character varying(200),
    description text,
    before_data jsonb,
    after_data jsonb,
    changed_fields jsonb,
    ip_address character varying(45),
    user_agent text,
    request_id character varying(80)
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17491)
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_id_seq OWNER TO postgres;

--
-- TOC entry 5390 (class 0 OID 0)
-- Dependencies: 228
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- TOC entry 229 (class 1259 OID 17492)
-- Name: branch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branch (
    id integer NOT NULL,
    branch_code character varying NOT NULL,
    branch_name character varying NOT NULL,
    status character varying NOT NULL
);


ALTER TABLE public.branch OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 17501)
-- Name: branch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.branch ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.branch_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 231 (class 1259 OID 17502)
-- Name: branch_package; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branch_package (
    branch_id integer NOT NULL,
    package_id integer NOT NULL
);


ALTER TABLE public.branch_package OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 17507)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    parent_id integer,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 17515)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- TOC entry 5391 (class 0 OID 0)
-- Dependencies: 233
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 234 (class 1259 OID 17516)
-- Name: content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content (
    id integer NOT NULL,
    name character varying(250),
    type character varying(10),
    display_status character varying(10),
    image character varying(250),
    start_date date,
    end_date date,
    status character varying(10)
);


ALTER TABLE public.content OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 17522)
-- Name: content_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.content ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.content_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 236 (class 1259 OID 17523)
-- Name: customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer (
    id integer NOT NULL,
    user_id integer NOT NULL,
    application_type character varying(250),
    address character varying(100),
    city character varying(50),
    postcode character varying(10),
    registration_num character varying(20),
    contact_no character varying(15),
    fax_no character varying(15),
    admin_title character varying(10),
    admin_name character varying(200),
    admin_address character varying(200),
    admin_city character varying(100),
    admin_postcode character varying(10),
    admin_email character varying(200),
    admin_contact character varying(15),
    admin_fax character varying(15),
    package integer,
    service_length integer,
    form_d_a character varying(200),
    form_d_b character varying(200),
    form_9_49 character varying(200),
    form_13_49 character varying(200),
    form_79_80_83 character varying(200),
    file_latestbill character varying(200),
    file_other character varying(200),
    signatory_name character varying(200),
    signatory_designation character varying(50),
    signatory_icnum character varying(50),
    status character varying(10),
    customer_code character varying(20),
    customer_group_id integer,
    signature character varying(255)
);


ALTER TABLE public.customer OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 17530)
-- Name: customer_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_groups (
    id integer NOT NULL,
    code character varying,
    name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customer_groups OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 17539)
-- Name: customer_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.customer_groups ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customer_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 239 (class 1259 OID 17540)
-- Name: customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.customer ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 240 (class 1259 OID 17541)
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20),
    billing_address_id integer,
    shipping_address_id integer,
    date_of_birth date,
    registration_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone,
    total_spent numeric(12,2) DEFAULT 0
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 17550)
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- TOC entry 5392 (class 0 OID 0)
-- Dependencies: 241
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- TOC entry 242 (class 1259 OID 17551)
-- Name: devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devices (
    id integer NOT NULL,
    device_code character varying(10),
    device_name character varying(100),
    device_price character varying(10),
    remarks character varying(200),
    status character varying(10)
);


ALTER TABLE public.devices OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 17555)
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.devices ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 244 (class 1259 OID 17556)
-- Name: inventory_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_logs (
    id integer NOT NULL,
    product_id integer,
    change_type character varying(20),
    quantity_change integer,
    old_quantity integer,
    new_quantity integer,
    reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_logs OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 17563)
-- Name: inventory_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5393 (class 0 OID 0)
-- Dependencies: 245
-- Name: inventory_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_logs_id_seq OWNED BY public.inventory_logs.id;


--
-- TOC entry 246 (class 1259 OID 17564)
-- Name: module; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.module (
    id integer NOT NULL,
    module character varying(255) NOT NULL,
    display_name character varying(255) DEFAULT NULL::character varying,
    icon character varying(255) DEFAULT NULL::character varying,
    display_status character varying(255) DEFAULT 'ACTIVE'::character varying,
    listing_order character varying(255) DEFAULT NULL::character varying,
    url character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.module OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 17576)
-- Name: module_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.module_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.module_id_seq OWNER TO postgres;

--
-- TOC entry 5394 (class 0 OID 0)
-- Dependencies: 247
-- Name: module_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.module_id_seq OWNED BY public.module.id;


--
-- TOC entry 248 (class 1259 OID 17577)
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subject character varying(100),
    message character varying(200),
    read boolean DEFAULT false,
    status character varying(10)
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 17583)
-- Name: notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.notification ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 250 (class 1259 OID 17584)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 17592)
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- TOC entry 5395 (class 0 OID 0)
-- Dependencies: 251
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- TOC entry 252 (class 1259 OID 17593)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customer_id integer,
    shipping_address_id integer,
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'pending'::character varying,
    total_amount numeric(12,2),
    shipping_cost numeric(8,2),
    tax_amount numeric(10,2),
    discount_amount numeric(10,2) DEFAULT 0,
    payment_method character varying(50),
    shipped_date timestamp without time zone,
    delivered_date timestamp without time zone
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 17600)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- TOC entry 5396 (class 0 OID 0)
-- Dependencies: 253
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 254 (class 1259 OID 17601)
-- Name: package; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package (
    id integer NOT NULL,
    package_code character varying(255),
    package_name character varying(255),
    remarks character varying(255),
    monthly_fee numeric(12,2),
    type_internet character varying(100),
    add_remarks character varying(200)
);


ALTER TABLE public.package OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 17607)
-- Name: package_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.package ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.package_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 256 (class 1259 OID 17608)
-- Name: password_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    user_id integer,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    used_at timestamp without time zone
);


ALTER TABLE public.password_resets OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 17617)
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_resets_id_seq OWNER TO postgres;

--
-- TOC entry 5397 (class 0 OID 0)
-- Dependencies: 257
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- TOC entry 258 (class 1259 OID 17618)
-- Name: payment_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payment_id uuid NOT NULL,
    invoice_dockey bigint NOT NULL,
    invoice_docno character varying(50) NOT NULL,
    applied_amount numeric(14,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    invoice_date date,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    CONSTRAINT payment_items_applied_amount_check CHECK ((applied_amount > (0)::numeric))
);


ALTER TABLE public.payment_items OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 17632)
-- Name: payment_pending; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_pending (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_code character varying(50) NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(50),
    gateway_provider character varying(50),
    gateway_ref text,
    status character varying(20) DEFAULT 'PENDING APPROVAL'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    reference_no character varying(100) NOT NULL,
    payment_date date NOT NULL,
    mechant_id character varying,
    currency character varying(10) DEFAULT 'MYR'::character varying,
    gateway_txn_id character varying(100),
    payment_source character varying(20),
    deleted_at timestamp without time zone
);


ALTER TABLE public.payment_pending OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 17650)
-- Name: position; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."position" (
    id integer NOT NULL,
    code character(10) NOT NULL,
    name character(100) NOT NULL,
    status character(10) NOT NULL
);


ALTER TABLE public."position" OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 17657)
-- Name: position_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."position" ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.position_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 262 (class 1259 OID 17658)
-- Name: product_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_reviews (
    id integer NOT NULL,
    product_id integer,
    customer_id integer,
    rating integer,
    review_text text,
    review_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    helpful_votes integer DEFAULT 0,
    CONSTRAINT product_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.product_reviews OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 17667)
-- Name: product_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_reviews_id_seq OWNER TO postgres;

--
-- TOC entry 5398 (class 0 OID 0)
-- Dependencies: 263
-- Name: product_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_reviews_id_seq OWNED BY public.product_reviews.id;


--
-- TOC entry 264 (class 1259 OID 17668)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    sku character varying(50) NOT NULL,
    category_id integer,
    supplier_id integer,
    price numeric(10,2) NOT NULL,
    cost numeric(10,2),
    stock_quantity integer DEFAULT 0,
    weight numeric(8,3),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 17678)
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- TOC entry 5399 (class 0 OID 0)
-- Dependencies: 265
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- TOC entry 266 (class 1259 OID 17679)
-- Name: role_module_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_module_access (
    id integer NOT NULL,
    role_id integer NOT NULL,
    module_id integer NOT NULL,
    display_status public.display_status_type DEFAULT 'ACTIVE'::public.display_status_type NOT NULL,
    view_access boolean DEFAULT false NOT NULL,
    create_access boolean DEFAULT false NOT NULL,
    update_access boolean DEFAULT false NOT NULL,
    delete_access boolean DEFAULT false NOT NULL
);


ALTER TABLE public.role_module_access OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 17695)
-- Name: role_module_access_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_module_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_module_access_id_seq OWNER TO postgres;

--
-- TOC entry 5400 (class 0 OID 0)
-- Dependencies: 267
-- Name: role_module_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_module_access_id_seq OWNED BY public.role_module_access.id;


--
-- TOC entry 268 (class 1259 OID 17696)
-- Name: running_no; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.running_no (
    id integer NOT NULL,
    doc_name character varying(255) DEFAULT ''::character varying,
    prefix character varying(255) DEFAULT ''::character varying,
    next_no integer DEFAULT 0,
    digit_no integer DEFAULT 0
);


ALTER TABLE public.running_no OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 17706)
-- Name: running_no_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.running_no_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.running_no_id_seq OWNER TO postgres;

--
-- TOC entry 5401 (class 0 OID 0)
-- Dependencies: 269
-- Name: running_no_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.running_no_id_seq OWNED BY public.running_no.id;


--
-- TOC entry 270 (class 1259 OID 17707)
-- Name: staff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff (
    id integer NOT NULL,
    user_id integer NOT NULL,
    "position" integer,
    phone character varying(12),
    status character varying(10)
);


ALTER TABLE public.staff OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 17712)
-- Name: staff_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.staff ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.staff_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 272 (class 1259 OID 17713)
-- Name: submodule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submodule (
    id integer NOT NULL,
    submodule character varying(255) DEFAULT ''::character varying NOT NULL,
    module_id integer NOT NULL,
    display_name character varying(255) DEFAULT NULL::character varying,
    display_status character varying(255) DEFAULT 'ACTIVE'::character varying,
    url character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.submodule OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 17725)
-- Name: submodule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.submodule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.submodule_id_seq OWNER TO postgres;

--
-- TOC entry 5402 (class 0 OID 0)
-- Dependencies: 273
-- Name: submodule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.submodule_id_seq OWNED BY public.submodule.id;


--
-- TOC entry 274 (class 1259 OID 17726)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(20),
    country character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- TOC entry 275 (class 1259 OID 17732)
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO postgres;

--
-- TOC entry 5403 (class 0 OID 0)
-- Dependencies: 275
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- TOC entry 276 (class 1259 OID 17733)
-- Name: user_module_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_module_access (
    id integer NOT NULL,
    group_id integer,
    user_id integer,
    module_id integer,
    display_status character varying(255) DEFAULT NULL::character varying,
    access integer DEFAULT 0
);


ALTER TABLE public.user_module_access OWNER TO postgres;

--
-- TOC entry 277 (class 1259 OID 17739)
-- Name: user_module_access_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_module_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_module_access_id_seq OWNER TO postgres;

--
-- TOC entry 5404 (class 0 OID 0)
-- Dependencies: 277
-- Name: user_module_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_module_access_id_seq OWNED BY public.user_module_access.id;


--
-- TOC entry 278 (class 1259 OID 17740)
-- Name: user_role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_role (
    id integer NOT NULL,
    role_name character varying(255) DEFAULT NULL::character varying,
    status character varying(255) DEFAULT 'Active'::character varying
);


ALTER TABLE public.user_role OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 17748)
-- Name: user_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_role_id_seq OWNER TO postgres;

--
-- TOC entry 5405 (class 0 OID 0)
-- Dependencies: 279
-- Name: user_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_role_id_seq OWNED BY public.user_role.id;


--
-- TOC entry 280 (class 1259 OID 17749)
-- Name: user_submodule_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_submodule_access (
    id integer NOT NULL,
    user_id integer,
    module_id integer,
    submodule_id integer,
    display_status character varying(255) DEFAULT NULL::character varying,
    add_access integer,
    edit_access integer,
    view_access integer,
    delete_access integer
);


ALTER TABLE public.user_submodule_access OWNER TO postgres;

--
-- TOC entry 281 (class 1259 OID 17754)
-- Name: user_submodule_access_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_submodule_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_submodule_access_id_seq OWNER TO postgres;

--
-- TOC entry 5406 (class 0 OID 0)
-- Dependencies: 281
-- Name: user_submodule_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_submodule_access_id_seq OWNED BY public.user_submodule_access.id;


--
-- TOC entry 282 (class 1259 OID 17755)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(255) DEFAULT NULL::character varying,
    email character varying(255) DEFAULT NULL::character varying,
    role_id integer,
    acc_status character varying(255) DEFAULT 'Active'::character varying,
    status_id integer,
    last_login timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 283 (class 1259 OID 17767)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5407 (class 0 OID 0)
-- Dependencies: 283
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 5059 (class 2604 OID 17768)
-- Name: addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);


--
-- TOC entry 5061 (class 2604 OID 17769)
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- TOC entry 5063 (class 2604 OID 17770)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 5066 (class 2604 OID 17771)
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- TOC entry 5069 (class 2604 OID 17772)
-- Name: inventory_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs ALTER COLUMN id SET DEFAULT nextval('public.inventory_logs_id_seq'::regclass);


--
-- TOC entry 5071 (class 2604 OID 17773)
-- Name: module id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module ALTER COLUMN id SET DEFAULT nextval('public.module_id_seq'::regclass);


--
-- TOC entry 5078 (class 2604 OID 17774)
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- TOC entry 5080 (class 2604 OID 17775)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 5084 (class 2604 OID 17776)
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- TOC entry 5094 (class 2604 OID 17777)
-- Name: product_reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_reviews ALTER COLUMN id SET DEFAULT nextval('public.product_reviews_id_seq'::regclass);


--
-- TOC entry 5097 (class 2604 OID 17778)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- TOC entry 5101 (class 2604 OID 17779)
-- Name: role_module_access id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_module_access ALTER COLUMN id SET DEFAULT nextval('public.role_module_access_id_seq'::regclass);


--
-- TOC entry 5107 (class 2604 OID 17780)
-- Name: running_no id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.running_no ALTER COLUMN id SET DEFAULT nextval('public.running_no_id_seq'::regclass);


--
-- TOC entry 5112 (class 2604 OID 17781)
-- Name: submodule id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submodule ALTER COLUMN id SET DEFAULT nextval('public.submodule_id_seq'::regclass);


--
-- TOC entry 5117 (class 2604 OID 17782)
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- TOC entry 5119 (class 2604 OID 17783)
-- Name: user_module_access id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_module_access ALTER COLUMN id SET DEFAULT nextval('public.user_module_access_id_seq'::regclass);


--
-- TOC entry 5122 (class 2604 OID 17784)
-- Name: user_role id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role ALTER COLUMN id SET DEFAULT nextval('public.user_role_id_seq'::regclass);


--
-- TOC entry 5125 (class 2604 OID 17785)
-- Name: user_submodule_access id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_submodule_access ALTER COLUMN id SET DEFAULT nextval('public.user_submodule_access_id_seq'::regclass);


--
-- TOC entry 5127 (class 2604 OID 17786)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5135 (class 2606 OID 17809)
-- Name: activation activation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activation
    ADD CONSTRAINT activation_pkey PRIMARY KEY (id);


--
-- TOC entry 5137 (class 2606 OID 17811)
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 5139 (class 2606 OID 17813)
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5148 (class 2606 OID 17815)
-- Name: branch_package branch_package_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_package
    ADD CONSTRAINT branch_package_pkey PRIMARY KEY (branch_id, package_id);


--
-- TOC entry 5146 (class 2606 OID 17817)
-- Name: branch branch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_pkey PRIMARY KEY (id);


--
-- TOC entry 5150 (class 2606 OID 17819)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5152 (class 2606 OID 17821)
-- Name: content content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT content_pkey PRIMARY KEY (id);


--
-- TOC entry 5156 (class 2606 OID 17823)
-- Name: customer_groups customer_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_groups
    ADD CONSTRAINT customer_groups_pkey PRIMARY KEY (id);


--
-- TOC entry 5154 (class 2606 OID 17825)
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- TOC entry 5158 (class 2606 OID 17827)
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);


--
-- TOC entry 5160 (class 2606 OID 17829)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 5162 (class 2606 OID 17831)
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- TOC entry 5164 (class 2606 OID 17833)
-- Name: inventory_logs inventory_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5166 (class 2606 OID 17835)
-- Name: module module_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module
    ADD CONSTRAINT module_pkey PRIMARY KEY (id);


--
-- TOC entry 5168 (class 2606 OID 17837)
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- TOC entry 5170 (class 2606 OID 17839)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5172 (class 2606 OID 17841)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5174 (class 2606 OID 17843)
-- Name: package package_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package
    ADD CONSTRAINT package_pkey PRIMARY KEY (id);


--
-- TOC entry 5176 (class 2606 OID 17845)
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- TOC entry 5180 (class 2606 OID 17847)
-- Name: payment_items payment_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_items
    ADD CONSTRAINT payment_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5184 (class 2606 OID 17849)
-- Name: payment_pending payment_pending_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_pending
    ADD CONSTRAINT payment_pending_pkey PRIMARY KEY (id);


--
-- TOC entry 5186 (class 2606 OID 17851)
-- Name: payment_pending payment_pending_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_pending
    ADD CONSTRAINT payment_pending_unique UNIQUE (reference_no);


--
-- TOC entry 5188 (class 2606 OID 17853)
-- Name: position position_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."position"
    ADD CONSTRAINT position_pkey PRIMARY KEY (id);


--
-- TOC entry 5190 (class 2606 OID 17855)
-- Name: product_reviews product_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 5192 (class 2606 OID 17857)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 5194 (class 2606 OID 17859)
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- TOC entry 5196 (class 2606 OID 17861)
-- Name: role_module_access role_module_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_module_access
    ADD CONSTRAINT role_module_access_pkey PRIMARY KEY (id);


--
-- TOC entry 5200 (class 2606 OID 17863)
-- Name: running_no running_no_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.running_no
    ADD CONSTRAINT running_no_pkey PRIMARY KEY (id);


--
-- TOC entry 5202 (class 2606 OID 17865)
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- TOC entry 5204 (class 2606 OID 17867)
-- Name: submodule submodule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submodule
    ADD CONSTRAINT submodule_pkey PRIMARY KEY (id);


--
-- TOC entry 5206 (class 2606 OID 17869)
-- Name: suppliers suppliers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_email_key UNIQUE (email);


--
-- TOC entry 5208 (class 2606 OID 17871)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 5198 (class 2606 OID 17873)
-- Name: role_module_access unique_role_module; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_module_access
    ADD CONSTRAINT unique_role_module UNIQUE (role_id, module_id);


--
-- TOC entry 5210 (class 2606 OID 17875)
-- Name: user_module_access user_module_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_module_access
    ADD CONSTRAINT user_module_access_pkey PRIMARY KEY (id);


--
-- TOC entry 5212 (class 2606 OID 17877)
-- Name: user_role user_role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_pkey PRIMARY KEY (id);


--
-- TOC entry 5214 (class 2606 OID 17879)
-- Name: user_submodule_access user_submodule_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_submodule_access
    ADD CONSTRAINT user_submodule_access_pkey PRIMARY KEY (id);


--
-- TOC entry 5216 (class 2606 OID 17881)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5218 (class 2606 OID 17883)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5140 (class 1259 OID 17884)
-- Name: idx_audit_log_action_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_action_time ON public.audit_log USING btree (action, event_time DESC);


--
-- TOC entry 5141 (class 1259 OID 17885)
-- Name: idx_audit_log_actor_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_actor_time ON public.audit_log USING btree (actor_user_id, event_time DESC);


--
-- TOC entry 5142 (class 1259 OID 17886)
-- Name: idx_audit_log_entity_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_entity_time ON public.audit_log USING btree (entity_table, entity_id, event_time DESC);


--
-- TOC entry 5143 (class 1259 OID 17887)
-- Name: idx_audit_log_event_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_event_time ON public.audit_log USING btree (event_time DESC);


--
-- TOC entry 5144 (class 1259 OID 17888)
-- Name: idx_audit_log_request_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_request_id ON public.audit_log USING btree (request_id);


--
-- TOC entry 5177 (class 1259 OID 17889)
-- Name: idx_payment_items_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_items_invoice ON public.payment_items USING btree (invoice_dockey);


--
-- TOC entry 5178 (class 1259 OID 17890)
-- Name: idx_payment_items_payment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_items_payment ON public.payment_items USING btree (payment_id);


--
-- TOC entry 5181 (class 1259 OID 17891)
-- Name: idx_payment_pending_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_pending_customer ON public.payment_pending USING btree (customer_code);


--
-- TOC entry 5182 (class 1259 OID 17892)
-- Name: idx_payment_pending_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_pending_status ON public.payment_pending USING btree (status);


--
-- TOC entry 5221 (class 2606 OID 17893)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id);


--
-- TOC entry 5222 (class 2606 OID 17898)
-- Name: customers customers_billing_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_billing_address_id_fkey FOREIGN KEY (billing_address_id) REFERENCES public.addresses(id);


--
-- TOC entry 5223 (class 2606 OID 17903)
-- Name: customers customers_shipping_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_shipping_address_id_fkey FOREIGN KEY (shipping_address_id) REFERENCES public.addresses(id);


--
-- TOC entry 5219 (class 2606 OID 17908)
-- Name: branch_package fk_branch; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_package
    ADD CONSTRAINT fk_branch FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE CASCADE;


--
-- TOC entry 5234 (class 2606 OID 17913)
-- Name: role_module_access fk_module; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_module_access
    ADD CONSTRAINT fk_module FOREIGN KEY (module_id) REFERENCES public.module(id) ON DELETE CASCADE;


--
-- TOC entry 5220 (class 2606 OID 17918)
-- Name: branch_package fk_package; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_package
    ADD CONSTRAINT fk_package FOREIGN KEY (package_id) REFERENCES public.package(id) ON DELETE CASCADE;


--
-- TOC entry 5235 (class 2606 OID 17923)
-- Name: role_module_access fk_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_module_access
    ADD CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES public.user_role(id) ON DELETE CASCADE;


--
-- TOC entry 5224 (class 2606 OID 17928)
-- Name: inventory_logs inventory_logs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5225 (class 2606 OID 17933)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5226 (class 2606 OID 17938)
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5227 (class 2606 OID 17943)
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- TOC entry 5228 (class 2606 OID 17948)
-- Name: orders orders_shipping_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_shipping_address_id_fkey FOREIGN KEY (shipping_address_id) REFERENCES public.addresses(id);


--
-- TOC entry 5229 (class 2606 OID 17953)
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5230 (class 2606 OID 17958)
-- Name: product_reviews product_reviews_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- TOC entry 5231 (class 2606 OID 17963)
-- Name: product_reviews product_reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5232 (class 2606 OID 17968)
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 5233 (class 2606 OID 17973)
-- Name: products products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 5388 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2026-03-10 11:40:54

--
-- PostgreSQL database dump complete
--

\unrestrict MT7mIOv7elNwlFdcvZvXz0D9fyEr9gzq4Jh0pSaFmc4IJnlwMkRyc62nTSItFhZ

