"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash, Field
from py4web.utils.url_signer import URLSigner
from .models import get_user_email
from py4web.utils.form import Form, FormStyleBulma
from pydal.validators import *
import random, string
import json

url_signer = URLSigner(session)

@action('index')
@action.uses(db, session, auth, 'index.html')
def index():
    user=auth.current_user
    if user:
        user_id = user.get('id')
        if not db(db.user.id==user_id).select():
            db.user.insert(
                id=user_id,
                user_email=user.get('email'),
                first_name=user.get('first_name'),
                last_name=user.get('last_name'),
            )

        rows = db(db.group_member.member_id==user_id).select()
        groups = []
        for row in rows:
            groups.append(row.group_id)
        
    return dict(
        user=user,
        load_groups_url = URL('load_groups', signer=url_signer),
    )
        

@action('create_group', method=["GET", "POST"])
@action.uses(db, session, auth.user, 'create_group.html')
def create_group():
    # Generate a 10-character alphanumeric string
    # https://stackoverflow.com/questions/2511222/efficiently-generate-a-16-character-alphanumeric-string
    # code = ''.join(random.choices(string.ascii_letters + string.digits, k=10))

    form = Form(
        [Field('group_name', requires=IS_NOT_EMPTY(error_message='Enter a group name'))],
        csrf_session=session, formstyle=FormStyleBulma, submit_value='Create Group')
        
    if form.accepted:
        group_name = form.vars['group_name']
        user_id=auth.current_user.get('id')

        # Just in case a duplicate code is created (1 / 62^10)
        while True:
            join_code = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
            code_exists = db(db.group.join_code==join_code).select().first()
            if not code_exists:
                break

        # Create group, add user to group, and assign user as owner
        db.group.insert(
            group_name=group_name,
            owner_id=user_id,
            join_code=join_code
        )
        group_id = db._adapter.lastrowid('group')

        db.group_member.insert(
            member_id=user_id,
            group_id=group_id
        )

        redirect(URL('group', group_id))

    return dict(form=form)

@action('join_group', method=["GET", "POST"])
@action.uses(db, session, auth.user, 'join_group.html')
def join_group():
    form = Form(
        [Field('invite_code')], 
        csrf_session=session, formstyle=FormStyleBulma, submit_value='Join Group')

    if form.accepted:
        group = db(db.group.join_code==form.vars['invite_code']).select().first()
        if group:
            # check if user is already in group
            user_id = auth.current_user.get('id')
            if db(
                (db.group_member.member_id==user_id) &
                (db.group_member.group_id==group.id)
            ).select():

                form.accepted = False
                form.errors['invite_code'] = "You're already in this group!"
                return dict(form=form)
            # else add to member list and add to user's groups
            else:
                db.group_member.insert(
                    member_id=user_id,
                    group_id=group.id
                )
                redirect(URL('group', group.id))

        else:
            form.accepted = False
            form.errors['invite_code'] = 'Invalid invite code!'
            return dict(form=form)
            
    return dict(form=form)
    
@action('schedule', method=["GET", "POST"])
@action.uses(db, session, auth.user, 'schedule.html')
def profile():
    user = auth.current_user
    first = user.get("first_name")
    last = user.get("last_name")
    email = user.get("email")

    return dict(
        first=first, last=last, email=email,
        load_schedule_url = URL('load_schedule', signer=url_signer),
        clear_schedule_url = URL('clear_schedule', signer=url_signer),
        save_schedule_url = URL('save_schedule', signer=url_signer),
    )

@action('load_groups')
@action.uses(url_signer.verify(), db)
def load_groups():
    groups = db(
        (db.group.id==db.group_member.group_id) &
        (db.group_member.member_id==auth.current_user.get('id'))
    ).select().as_list()
    return dict(groups=groups)

@action('load_schedule')
@action.uses(url_signer.verify(), db)
def load_schedule():
    schedule = db(db.user.id==auth.current_user.get('id')).select().first().schedule
    return dict(schedule=schedule)

@action('clear_schedule')
@action.uses(url_signer.verify(), db)
def clear_schedule():
    id = auth.current_user.get('id')
    db(db.user.id==id).update(schedule='')

@action('save_schedule', method="POST")
@action.uses(url_signer.verify(), db)
def save_schedule():
    schedule = str(request.json.get('schedule'))
    id = auth.current_user.get('id')
    db(db.user.id==id).update(schedule=schedule)
    return dict(id=id)

@action('group/<group_id:int>')
@action.uses(db, session, auth.user, 'group.html')
def group(group_id):
    assert group_id is not None
    user_id = auth.current_user.get('id')
    # None if user is not in group
    user_in_group = db(
        (db.group_member.group_id==group_id) &
        (db.group_member.member_id==user_id) 
    ).select(db.group_member.member_id).first()

    if user_in_group is not None:
        user_in_group = user_in_group.member_id
    join_code = db(db.group.id==group_id).select(db.group.join_code).first()
    if join_code is not None:
        join_code = join_code.join_code
    group = db.group(group_id)
    if group is not None:
        group_name = group.group_name

    return dict(
        user_in_group=user_in_group,
        group_name=group_name,
        join_code=join_code,
        load_group_url = URL('load_group', group_id, signer=url_signer),
        leave_group_url = URL('leave_group', group_id, user_id, signer=url_signer)
    )

# Load group data to Vue
@action('load_group/<group_id:int>')
@action.uses(url_signer.verify(), db)
def load_group(group_id):
    assert group_id is not None
    # Return information in this group necessary to display common times
    member_schedules = db(
        (db.group.id==group_id) &
        (db.group_member.member_id==db.user.id) &
        (db.group_member.group_id==db.group.id)
    ).select(db.user.id, db.user.first_name, db.user.last_name, db.user.schedule)
    return dict(group_id=group_id, member_schedules=member_schedules.response)

# Remove user from group
# If that group becomes empty, remove group
@action('leave_group/<group_id:int>/<user_id:int>')
@action.uses(url_signer.verify(), db)
def leave_group(group_id, user_id):
    assert group_id is not None and user_id is not None
    db(
        (db.group_member.group_id==group_id) &
        (db.group_member.member_id==user_id) 
    ).delete()

    members = db(db.group_member.group_id==group_id).select().first()
    if members is None:
        db(db.group.id==group_id).delete()
