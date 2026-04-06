"""
Team Invitation Routes for Locaa AI
"""
from flask import Blueprint, request, jsonify
import secrets
from datetime import datetime, timedelta
from database.models import db, User, UserInvite
from utils.auth import get_current_user, user_required
from core.email_handler import send_team_invite_email
from utils.logger import log

invite_bp = Blueprint('invites', __name__, url_prefix='/api/invites')


@invite_bp.route('/send', methods=['POST'])
@user_required
def send_invite():
    """Send team invite to another user"""
    try:
        data = request.get_json()
        invite_email = (data.get('invite_email') or '').strip().lower()
        role = (data.get('role', 'member') or 'member').strip().lower()  # admin, editor, viewer
        
        if not invite_email:
            return jsonify({"error": "Email required"}), 400

        allowed_roles = {'admin', 'editor', 'viewer'}
        if role not in allowed_roles:
            return jsonify({"error": "Invalid role. Allowed: admin, editor, viewer"}), 400
        
        user = get_current_user()

        if invite_email == (user.email or '').strip().lower():
            return jsonify({"error": "You cannot invite your own email"}), 400
        
        # Check if already invited
        existing = UserInvite.query.filter_by(
            inviter_id=user.id,
            invite_email=invite_email,
            status='pending'
        ).first()
        
        if existing:
            return jsonify({"error": "Invite already sent to this email"}), 400
        
        # Generate token
        token = secrets.token_urlsafe(32)
        
        invite = UserInvite(
            inviter_id=user.id,
            invite_email=invite_email,
            role=role,
            token=token,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        db.session.add(invite)
        db.session.commit()

        frontend_url = (request.host_url or '').rstrip('/')
        frontend_base = (request.headers.get('X-Frontend-Url') or frontend_url).rstrip('/')
        invite_link = f"{frontend_base}/team-collaboration?inviteToken={token}"
        inviter_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username or user.email
        email_sent = send_team_invite_email(invite_email, inviter_name, invite_link, role)
        
        log(f"Team invite sent from {user.id} to {invite_email}")
        
        return jsonify({
            'success': True,
            'message': f'Invite sent to {invite_email}' if email_sent else f'Invite created for {invite_email} (email failed, share invite link manually)',
            'invite_id': invite.id,
            'email_sent': email_sent,
            'invite_link': invite_link
        }), 201
    except Exception as e:
        log(f"Error sending invite: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@invite_bp.route('/pending', methods=['GET'])
@user_required
def get_pending_invites():
    """Get pending invites for user"""
    try:
        user = get_current_user()
        
        invites = UserInvite.query.filter_by(
            invite_email=user.email,
            status='pending'
        ).all()
        
        return jsonify([{
            'id': inv.id,
            'token': inv.token,
            'inviter_email': inv.inviter.email if inv.inviter else 'Unknown',
            'inviter_name': f"{inv.inviter.first_name} {inv.inviter.last_name}" if inv.inviter else 'Unknown',
            'role': inv.role,
            'expires_at': inv.expires_at.isoformat(),
            'created_at': inv.created_at.isoformat()
        } for inv in invites]), 200
    except Exception as e:
        log(f"Error fetching invites: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@invite_bp.route('/accept/<token>', methods=['POST'])
@user_required
def accept_invite(token):
    """Accept team invite"""
    try:
        user = get_current_user()
        
        invite = UserInvite.query.filter_by(token=token).first()
        
        if not invite:
            return jsonify({"error": "Invite not found"}), 404
        
        if invite.status != 'pending':
            return jsonify({"error": "Invite already processed"}), 400
        
        if invite.expires_at < datetime.utcnow():
            return jsonify({"error": "Invite has expired"}), 400
        
        if invite.invite_email != user.email:
            return jsonify({"error": "This invite is not for you"}), 403
        
        # Accept invite
        invite.status = 'accepted'
        invite.invitee_id = user.id
        invite.accepted_at = datetime.utcnow()
        
        # TODO: Add user to team workspace
        # Grant permissions based on role
        
        db.session.commit()
        
        log(f"Invite accepted by {user.id} from {invite.inviter_id}")
        
        return jsonify({
            'success': True,
            'message': f'Invite accepted! You are now a {invite.role}',
            'role': invite.role
        }), 200
    except Exception as e:
        log(f"Error accepting invite: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@invite_bp.route('/decline/<token>', methods=['POST'])
@user_required
def decline_invite(token):
    """Decline team invite"""
    try:
        user = get_current_user()
        invite = UserInvite.query.filter_by(token=token).first()
        
        if not invite:
            return jsonify({"error": "Invite not found"}), 404
        
        if invite.status != 'pending':
            return jsonify({"error": "Invite already processed"}), 400

        if invite.expires_at < datetime.utcnow():
            return jsonify({"error": "Invite has expired"}), 400

        if invite.invite_email != user.email:
            return jsonify({"error": "This invite is not for you"}), 403
        
        invite.status = 'declined'
        db.session.commit()
        
        log(f"Invite declined: {invite.id}")
        
        return jsonify({
            'success': True,
            'message': 'Invite declined'
        }), 200
    except Exception as e:
        log(f"Error declining invite: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@invite_bp.route('/sent', methods=['GET'])
@user_required
def get_sent_invites():
    """Get invites sent by user"""
    try:
        user = get_current_user()
        
        invites = UserInvite.query.filter_by(inviter_id=user.id).all()
        
        return jsonify([{
            'id': inv.id,
            'invite_email': inv.invite_email,
            'token': inv.token,
            'role': inv.role,
            'status': inv.status,
            'accepted_at': inv.accepted_at.isoformat() if inv.accepted_at else None,
            'expires_at': inv.expires_at.isoformat(),
            'created_at': inv.created_at.isoformat()
        } for inv in invites]), 200
    except Exception as e:
        log(f"Error fetching sent invites: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@invite_bp.route('/<int:invite_id>/revoke', methods=['POST'])
@user_required
def revoke_invite(invite_id):
    """Revoke sent invite"""
    try:
        user = get_current_user()
        
        invite = UserInvite.query.filter_by(id=invite_id, inviter_id=user.id).first()
        
        if not invite:
            return jsonify({"error": "Invite not found"}), 404
        
        if invite.status != 'pending':
            return jsonify({"error": "Can only revoke pending invites"}), 400
        
        db.session.delete(invite)
        db.session.commit()
        
        log(f"Invite revoked: {invite_id}")
        
        return jsonify({
            'success': True,
            'message': 'Invite revoked'
        }), 200
    except Exception as e:
        log(f"Error revoking invite: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@invite_bp.route('/team', methods=['GET'])
@user_required
def get_team():
    """Get the full team (Owner + Invites)"""
    try:
        user = get_current_user()
        team_members = []
        
        # 1. Add the Owner (current user)
        team_members.append({
            'id': f"user_{user.id}",
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'email': user.email,
            'role': 'Owner',
            'status': 'Active'
        })
        
        # 2. Add Invited Users
        invites = UserInvite.query.filter_by(inviter_id=user.id).all()
        for inv in invites:
            member_name = 'Pending User'
            member_status = 'Pending'
            
            if inv.status == 'accepted' and inv.invitee_id:
                # Get actual user details if accepted
                invitee = User.query.get(inv.invitee_id)
                if invitee:
                    member_name = f"{invitee.first_name} {invitee.last_name}".strip() or invitee.username
                    member_status = 'Active'
            elif inv.status == 'declined':
                member_status = 'Declined'
                    
            team_members.append({
                'id': f"invite_{inv.id}",
                'invite_id': inv.id,
                'name': member_name,
                'email': inv.invite_email,
                'role': inv.role.capitalize(),
                'status': member_status,
                'can_revoke': inv.status == 'pending'
            })
            
        return jsonify(team_members), 200
    except Exception as e:
        log(f"Error fetching team: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500
