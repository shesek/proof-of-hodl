--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.5
-- Dumped by pg_dump version 9.5.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: question; Type: TABLE; Schema: public; Owner: hodl
--

CREATE TABLE question (
    id integer NOT NULL,
    text character varying NOT NULL
);


ALTER TABLE question OWNER TO hodl;

--
-- Name: question_id_seq; Type: SEQUENCE; Schema: public; Owner: hodl
--

CREATE SEQUENCE question_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE question_id_seq OWNER TO hodl;

--
-- Name: question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hodl
--

ALTER SEQUENCE question_id_seq OWNED BY question.id;


--
-- Name: question_option; Type: TABLE; Schema: public; Owner: hodl
--

CREATE TABLE question_option (
    id integer NOT NULL,
    question_id integer NOT NULL,
    text character varying NOT NULL
);


ALTER TABLE question_option OWNER TO hodl;

--
-- Name: question_option_id_seq; Type: SEQUENCE; Schema: public; Owner: hodl
--

CREATE SEQUENCE question_option_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE question_option_id_seq OWNER TO hodl;

--
-- Name: question_option_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hodl
--

ALTER SEQUENCE question_option_id_seq OWNED BY question_option.id;


--
-- Name: v_question; Type: TABLE; Schema: public; Owner: hodl
--

CREATE TABLE v_question (
    id integer,
    text character varying,
    total_weight numeric
);

ALTER TABLE ONLY v_question REPLICA IDENTITY NOTHING;


ALTER TABLE v_question OWNER TO hodl;

--
-- Name: vote; Type: TABLE; Schema: public; Owner: hodl
--

CREATE TABLE vote (
    id integer NOT NULL,
    question_id integer NOT NULL,
    option_id integer,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    value bigint NOT NULL,
    rlocktime integer NOT NULL,
    address character varying NOT NULL,
    refundtx bytea NOT NULL,
    locktx bytea NOT NULL,
    txid character varying NOT NULL
);


ALTER TABLE vote OWNER TO hodl;

--
-- Name: v_vote; Type: VIEW; Schema: public; Owner: hodl
--

CREATE VIEW v_vote AS
 SELECT vote.id,
    vote.question_id,
    vote.option_id,
    vote."timestamp",
    vote.value,
    vote.rlocktime,
    vote.address,
    vote.refundtx,
    vote.locktx,
    vote.txid,
    (vote.rlocktime * vote.value) AS weight,
    ((vote.rlocktime * vote.value) / 144) AS weight_bdl
   FROM vote
  ORDER BY vote."timestamp" DESC;


ALTER TABLE v_vote OWNER TO hodl;

--
-- Name: vote_id_seq; Type: SEQUENCE; Schema: public; Owner: hodl
--

CREATE SEQUENCE vote_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE vote_id_seq OWNER TO hodl;

--
-- Name: vote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hodl
--

ALTER SEQUENCE vote_id_seq OWNED BY vote.id;


--
-- Name: vote_totals; Type: VIEW; Schema: public; Owner: hodl
--

CREATE VIEW vote_totals AS
 SELECT v_vote.question_id,
    v_vote.option_id,
    sum(v_vote.weight) AS total,
    sum(v_vote.weight_bdl) AS total_bdl
   FROM v_vote
  GROUP BY v_vote.question_id, v_vote.option_id;


ALTER TABLE vote_totals OWNER TO hodl;

--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hodl
--

ALTER TABLE ONLY question ALTER COLUMN id SET DEFAULT nextval('question_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hodl
--

ALTER TABLE ONLY question_option ALTER COLUMN id SET DEFAULT nextval('question_option_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hodl
--

ALTER TABLE ONLY vote ALTER COLUMN id SET DEFAULT nextval('vote_id_seq'::regclass);


--
-- Name: question_option_pkey; Type: CONSTRAINT; Schema: public; Owner: hodl
--

ALTER TABLE ONLY question_option
    ADD CONSTRAINT question_option_pkey PRIMARY KEY (id);


--
-- Name: question_pkey; Type: CONSTRAINT; Schema: public; Owner: hodl
--

ALTER TABLE ONLY question
    ADD CONSTRAINT question_pkey PRIMARY KEY (id);


--
-- Name: vote_pkey; Type: CONSTRAINT; Schema: public; Owner: hodl
--

ALTER TABLE ONLY vote
    ADD CONSTRAINT vote_pkey PRIMARY KEY (id);


--
-- Name: vote_expr_idx; Type: INDEX; Schema: public; Owner: hodl
--

CREATE INDEX vote_expr_idx ON vote USING btree (((value * rlocktime)));


--
-- Name: _RETURN; Type: RULE; Schema: public; Owner: hodl
--

CREATE RULE "_RETURN" AS
    ON SELECT TO v_question DO INSTEAD  SELECT q.id,
    q.text,
    sum(v.weight) AS total_weight
   FROM (question q
     LEFT JOIN v_vote v ON ((v.question_id = q.id)))
  GROUP BY q.id;


--
-- Name: question_option_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hodl
--

ALTER TABLE ONLY question_option
    ADD CONSTRAINT question_option_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id);


--
-- Name: vote_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hodl
--

ALTER TABLE ONLY vote
    ADD CONSTRAINT vote_option_id_fkey FOREIGN KEY (option_id) REFERENCES question_option(id);


--
-- Name: vote_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hodl
--

ALTER TABLE ONLY vote
    ADD CONSTRAINT vote_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id);


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

