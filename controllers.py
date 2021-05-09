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
    groups = db(db.user.id==user_id).select().first()
    
    if groups:
        print('you are in', len(groups), 'groups')
    return dict(user=user, groups=groups)
        

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
            code = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        )
        # db(db.user.id==user_id).
        redirect(URL('index'))


    return dict(form=form)

@action('join_group', method=["GET", "POST"])
@action.uses(db, session, auth.user, 'join_group.html')
def join_group():
    form = Form(
        [Field('code')], 
        csrf_session=session, formstyle=FormStyleBulma, submit_value='Join Group')

    if form.accepted:
        code = form.vars['code']
        print('accepted:', code)
        redirect(URL('index'))

    return dict(form=form)

