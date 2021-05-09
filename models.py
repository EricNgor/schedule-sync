"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later

db.define_table(
    'user',
    Field('user_email', requires=[IS_NOT_EMPTY(error_message='Enter an email'), IS_EMAIL()]),
    Field('first_name', requires=IS_NOT_EMPTY(error_message='Enter a first name')),
    Field('last_name', requires=IS_NOT_EMPTY(error_message='Enter a last name')),
    Field('schedule'),
    Field('groups', 'list:integer', default=[])
)

db.define_table(
    'group',
    Field('group_name'),
    Field('owner_id', 'reference user'),
    Field('members', 'list:string', default=[]),
    Field('join_code')
)

db.user.id.readable = db.user.id.writable = False
db.user.user_email.readable = db.user.user_email.writable = False

db.group.id.readable = db.group.id.writable = False

db.commit()
