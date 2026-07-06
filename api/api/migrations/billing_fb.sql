--
-- PostgreSQL database dump
--

\restrict vNaLmbM7DOYNfInBY2ulufxoQ0gf491Uo61Ny0fZfK4isOUA2dLiCrwWpCNaLgr

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-03-10 11:45:36

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
-- TOC entry 8 (class 2615 OID 18117)
-- Name: billing_fb; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA billing_fb;


ALTER SCHEMA billing_fb OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 303 (class 1259 OID 18119)
-- Name: ar_cn; Type: TABLE; Schema: billing_fb; Owner: postgres
--

CREATE TABLE billing_fb.ar_cn (
    dockey integer NOT NULL,
    docno character varying(40) NOT NULL,
    docnoex character varying(40),
    doctype smallint,
    code character varying(10),
    docdate date,
    postdate date,
    taxdate date,
    journal character varying(10),
    description character varying(300),
    area character varying(10),
    agent character varying(10),
    project character varying(20),
    currencycode character varying(6),
    currencyrate numeric(18,8),
    docamt numeric(18,2),
    localdocamt numeric(18,2),
    unappliedamt numeric(18,2),
    fromdoctype character varying(2),
    taxexemptno character varying(50),
    gltransid bigint,
    cancelled boolean,
    updatecount integer,
    attachments bytea,
    note bytea,
    lastmodified bigint
);


ALTER TABLE billing_fb.ar_cn OWNER TO postgres;

--
-- TOC entry 304 (class 1259 OID 18126)
-- Name: ar_customer; Type: TABLE; Schema: billing_fb; Owner: postgres
--

CREATE TABLE billing_fb.ar_customer (
    code character varying(10) NOT NULL,
    controlaccount character varying(10),
    companyname character varying(100),
    companyname2 character varying(100),
    companycategory character varying(15),
    area character varying(10),
    agent character varying(10),
    biznature character varying(100),
    creditterm character varying(10),
    creditlimit numeric(18,2),
    overduelimit numeric(18,2),
    statementtype character(1),
    currencycode character varying(6),
    outstanding numeric(18,2),
    allowexceedcreditlimit boolean,
    addpdctocrlimit boolean,
    agingon character(1),
    status character(1),
    pricetag character varying(10),
    creationdate date,
    tax character varying(10),
    taxexemptno character varying(50),
    taxexpdate date,
    brn character varying(30),
    brn2 character varying(30),
    gstno character varying(25),
    salestaxno character varying(25),
    servicetaxno character varying(25),
    tin character varying(14),
    idtype smallint,
    idno character varying(20),
    tourismno character varying(17),
    sic character varying(10),
    submissiontype integer,
    irbm_classification character varying(3),
    inforequest_uuid character varying(36),
    peppolid character varying(40),
    businessunit character varying(10),
    taxarea character varying(10),
    attachments bytea,
    remark character varying(80),
    note bytea,
    lastmodified bigint
);


ALTER TABLE billing_fb.ar_customer OWNER TO postgres;

--
-- TOC entry 305 (class 1259 OID 18132)
-- Name: ar_customerbranch; Type: TABLE; Schema: billing_fb; Owner: postgres
--

CREATE TABLE billing_fb.ar_customerbranch (
    dtlkey integer NOT NULL,
    code character varying(10) NOT NULL,
    branchtype character(1),
    branchname character varying(100),
    address1 character varying(60),
    address2 character varying(60),
    address3 character varying(60),
    address4 character varying(60),
    postcode character varying(10),
    city character varying(50),
    state character varying(50),
    country character varying(2),
    geolat numeric(10,6),
    geolong numeric(10,6),
    attention character varying(70),
    phone1 character varying(200),
    phone2 character varying(200),
    mobile character varying(200),
    fax1 character varying(200),
    fax2 character varying(200),
    email character varying(200)
);


ALTER TABLE billing_fb.ar_customerbranch OWNER TO postgres;

--
-- TOC entry 306 (class 1259 OID 18139)
-- Name: ar_dn; Type: TABLE; Schema: billing_fb; Owner: postgres
--

CREATE TABLE billing_fb.ar_dn (
    dockey integer NOT NULL,
    docno character varying(40) NOT NULL,
    docnoex character varying(40),
    doctype smallint,
    code character varying(10),
    journal character varying(10),
    docdate date,
    postdate date,
    taxdate date,
    terms character varying(10),
    duedate date,
    description character varying(300),
    area character varying(10),
    agent character varying(10),
    project character varying(20),
    currencycode character varying(6),
    currencyrate numeric(18,8),
    docamt numeric(18,2),
    localdocamt numeric(18,2),
    paymentamt numeric(18,2),
    fromdoctype character varying(2),
    taxexemptno character varying(50),
    gltransid bigint,
    cancelled boolean,
    updatecount integer,
    attachments bytea,
    note bytea,
    lastmodified bigint
);


