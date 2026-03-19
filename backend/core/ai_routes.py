"""
AI Image and Video Generation Routes
Provides endpoints for generating AI images and videos using Stability AI and Replicate APIs.
"""
import os
import json
import time
import requests
import replicate
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from database.models import db, AIGeneration
from utils.auth import get_current_user
from utils.logger import log

# Initialize blueprint
ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

# Configure Stability AI (free tier: 25 images/day, no credit card required!)
STABILITY_API_KEY = os.getenv('STABILITY_API_KEY')
STABILITY_IMAGE_ENGINE = os.getenv('STABILITY_IMAGE_ENGINE', 'stable-diffusion-xl-1024-v1-0')


def _normalize_image_quality(raw_quality: str) -> str:
    """Normalize quality values for Stability AI model."""
    quality = (raw_quality or '').strip().lower()

    # Map legacy values to Stability AI tiers
    legacy_map = {
        'standard': 'medium',  # stable-diffusion-v3-medium (free)
        'hd': 'high',          # ultra for better quality
    }
    quality = legacy_map.get(quality, quality)

    allowed = {'low', 'medium', 'high', 'auto'}
    return quality if quality in allowed else 'medium'

# Replicate API token
REPLICATE_API_TOKEN = os.getenv('REPLICATE_API_TOKEN')
REPLICATE_VIDEO_MODEL = os.getenv('REPLICATE_VIDEO_MODEL', 'kwaivgi/kling-v1.6-standard')


@ai_bp.route('/generate-image', methods=['POST'])
@jwt_required()
def generate_image():
    """
    Generate AI image from text prompt using Stability AI Stable Diffusion v3
    
    Request JSON:
    {
        "prompt": "A futuristic robot painting",
        "size": "1024x1024",  # Optional: 1024x1024, 1792x1024, 1024x1792
        "quality": "auto"  # Optional: auto, low, medium, high
    }
    """
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401

        data = request.get_json()
        
        if not data or not data.get('prompt'):
            return jsonify({'error': 'Prompt is required'}), 400
        
        prompt = data.get('prompt', '').strip()
        size = data.get('size', '1024x1024')
        quality = _normalize_image_quality(data.get('quality', 'auto'))
        
        # Validate prompt length
        if len(prompt) > 4000:
            return jsonify({'error': 'Prompt is too long (max 4000 characters)'}), 400
        
        if len(prompt) < 10:
            return jsonify({'error': 'Prompt is too short (min 10 characters)'}), 400
        
        # Check if API key is configured
        if not STABILITY_API_KEY:
            log(f'ERROR: Stability AI API key not configured for user {user.id}')
            return jsonify({
                'error': 'Image generation not configured. Admin needs to add STABILITY_API_KEY to .env'
            }), 500
        
        # Call Stability AI API (Stable Diffusion v3, free tier!)
        start_time = time.time()
        log(f'Generating image for user {user.id}: {prompt[:100]}...')

        stability_url = f'https://api.stability.ai/v1/generation/{STABILITY_IMAGE_ENGINE}/text-to-image'
        headers = {
            'Authorization': f'Bearer {STABILITY_API_KEY}',
            'Content-Type': 'application/json'
        }

        # Stability AI expects text_prompts array format
        payload = {
            'text_prompts': [
                {
                    'text': prompt,
                    'weight': 1.0
                }
            ],
            'steps': 20,  # 20-50 steps (lower = faster, less detail)
            'guidance_scale': 7.0,  # how strictly to follow prompt
            'width': int(size.split('x')[0]),
            'height': int(size.split('x')[1]),
            'samples': 1  # number of images (1 recommended)
        }

        response = requests.post(stability_url, json=payload, headers=headers)
        used_engine = STABILITY_IMAGE_ENGINE

        # Fallback: retry with compatible engines if current one is unavailable for this account.
        unavailable_engine = (response.status_code == 404) or ('was not found' in response.text)
        if unavailable_engine:
            fallback_engines = [
                'stable-diffusion-xl-1024-v1-0',
                'stable-diffusion-512-v2-1',
            ]

            for eng in fallback_engines:
                if eng == STABILITY_IMAGE_ENGINE:
                    continue
                fallback_url = f'https://api.stability.ai/v1/generation/{eng}/text-to-image'
                candidate = requests.post(fallback_url, json=payload, headers=headers)
                if candidate.status_code == 200:
                    response = candidate
                    used_engine = eng
                    log(f"Primary engine '{STABILITY_IMAGE_ENGINE}' unavailable, used fallback '{eng}'")
                    break

        if response.status_code != 200:
            try:
                error_detail = response.json().get('message', response.text)
            except Exception:
                error_detail = response.text
            log(f'Stability AI error for user {user.id}: {error_detail}')
            return jsonify({
                'error': f'Image generation failed: {error_detail}'
            }), 500

        data_resp = response.json()
        if 'artifacts' not in data_resp or len(data_resp['artifacts']) == 0:
            raise ValueError('No image data returned from Stability AI')

        # Stability AI returns base64-encoded images
        image_base64 = data_resp['artifacts'][0].get('base64')
        if not image_base64:
            raise ValueError('Image artifact missing base64 data')

        # Convert to data URL for easy preview
        image_url = f"data:image/png;base64,{image_base64}"

        generation_time_ms = int((time.time() - start_time) * 1000)
        
        # Save to database
        generation = AIGeneration(
            user_id=user.id,
            prompt=prompt,
            type='image',
            url=image_url,
            status='completed',
            model_used=used_engine,
            generation_time_ms=generation_time_ms,
            generation_params=json.dumps({
                'size': size,
                'quality': quality
            })
        )
        
        db.session.add(generation)
        db.session.commit()
        
        log(f'Image generated successfully for user {user.id}. Time: {generation_time_ms}ms')
        
        return jsonify({
            'success': True,
            'generation': generation.to_dict(),
            'download_url': image_url
        }), 200

    except ValueError as e:
        log(f'Image generation validation error for user {user.id}: {str(e)}')
        return jsonify({'error': f'Image generation error: {str(e)}'}), 400

    except Exception as e:
        log(f'ERROR generating image for user {user.id}: {str(e)}')
        return jsonify({'error': f'Failed to generate image: {str(e)}'}), 500


