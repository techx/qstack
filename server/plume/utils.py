# intitate everyone one with hacker role (mentor role given why the enter password on their own)
# add "application_complete" check later

import os
from dotenv import load_dotenv
import psycopg2
from urllib.parse import urlparse
from info import USER_MAP
import uuid

load_dotenv()
load_dotenv(dotenv_path='server/.env')
EC2_DATABASE_HOST = os.getenv("EC2_DATABASE_HOST")
EC2_DATABASE_USER = os.getenv("EC2_DATABASE_USER")
EC2_DATABASE_PASSWORD = os.getenv("EC2_DATABASE_PASSWORD")
EC2_DATABASE_NAME = os.getenv("EC2_DATABASE_NAME")
DATABASE_URL = os.getenv("DATABASE_URL")


def create_ec2_connection():
    """
    Initiate a connection to the database
    """

    conn = psycopg2.connect(
        host=EC2_DATABASE_HOST,
        user=EC2_DATABASE_USER,
        password=EC2_DATABASE_PASSWORD,
        dbname=EC2_DATABASE_NAME
    )
    cur = conn.cursor()
    cur.execute("ROLLBACK")
    conn.commit()

    return conn, cur

def create_qstack_connection():
    conn = psycopg2.connect(
        host="database", # service name in docker-compose
        port=5432,
        ########################################################################
                                    #CHANGE DBNAME???
        ########################################################################
        dbname="hack",
        user="postgres",
        password="postgres"
    )

    cur = conn.cursor()
    return conn, cur
    # uncommented part use for local run, not for docker
    # url = urlparse(DATABASE_URL)
    # conn = psycopg2.connect(
    #     host=url.hostname,
    #     port=url.port,
    #     database=url.path[1:],
    #     user=url.username,
    #     password=url.password
    # )
    # cur = conn.cursor()
    # cur.execute("ROLLBACK")
    # conn.commit()

def load_answers(qstack_cur, qstack_conn, ec2_cur, ec2_conn):
    # create user table
    qstack_cur.execute(f'DROP TABLE IF EXISTS users;')
    qstack_cur.execute(f"""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY DEFAULT nextval('users_id_seq'::regclass),
            name TEXT,
            email TEXT,
            role TEXT,
            location TEXT,
            zoomlink TEXT,
            discord TEXT,
            resolved_tickets INTEGER,
            ratings NUMERIC(2,1)[],
            reviews TEXT[],
            ticket_id INTEGER
        );
    """)
    qstack_conn.commit()

    ec2_cur.execute(f"""
        select user_id from user_hackathon_role where hackathon_id='bp-2025';
    """)
    uids = [uid[0] for uid in ec2_cur.fetchall()]

    # create answer table
    qstack_cur.execute(f'DROP TABLE IF EXISTS answer;')
    qstack_cur.execute(f"""
        CREATE TABLE answer (
            user_id VARCHAR (100),
            question_id VARCHAR (100),
            response_text TEXT
        );
    """)
    qstack_conn.commit()

    # add answer data to tables
    for uid in uids:
        qstack_cur.execute(f"""
            INSERT INTO users (user_id, round_number) VALUES ('{str(uid)}', 1);
        """)
        qstack_conn.commit()

        ec2_cur.execute(f"""
            SELECT answer.text, choice.question_id FROM answer JOIN choice ON answer.choice_id = choice.id WHERE answer.user_id = '{uid}';
        """)
        res = ec2_cur.fetchall()
        for answer in res:
            try:
                text = answer[0].replace("'", "''")
                qid = answer[1]
                qstack_cur.execute(f"""
                    INSERT INTO answer (user_id, question_id, response_text) VALUES ('{str(uid)}', '{str(qid)}', '{str(text)}');
                """)
                qstack_conn.commit()

                if qid in APPLICANT_MAP["applicant"]:
                    qstack_cur.execute(f"""
                        UPDATE users SET {APPLICANT_MAP["applicant"][qid]} = '{str(text)}' WHERE user_id = '{str(uid)}';
                    """)
                    qstack_conn.commit()
            except:
                continue
    
    return len(uids)