ALTER TABLE billing_fb.ar_dn OWNER TO postgres;

--
-- TOC entry 307 (class 1259 OID 18146)
-- Name: ar_iv; Type: TABLE; Schema: billing_fb; Owner: postgres
--

CREATE TABLE billing_fb.ar_iv (
    dockey integer NOT NULL,
    docno character varying(40) NOT NULL,
    docnoex character varying(40),
    code character varying(10),
    journal character varying(10),
    docdate date,
    postdate date,
    taxdate date,
    terms character varying(10),
    duedate date,
    description character varying(300),
    area character varying(10),
    agent character varying(10),
    project character varying(20),
    currencycode character varying(6),
    currencyrate numeric(18,8),
    docamt numeric(18,2),
    localdocamt numeric(18,2),
    paymentamt numeric(18,2),
    fromdoctype character varying(2),
    taxexemptno character varying(50),
    gltransid bigint,
    cancelled boolean,
    updatecount integer,
    attachments bytea,
    note bytea,
    lastmodified bigint
);


ALTER TABLE billing_fb.ar_iv OWNER TO postgres;

--
-- TOC entry 308 (class 1259 OID 18153)
-- Name: ar_ivdtl; Type: TABLE; Schema: billing_fb; Owner: postgres
--

CREATE TABLE billing_fb.ar_ivdtl (
    dtlkey integer NOT NULL,
    dockey integer NOT NULL,
    seq integer,
    project character varying(20),
    account character varying(10),
    description character varying(300),
    tax character varying(10),
    tariff character varying(20),
    taxrate character varying(20),
    taxamt numeric(18,2),
    localtaxamt numeric(18,2),
    taxinclusive boolean,
    amount numeric(18,2),
    localamount numeric(18,2),
    taxableamt numeric(18,2),
    fromdtlkey integer
);


ALTER TABLE billing_fb.ar_ivdtl OWNER TO postgres;

--
-- TOC entry 309 (class 1259 OID 18158)
-- Name: ar_knockoff; Type: TABLE; Schema: billing_fb; Owner: postgres
--

CREATE TABLE billing_fb.ar_knockoff (
    dockey integer NOT NULL,
    fromdoctype character varying(2) NOT NULL,
    fromdockey integer NOT NULL,
    todoctype character varying(2) NOT NULL,
    todockey integer NOT NULL,
    koamt numeric(18,2),
    actuallocalkoamt numeric(18,2),
    localkoamt numeric(18,2),
    kotaxdate date,
    gainloss numeric(18,2),
    gainlosspostdate date
);


ALTER TABLE billing_fb.ar_knockoff OWNER TO postgres;

--
-- TOC entry 310 (class 1259 OID 18166)
-- Name: ar_pm; Type: TABLE; Schema: billing_fb; Owner: postgres
--

CREATE TABLE billing_fb.ar_pm (
    dockey integer NOT NULL,
    docno character varying(40) NOT NULL,
    code character varying(10),
    docdate date,
    postdate date,
    taxdate date,
    description character varying(300),
    area character varying(10),
    agent character varying(10),
    paymentmethod character varying(10),
    chequenumber character varying(25),
    journal character varying(10),
    project character varying(20),
    paymentproject character varying(20),
    currencycode character varying(6),
    currencyrate numeric(18,8),
    bankacc bigint,
    bankcharge numeric(18,2),
    bankchargeaccount character varying(10),
    docamt numeric(18,2),
    localdocamt numeric(18,2),
    unappliedamt numeric(18,2),
    docref1 character varying(50),
    docref2 character varying(50),
    fromdoctype character varying(2),
    fromdockey integer,
    gltransid bigint,
    cancelled boolean,
    nonrefundable boolean,
    bounceddate date,
    updatecount integer,
    lastmodified bigint,
    banktransfertype integer,
    bankrefno character varying(50),
    bankstatus integer,
    bankstatusdesc character varying(200)
);


ALTER TABLE billing_fb.ar_pm OWNER TO postgres;

--
-- TOC entry 311 (class 1259 OID 18173)
-- Name: gl_acc; Type: TABLE; Schema: billing_fb; Owner: postgres
--

CREATE TABLE billing_fb.gl_acc (
    dockey integer NOT NULL,
    parent integer NOT NULL,
    code character varying(10) NOT NULL,
    description character varying(200),
    description2 character varying(200),
    acctype character(2),
    specialacctype character(2),
    tax character varying(10),
    cashflowtype integer,
    sic character varying(10)
);


ALTER TABLE billing_fb.gl_acc OWNER TO postgres;

