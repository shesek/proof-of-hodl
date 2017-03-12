create table question(id serial primary key, slug varchar not null unique, text varchar not null);

create table question_option(id serial primary key, question_id integer references question(id) not null, text varchar not null);

create table vote(id serial primary key, question_id integer references question(id) not null, option_id integer references question_option(id) not null,
                  timestamp timestamp default now() not null, value numeric(16) not null, rlocktime integer not null, pubkey varchar not null, address varchar not null,
                  refundtx bytea not null, locktx bytea not null, txid varchar not null);

create index idx_vote_weight on vote((value*rlocktime));
create index idx_vote_bdl on vote(((rlocktime/144)*(value/100000000)));

create or replace view v_vote as select *, rlocktime*value as weight, (rlocktime/144)*(value/100000000) as weight_bdl from vote order by timestamp desc;

create or replace view v_vote_totals as select question_id, option_id, sum(weight) as total_weight, sum(weight_bdl) as total_bdl from v_vote group by question_id, option_id;

create or replace view v_question_option as
  select o.*, t.total_weight as total_weight, t.total_bdl as total_bdl
  from question_option o
  left join v_vote_totals t on t.option_id=o.id;

create or replace view v_question as
  select q.*,
    json_agg(json_build_object('option_id', o.id, 'text', o.text, 'total_weight', o.total_weight::varchar, 'total_bdl', o.total_bdl::varchar)) as options,
    sum(o.total_weight) as total_weight, sum(o.total_bdl) as total_bdl
  from question q
  left join v_question_option o on o.question_id = q.id
  group by q.id;

