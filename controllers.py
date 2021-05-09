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


url_signer = URLSigner(session)

@action('index', method=["GET"])
@action.uses(db, session, auth, 'index.html')
def index():
    user=auth.current_user
    user_id = user.get('id')
    if user:
        if not db(db.user.id==user_id).select():
            print('adding new unique user')
            db.user.insert(
                id=user_id,
                user_email=user.get('email'),
                first_name=user.get('first_name'),
                last_name=user.get('last_name'),
            )

        # groups = db(db.user.id==user_id).select().first().groups
        # if groups:
        #     print('you are in', len(groups), 'groups')
        #     print('groups:', groups)
        #     code2 = db(db.group.id==groups[0]).select().first().join_code
        #     print('code:', code2)
    return dict(user=user)
        

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
        # Create group, add user to group, and assign user as owner
        db.group.insert(
            group_name=group_name,
            owner_id=user_id,
            members=[user_id],
            join_code=''.join(random.choices(string.ascii_letters + string.digits, k=10))
        )

        id = db._adapter.lastrowid('group')
        user = db.user(user_id)
        user.update_record(groups=user.groups + [id])

        redirect(URL('group', id))

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
            print('group members:', group.members)
            if str(user_id) in group.members:
                form.accepted = False
                form.errors['invite_code'] = "You're already in this group!"
                return dict(form=form)
            # else add to member list and add to user's groups
            else:
                print('joining group with id:', group.id)
                group.update_record(members=group.members + [user_id])
                user = db.user(user_id)
                user.update_record(groups=user.groups + [group.id])
                redirect(URL('group', group.id))

        else:
            form.accepted = False
            form.errors['invite_code'] = 'Invalid invite code!'
            return dict(form=form)
            
    return dict(form=form)
    
@action('group/<group_id:int>')
@action.uses(db, session, auth.user, 'group.html')
def group(group_id):
    assert group_id is not None
    # TODO:
    # make sure you can only view this group if you are in it

    group = db.group(group_id)
    group_name = group.group_name
    return dict(group_name=group_name)

@action('schedule')
@action.uses(db, session, auth, 'schedule.html')
def profile():
    user = auth.current_user
    first = user.get("first_name")
    last = user.get("last_name")
    email = user.get("email")
    return dict( first = first, last = last, email= email)