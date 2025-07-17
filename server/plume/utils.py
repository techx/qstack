# intitate everyone one with hacker role (mentor role given when they enter password on their own)
# add "application_complete" check later

import os
from dotenv import load_dotenv
import psycopg2
from urllib.parse import urlparse
#from info import USER_MAP
# import uuid

from sqlalchemy import null
# import multiprocessing

load_dotenv()
load_dotenv(dotenv_path='server/.env')
EC2_DATABASE_HOST = os.getenv("EC2_DATABASE_HOST")
EC2_DATABASE_USER = os.getenv("EC2_DATABASE_USER")
EC2_DATABASE_PASSWORD = os.getenv("EC2_DATABASE_PASSWORD")
EC2_DATABASE_NAME = os.getenv("EC2_DATABASE_NAME")
DATABASE_URL = os.getenv("DATABASE_URL")


def create_ec2_connection():
    """
    Initiate a connection to plume db
    """
    conn = psycopg2.connect(
        host=EC2_DATABASE_HOST,
        user=EC2_DATABASE_USER,
        password=EC2_DATABASE_PASSWORD,
        dbname=EC2_DATABASE_NAME
    )
    cur = conn.cursor()
    # cur.execute("ROLLBACK")
    # conn.commit()
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
    # cur.execute("ROLLBACK")
    # conn.commit()
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
    # return conn, cur

def init_new_users_table():
    """
    Set up tables for migration
    """

    # set up connections
    qstack_conn, qstack_cur = create_qstack_connection()

    # rename current users table => users_old
    qstack_cur.execute("ALTER TABLE IF EXISTS users RENAME TO users_old;")

    # delete tickets table's fkey constraints
    qstack_cur.execute("""
        ALTER TABLE tickets
        DROP CONSTRAINT IF EXISTS tickets_claimant_id_fkey,
        DROP CONSTRAINT IF EXISTS tickets_creator_id_fkey;
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
                FOREIGN KEY (claimant_id) REFERENCES users(id) ON DELETE CASCADE,
            ADD CONSTRAINT tickets_creator_id_fkey
                FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE;
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
            INSERT INTO users (id, role, location, zoomlink, discord, reviews)
            VALUES ('{str(uid)}', 'hacker', 'in person', '', '', ARRAY[]::text[])
            ON CONFLICT (id) DO NOTHING;
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


# def get_single_info(uid: str):
#     """
#     Get user name and email from plume db
#     """
#     # set up connections
#     ec2_conn, ec2_cur = create_ec2_connection()
#     qstack_conn, qstack_cur = create_qstack_connection()

#     """
#     Get user name from plume db
#     """
#     # set up connections
#     ec2_conn, ec2_cur = create_ec2_connection()
#     qstack_conn, qstack_cur = create_qstack_connection()

#     # load user data from plume's user table
#     ec2_cur.execute(f"""
#         SELECT first_name, last_name, email from "user" WHERE id='{str(uid)}';
#     """)
#     uinfo = ec2_cur.fetchone()
#     info={
#         "name": " ".join([uinfo[0], uinfo[1]]) if uinfo else None, 
#         "email": uinfo[2] if uinfo else None
#     }

#     return info

# def get_bulk_info(uids: list[str]):
#     """
#     Get user name and email from plume db
#     """
#     # set up connections
#     ec2_conn, ec2_cur = create_ec2_connection()
#     qstack_conn, qstack_cur = create_qstack_connection()

#     def get_info(ids: list[str]):
#         # load user data from plume's user table
#         plume_info = {}

#         for id in ids:
#             ec2_cur.execute(f"""
#                 SELECT first_name, last_name, email from "user" WHERE id='{str(id)}';
#             """)
#             uinfo = ec2_cur.fetchone()
#             plume_info[id]={
#                 "name": " ".join([uinfo[0], uinfo[1]]) if uinfo else None, 
#                 "email": uinfo[2] if uinfo else None
#             }
        
#         return plume_info

#     # set up multithreading
#     threads = 10
#     pool = multiprocessing.Pool(processes=threads)
#     inputs = []
#     for i in range(0, threads):
#         if i == threads-1:
#             inputs.append(uids[i*len(uids)//threads:])
#         else:
#             inputs.append(uids[i*len(uids)//threads:(i+1)*len(uids)//threads])

#     info = {}
#     for output in pool.map(get_info, inputs):
#         info.update(output)

#     return info

def get_info(uids: list[str]):
    ec2_conn, ec2_cur = create_ec2_connection()
    plume_info: dict[str, dict] = {}

    if not uids:
        return {}

    placeholders = ",".join([f"\'{uid}\'" for uid in uids])
    ec2_cur.execute(f'''
        SELECT id, first_name, last_name, email
            FROM "user"
            WHERE id IN ({placeholders});
    ''')
    uinfo = ec2_cur.fetchall()

    for id, first, last, email in uinfo:
        plume_info[id] = {
            "name": f"{first} {last}",
            "email": email
        }

    return plume_info

if __name__ == "__main__":
    init_new_users_table()
    load_all_users()
    delete_users_old()