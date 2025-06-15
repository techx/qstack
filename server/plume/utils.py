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
    Initiate a connection to plum db
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
    """
    Initiate a connection to qstack db
    """
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

def init_new_users_table():
    """
    Set up tables for migration
    """

    # set up connections
    qstack_conn, qstack_cur = create_qstack_connection()

    # rename current users table => users_old
    qstack_cur.execute("ALTER TABLE users RENAME TO users_old;")

    # delete tickets table's fkey constraints
    qstack_cur.execute("""
        ALTER TABLE tickets
        DROP CONSTRAINT tickets_claimant_id_fkey,
        DROP CONSTRAINT tickets_creator_id_fkey;
    """)

    # create new users table
    qstack_cur.execute("""
        CREATE TABLE users (
            id                 CHARACTER VARYING   NOT NULL,
            role               TEXT                NOT NULL,
            location           TEXT                NOT NULL,
            zoomlink           TEXT                NOT NULL,
            discord            TEXT                NOT NULL,
            resolved_tickets   INTEGER,
            ratings            NUMERIC(2,1)[],
            reviews            TEXT[]              NOT NULL,
            ticket_id          INTEGER,
            PRIMARY KEY (id),
            CONSTRAINT users_ticket_id_fkey
                FOREIGN KEY (ticket_id)
                REFERENCES tickets(id)
                ON DELETE SET NULL
        );
    """)

    # change tickets table's creator and claimant id column types
    qstack_cur.execute("""
        ALTER TABLE tickets
            ALTER COLUMN creator_id
                TYPE CHARACTER VARYING,
            ALTER COLUMN claimant_id
                TYPE CHARACTER VARYING;
    """)

    # redefine tickets table's fkey constraints
    qstack_cur.execute("""
        ALTER TABLE tickets
            ADD CONSTRAINT tickets_claimant_id_fkey
                FOREIGN KEY (claimant_id) REFERENCES users(id),
            ADD CONSTRAINT tickets_creator_id_fkey
                FOREIGN KEY (creator_id) REFERENCES users(id);
    """)

    qstack_conn.commit()

def load_all_users():
    """
    Copy all user ids from plume to qstack
    """
    # set up connections
    ec2_conn, ec2_cur = create_ec2_connection()
    qstack_conn, qstack_cur = create_qstack_connection()

    # load user data from plume's user table
    ec2_cur.execute("""
        SELECT id from "user";
    """)
    uids = [uid[0] for uid in ec2_cur.fetchall()]
    #uids = ec2_cur.fetchall()

    # add ids to qstack's new users table
    for i in range(len(uids)):
        uid = uids[i]

        qstack_cur.execute(f"""
           INSERT INTO users (id, role, location, zoomlink, discord, reviews) VALUES ('{str(uid)}', 'hacker', '', '', '', ARRAY[]::text[]);
        """)
        qstack_conn.commit()

def delete_users_old():
    """
    Delete users_old table after migration
    """
    # set up connections
    qstack_conn, qstack_cur = create_qstack_connection()
    
    # load user data from plume's user table
    qstack_cur.execute("""
        DROP TABLE IF EXISTS users_old CASCADE;
        DROP SEQUENCE IF EXISTS users_id_seq;
    """)
    qstack_conn.commit()

def get_name(uid):
    """
    Get user name from plume db
    """
    # set up connections
    ec2_conn, ec2_cur = create_ec2_connection()
    qstack_conn, qstack_cur = create_qstack_connection()

    # load user data from plume's user table
    ec2_cur.execute(f"""
        SELECT first_name, last_name from "user" WHERE id='{str(uid)}';
    """)
    uinfo = ec2_cur.fetchall()[0]

    name = " ".join([uinfo[0], uinfo[1]])

    return name

def get_email(uid):
    """
    Get user email from plume db
    """
    # set up connections
    ec2_conn, ec2_cur = create_ec2_connection()
    qstack_conn, qstack_cur = create_qstack_connection()

    # load user data from plume's user table
    ec2_cur.execute(f"""
        SELECT email from "user" WHERE id='{str(uid)}';
    """)
    uinfo = ec2_cur.fetchall()[0]

    email = uinfo[0]

    return email


























