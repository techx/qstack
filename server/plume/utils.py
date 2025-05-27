# intitate everyone one with hacker role (mentor role given when they enter password on their own)
# add "application_complete" check later

import os
from dotenv import load_dotenv
import psycopg2
from urllib.parse import urlparse
#from info import USER_MAP
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
        host="database", # service name in docker-compose.yml
        port=5432,
        dbname="qstackdb",
        user="postgres",
        password="password"
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


def get_last_user_id():
    qstack_conn, qstack_cur = create_qstack_connection()
    
    qstack_cur.execute(f"""
        SELECT id FROM users ORDER BY id DESC LIMIT 1
    """)
    last_user = qstack_cur.fetchall()

    #print(last_user[0][0])
    return last_user[0][0]




def load_all_users():
    # set up connections
    ec2_conn, ec2_cur = create_ec2_connection()
    qstack_conn, qstack_cur = create_qstack_connection()
    
    # deletes existing and creates new users table
    #qstack_cur.execute(f'DROP TABLE IF EXISTS users CASCADE;')
    #qstack_cur.execute(f"""
    #    CREATE TABLE users (
    #        id INTEGER PRIMARY KEY,
    #        name TEXT,
    #        email TEXT,
    #        role TEXT,
    #        location TEXT,
    #        zoomlink TEXT,
    #        discord TEXT,
    #        resolved_tickets INTEGER,
    #        ratings NUMERIC(2,1)[],
    #        reviews TEXT[],
    #        ticket_id INTEGER
    #    );
    #""")
    #qstack_conn.commit()

    # load user data from plume's user table
    ec2_cur.execute(f"""
        SELECT id from "user";
    """) # include quote because user is special keyword is psql?
    uids = [uid[0] for uid in ec2_cur.fetchall()]
    #uids = ec2_cur.fetchall()

    # add user data to qstack's users table
    for i in range(len(uids)):
        uid = uids[i]
        
        ec2_cur.execute(f"""
            SELECT first_name, last_name, email from "user" WHERE id='{str(uid)}';
        """)
        # uids = [uid[0] for uid in ec2_cur.fetchall()]
        uid_info = ec2_cur.fetchall()[0]

        name = " ".join([uid_info[0], uid_info[1]])
        email = uid_info[2]
        print(name)
        #try:
        #qstack_cur.execute(f"""
        #    INSERT INTO users (id, name, email, role) VALUES ('{int(i)}', '{(name)}', '{(email)}', 'hacker');
        #""")
        #qstack_conn.commit()
        #except:
        #    print(name)
    
    return len(uids) # number of users



#########################################################
#    DON'T USE THIS FUNC, ID AND USER_ID DON'T MATCH    #
#########################################################
def load_new_users():
    # set up connections
    ec2_conn, ec2_cur = create_ec2_connection()
    qstack_conn, qstack_cur = create_qstack_connection()

    ec2_cur.execute(f"""
        select id from "user";
    """)
    load_uids = [uid[0] for uid in ec2_cur.fetchall()]

    qstack_cur.execute(f"""
        select user_id from users;
    """)
    existing_uids = [uid[0] for uid in qstack_cur.fetchall()]

    uids = [uid for uid in load_uids if uid not in existing_uids]

    id = get_last_user_id()+1

    # add user data to qstack's users table
    for i in range(len(uids)):
        uid = uids[i]
        ec2_cur.execute(f"""
            SELECT first_name, last_name, email from "user" WHERE id='{str(uid)}';
        """)
        # uids = [uid[0] for uid in ec2_cur.fetchall()]
        uid_info = ec2_cur.fetchall()[0]

        name = " ".join([uid_info[0], uid_info[1]])
        email = uid_info[2]
        qstack_cur.execute(f"""
            INSERT INTO users (id, name, email, role) VALUES ('{int(id+i)}', '{str(name)}', '{str(email)}', 'hacker');
        """)
        qstack_conn.commit()
    
    return len(uids)

load_all_users()