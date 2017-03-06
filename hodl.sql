create table question(id serial primary key, text varchar not null);

create table question_option(id serial primary key, question_id integer references question(id) not null, text varchar not null);

create table vote(id serial primary key, question_id integer references question(id) not null, option_id integer references question_option(id) not null,
                  timestamp timestamp default now() not null, value numeric(16) not null, rlocktime integer not null, address varchar not null,
                  refundtx bytea not null, locktx bytea not null, txid varchar not null);

create index idx_vote_weight on vote((value*rlocktime));
create index idx_vote_bdl on vote((value*rlocktime/144));

create or replace view v_vote as select *, rlocktime*value as weight, rlocktime*value/144 as weight_bdl from vote order by timestamp desc;

create or replace view vote_totals as select question_id, option_id, sum(weight) as total, sum(weight_bdl) as total_bdl from v_vote group by question_id, option_id;

create or replace view v_question as select q.*, sum(v.weight) as total_weight from question q left join v_vote v on v.question_id=q.id group by q.id;