--
-- TOC entry 312 (class 1259 OID 18179)
-- Name: gl_trans; Type: TABLE; Schema: billing_fb; Owner: postgres
--

CREATE TABLE billing_fb.gl_trans (
    dockey integer NOT NULL,
    gltransid bigint,
    code character varying(10) NOT NULL,
    docdate date,
    postdate date,
    taxdate date,
    area character varying(10),
    agent character varying(10),
    project character varying(20),
    tax character varying(10),
    journal character varying(10),
    currencycode character varying(6),
    currencyrate numeric(18,8),
    description character varying(300),
    description2 character varying(300),
    dr numeric(18,2),
    cr numeric(18,2),
    localdr numeric(18,2),
    localcr numeric(18,2),
    ref1 character varying(40),
    ref2 character varying(40),
    fromdoctype character varying(2),
    fromkey integer,
    tabletype character(1),
    recondate date,
    cancelled boolean,
    autopost boolean NOT NULL,
    nonce character varying(4),
    digest character varying(16)
);


ALTER TABLE billing_fb.gl_trans OWNER TO postgres;

--
-- TOC entry 313 (class 1259 OID 18187)
-- Name: sy_profile; Type: TABLE; Schema: billing_fb; Owner: postgres
--

CREATE TABLE billing_fb.sy_profile (
    autokey bigint NOT NULL,
    companyname character varying(100),
    remark character varying(100),
    remarkcolor integer,
    brn character varying(30),
    brn2 character varying(30),
    gstno character varying(25),
    permitno character varying(30),
    salestaxno character varying(25),
    servicetaxno character varying(25),
    sststartdate date,
    sst2024_special boolean,
    tin character varying(14),
    idtype smallint,
    idno character varying(20),
    tourismno character varying(17),
    sic character varying(10),
    raddress1 character varying(60),
    raddress2 character varying(60),
    raddress3 character varying(60),
    raddress4 character varying(60),
    address1 character varying(60),
    address2 character varying(60),
    address3 character varying(60),
    address4 character varying(60),
    postcode character varying(10),
    city character varying(50),
    state character varying(50),
    geolat numeric(10,6),
    geolong numeric(10,6),
    deliveraddr1 character varying(60),
    deliveraddr2 character varying(60),
    deliveraddr3 character varying(60),
    deliveraddr4 character varying(60),
    deliverphone1 character varying(200),
    deliverfax1 character varying(200),
    attention character varying(70),
    phone1 character varying(200),
    phone2 character varying(200),
    fax1 character varying(200),
    fax2 character varying(200),
    biznature character varying(100),
    email character varying(200),
    url character varying(200),
    country character varying(2),
    currencylang character varying(2),
    googlemapsapikey character varying(64),
    myinvois_startdate date,
    myinvois_productioncred character varying(800),
    myinvois_sandboxcred character varying(800),
    myinvois_futurecred character varying(800),
    alias character varying(100),
    taxablepersonname1 character varying(100),
    taxablepersonname2 character varying(100),
    taxagencyname character varying(100),
    taxagencyno character varying(20),
    taxagentname character varying(100),
    taxagentapprovalno character varying(20),
    peppolid character varying(40),
    peppolapikey character varying(120),
    vendorid character varying(40),
    smtp_uri character varying(500),
    url_attachment character varying(200),
    url_stocktake character varying(200),
    webapp_host character varying(100),
    webapp_httpport integer,
    webapp_httpsport integer,
    webapp_dnskey character varying(10),
    logoclass character varying(10),
    rowver integer
);


ALTER TABLE billing_fb.sy_profile OWNER TO postgres;

--
-- TOC entry 5036 (class 1259 OID 18193)
-- Name: idx_gl_trans_code; Type: INDEX; Schema: billing_fb; Owner: postgres
--

CREATE INDEX idx_gl_trans_code ON billing_fb.gl_trans USING btree (code);


--
-- TOC entry 5037 (class 1259 OID 18194)
-- Name: idx_gl_trans_docdate; Type: INDEX; Schema: billing_fb; Owner: postgres
--

CREATE INDEX idx_gl_trans_docdate ON billing_fb.gl_trans USING btree (docdate);


--
-- TOC entry 5038 (class 1259 OID 18195)
-- Name: idx_gl_trans_dockey; Type: INDEX; Schema: billing_fb; Owner: postgres
--

CREATE INDEX idx_gl_trans_dockey ON billing_fb.gl_trans USING btree (dockey);


-- Completed on 2026-03-10 11:45:36

--
-- PostgreSQL database dump complete
--

\unrestrict vNaLmbM7DOYNfInBY2ulufxoQ0gf491Uo61Ny0fZfK4isOUA2dLiCrwWpCNaLgr

