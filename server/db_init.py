from plume.utils import create_ec2_connection, create_qstack_connection, load_all_users
import psycopg2

qstack_conn, qstack_cur = create_qstack_connection()
ec2_conn, ec2_cur = create_ec2_connection()
load_all_users()
# load_new_users()