@ai_bp.route('/generate-video', methods=['POST'])
@jwt_required()
def generate_video():
    """
    Generate AI video from text prompt using Replicate API
    
    Request JSON:
    {
        "prompt": "A robot dancing in space",
        "duration": 4  # Optional: 4-30 seconds
    }
    """
    try:
        user = get_current_user()
        data = request.get_json()
        
        if not data or not data.get('prompt'):
            return jsonify({'error': 'Prompt is required'}), 400
        
        prompt = data.get('prompt', '').strip()
        duration = data.get('duration', 4)
        
        # Validate inputs
        if len(prompt) > 500:
            return jsonify({'error': 'Prompt is too long (max 500 characters)'}), 400
        
        if len(prompt) < 10:
            return jsonify({'error': 'Prompt is too short (min 10 characters)'}), 400
        
        if not (4 <= duration <= 30):
            return jsonify({'error': 'Duration must be between 4 and 30 seconds'}), 400
        
        # Check if Replicate API token is configured
        if not REPLICATE_API_TOKEN:
            log(f'ERROR: Replicate API token not configured for user {user.id}')
            return jsonify({'error': 'Video generation not configured. Please contact support.'}), 500
        
        # Call Replicate API for text-to-video using SDK
        start_time = time.time()
        log(f'Generating video for user {user.id}: {prompt[:100]}...')

        # Try Replicate SDK with fallback model chain
        fallback_models = [
            REPLICATE_VIDEO_MODEL,
            'anotherjesse/zeroscope-v2',
            'damo-vilab/text-to-video-ms-1.7b'
        ]
        
        last_error = None
        used_model = None
        
        for model_to_try in fallback_models:
            try:
                client = replicate.Client(api_token=REPLICATE_API_TOKEN)
                input_payload = {'prompt': prompt}

                # Duration is optional and not supported by all models
                if duration and model_to_try != 'damo-vilab/text-to-video-ms-1.7b':
                    input_payload['duration'] = duration

                log(f'Attempting Replicate model: {model_to_try}')
                output = client.run(model_to_try, input=input_payload)

                video_url = output[0] if isinstance(output, list) and output else output
                if not video_url:
                    last_error = 'Model returned empty output'
                    continue

                generation_time_ms = int((time.time() - start_time) * 1000)
                generation = AIGeneration(
                    user_id=user.id,
                    prompt=prompt,
                    type='video',
                    url=str(video_url),
                    status='completed',
                    model_used=model_to_try,
                    generation_time_ms=generation_time_ms,
                    generation_params=json.dumps({'duration': duration, 'model': model_to_try})
                )
                db.session.add(generation)
                db.session.commit()
                used_model = model_to_try

                log(f'Video generated successfully with {model_to_try} for user {user.id}. Time: {generation_time_ms}ms')
                return jsonify({
                    'success': True,
                    'generation': generation.to_dict(),
                    'download_url': str(video_url)
                }), 200

            except Exception as e:
                last_error = str(e)
                log(f'Model {model_to_try} failed: {last_error}')
                # Continue to next model in chain
                continue
        
        # All models failed
        log(f'All video generation models failed for user {user.id}')
        if 'not found' in (last_error or '').lower() or '404' in (last_error or ''):
            return jsonify({
                'error': 'Video generation models not accessible with your Replicate token. Please check Replicate account and API token.',
                'debug': last_error
            }), 500
        elif 'unauthorized' in (last_error or '').lower():
            return jsonify({
                'error': 'Invalid Replicate API token. Check REPLICATE_API_TOKEN in .env',
                'debug': last_error
            }), 500
        else:
            return jsonify({
                'error': f'Video generation failed: {last_error}'
            }), 500

    except Exception as e:
        log(f'ERROR in generate_video for user {user.id}: {str(e)}')
        return jsonify({'error': f'Video generation service error: {str(e)}'}), 500


