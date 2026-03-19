#!/usr/bin/env python3
"""
Test script to verify AI Clipper backend is working correctly
Run this after starting the Flask backend
"""

import requests
import json
import sys
from datetime import datetime

BACKEND_URL = "http://localhost:5000"

def test_backend_health():
    """Test if backend is running"""
    print("🔍 Testing Backend Health...")
    try:
        response = requests.get(f"{BACKEND_URL}/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend is running! Status: {data['status']}")
            return True
        else:
            print(f"❌ Backend returned status code {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Is it running on port 5000?")
        print("   Run: cd backend && python app.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_health_endpoint():
    """Test health API endpoint"""
    print("\n🔍 Testing Health Endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/health")
        if response.status_code == 200:
            print("✅ Health check passed!")
            return True
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_jobs_endpoint():
    """Test jobs listing endpoint"""
    print("\n🔍 Testing Jobs Endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/jobs")
        if response.status_code == 200:
            jobs = response.json()
            print(f"✅ Jobs endpoint working! Current jobs: {len(jobs)}")
            if jobs:
                for job_id, job_data in list(jobs.items())[:2]:
                    print(f"   - Job {job_id}: {job_data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ Jobs endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_logo_upload():
    """Test logo upload endpoint"""
    print("\n🔍 Testing Logo Upload Endpoint...")
    try:
        # Create a small test image (1x1 PNG)
        import tempfile
        import os
        
        # Create a minimal PNG file
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFE,
            0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE5,
            0x27, 0xDE, 0xFC, 0x00, 0x00, 0x00, 0x00, 0x49,  # IEND chunk
            0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('test_logo.png', png_data, 'image/png')}
        response = requests.post(f"{BACKEND_URL}/api/upload-logo", files=files)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Logo upload working! Saved as: {result['filename']}")
            return True
        else:
            print(f"❌ Logo upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_process_video():
    """Test video processing endpoint"""
    print("\n🔍 Testing Video Processing Endpoint...")
    try:
        data = {
            "youtube_url": "https://www.youtube.com/watch?v=test123"
        }
        response = requests.post(f"{BACKEND_URL}/api/process-video", json=data)
        
        if response.status_code in [200, 202]:
            result = response.json()
            print(f"✅ Video processing endpoint working!")
            print(f"   Job ID: {result.get('job_id')}")
            print(f"   Message: {result.get('message')}")
            return True
        else:
            print(f"❌ Video processing failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    print("=" * 60)
    print("🎬 AI Auto Clipper - Backend Test Suite")
    print("=" * 60)
    
    tests = [
        test_backend_health,
        test_health_endpoint,
        test_jobs_endpoint,
        test_logo_upload,
        test_process_video
    ]
    
    results = []
    for test_func in tests:
        try:
            results.append(test_func())
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"📊 Results: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("✅ All tests passed! Backend is ready to use.")
        print("\n🚀 Next steps:")
        print("1. Go to http://localhost:3000 in your browser")
        print("2. Paste a YouTube URL")
        print("3. Watch the magic happen!")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed. Check the output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