# def get_last_user_id():
#     """
#     Get id number of last user added to qstack user table
#     """
#     qstack_conn, qstack_cur = create_qstack_connection()
    
#     qstack_cur.execute("""
#         SELECT id FROM users ORDER BY id DESC LIMIT 1
#     """)
#     last_user = qstack_cur.fetchall()

#     #print(last_user[0][0])
#     return last_user[0][0]




# def load_all_users():
#     # set up connections
#     ec2_conn, ec2_cur = create_ec2_connection()
#     qstack_conn, qstack_cur = create_qstack_connection()
    
#     #############################################################################
#     #             DELETES existing table and creates new user table             #
#     #############################################################################
#     #qstack_cur.execute('DROP TABLE IF EXISTS users CASCADE;')
#     #qstack_cur.execute('CREATE SEQUENCE users_id_seq OWNED BY users.id')
#     #qstack_cur.execute("""
#     #    CREATE TABLE users (
#     #        id                 INTEGER             NOT NULL        DEFAULT NEXTVAL('users_id_seq'::regclass)       PRIMARY KEY,
#     #        name               TEXT                NOT NULL,
#     #        email              TEXT                NOT NULL,
#     #        role               TEXT                NOT NULL,
#     #        location           TEXT                NOT NULL,
#     #        zoomlink           TEXT                NOT NULL,
#     #        discord            TEXT                NOT NULL,
#     #        resolved_tickets   INTEGER,
#     #        ratings            NUMERIC(2,1)[],
#     #        reviews            TEXT[]              NOT NULL,
#     #        ticket_id          INTEGER,
#     #        CONSTRAINT users_ticket_id_fkey
#     #            FOREIGN KEY (ticket_id)
#     #            REFERENCES tickets(id)
#     #            ON DELETE SET NULL
#     #    );
#     #""")
#     #qstack_conn.commit()

#     # load user data from plume's user table
#     ec2_cur.execute("""
#         SELECT id from "user";
#     """)
#     uids = [uid[0] for uid in ec2_cur.fetchall()]
#     #uids = ec2_cur.fetchall()

#     # add user data to qstack's users table
#     for i in range(len(uids)):
#         # retrieve name and email columns from plume's "user" table
#         uid = uids[i]
        
#         ec2_cur.execute(f"""
#             SELECT first_name, last_name, email from "user" WHERE id='{str(uid)}';
#         """)
#         uid_info = ec2_cur.fetchall()[0]

#         name = " ".join([uid_info[0], uid_info[1]])
#         email = uid_info[2]

#         # insert into qstack's users table
#         qstack_cur.execute(f"""
#            INSERT INTO users (id, name, email, role) VALUES ('{int(i)}', '{(name)}', '{(email)}', 'hacker');
#         """)
#         qstack_conn.commit()
    
#     return len(uids) # number of users

#########################################################
#    DON'T USE THIS FUNC, ID AND USER_ID DON'T MATCH    #
#########################################################
# def load_new_users():
#     # set up connections
#     ec2_conn, ec2_cur = create_ec2_connection()
#     qstack_conn, qstack_cur = create_qstack_connection()

#     ec2_cur.execute(f"""
#         select id from "user";
#     """)
#     load_uids = [uid[0] for uid in ec2_cur.fetchall()]

#     qstack_cur.execute(f"""
#         select user_id from users;
#     """)
#     existing_uids = [uid[0] for uid in qstack_cur.fetchall()]

#     uids = [uid for uid in load_uids if uid not in existing_uids]

#     id = get_last_user_id()+1

#     # add user data to qstack's users table
#     for i in range(len(uids)):
#         uid = uids[i]
#         ec2_cur.execute(f"""
#             SELECT first_name, last_name, email from "user" WHERE id='{str(uid)}';
#         """)
#         # uids = [uid[0] for uid in ec2_cur.fetchall()]
#         uid_info = ec2_cur.fetchall()[0]

#         name = " ".join([uid_info[0], uid_info[1]])
#         email = uid_info[2]
#         qstack_cur.execute(f"""
#             INSERT INTO users (id, name, email, role) VALUES ('{int(id+i)}', '{str(name)}', '{str(email)}', 'hacker');
#         """)
#         qstack_conn.commit()
    
#     return len(uids)