@ai_bp.route('/history', methods=['GET'])
@jwt_required()
def get_generation_history():
    """
    Get user's AI generation history
    
    Query params:
    - type: 'image' or 'video' (optional)
    - limit: Number of results (default: 20)
    - offset: Pagination offset (default: 0)
    """
    try:
        user = get_current_user()
        
        gen_type = request.args.get('type')  # image, video, or None for all
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        # Validate limit
        limit = min(limit, 100)  # Max 100 per request
        
        query = AIGeneration.query.filter_by(user_id=user.id)
        
        if gen_type in ['image', 'video']:
            query = query.filter_by(type=gen_type)
        
        # Get total count
        total = query.count()
        
        # Get paginated results
        generations = query.order_by(AIGeneration.created_at.desc()).offset(offset).limit(limit).all()
        
        return jsonify({
            'success': True,
            'total': total,
            'limit': limit,
            'offset': offset,
            'generations': [gen.to_dict() for gen in generations]
        }), 200
        
    except Exception as e:
        log(f'ERROR fetching generation history for user {user.id}: {str(e)}')
        return jsonify({'error': f'Failed to fetch history: {str(e)}'}), 500


@ai_bp.route('/<int:generation_id>', methods=['GET'])
@jwt_required()
def get_generation(generation_id):
    """Get details of a specific generation"""
    try:
        user = get_current_user()
        
        generation = AIGeneration.query.filter_by(
            id=generation_id,
            user_id=user.id
        ).first()
        
        if not generation:
            return jsonify({'error': 'Generation not found'}), 404
        
        return jsonify({
            'success': True,
            'generation': generation.to_dict()
        }), 200
        
    except Exception as e:
        log(f'ERROR fetching generation {generation_id} for user {user.id}: {str(e)}')
        return jsonify({'error': f'Failed to fetch generation: {str(e)}'}), 500


@ai_bp.route('/<int:generation_id>', methods=['DELETE'])
@jwt_required()
def delete_generation(generation_id):
    """Delete a generation record"""
    try:
        user = get_current_user()
        
        generation = AIGeneration.query.filter_by(
            id=generation_id,
            user_id=user.id
        ).first()
        
        if not generation:
            return jsonify({'error': 'Generation not found'}), 404
        
        db.session.delete(generation)
        db.session.commit()
        
        log(f'User {user.id} deleted generation {generation_id}')
        
        return jsonify({'success': True, 'message': 'Generation deleted'}), 200
        
    except Exception as e:
        log(f'ERROR deleting generation {generation_id} for user {user.id}: {str(e)}')
        return jsonify({'error': f'Failed to delete generation: {str(e)}'}), 500
