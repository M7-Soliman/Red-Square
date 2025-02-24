from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from anthropic import Anthropic
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
from dotenv import load_dotenv
import uuid
import base64
from clothing_model import ClothingModel
import glob

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key')  # Add secret key for sessions
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:19006",  # Expo web default
            "http://localhost:19000",  # Expo alternative port
            "http://localhost:8081",   # Metro bundler
            "http://127.0.0.1:19006",
            "http://127.0.0.1:19000",
            "http://127.0.0.1:8081",
            "http://192.168.1.143:19006",  # Your local IP
            "http://192.168.1.143:19000",
            "http://192.168.1.143:8081",
            "exp://192.168.1.143:8081"     # Expo development
        ],
        "methods": ["GET", "POST", "OPTIONS", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Update the UPLOAD_FOLDER path to be relative to the backend directory
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize Anthropic client with API key from environment
anthropic = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# Initialize clothing model
clothing_model = ClothingModel()

def process_image(image):
    # Apply basic image enhancements
    image = image.convert('RGB')
    
    # Enhance color
    enhancer = ImageEnhance.Color(image)
    image = enhancer.enhance(1.2)
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.1)
    
    # Apply slight sharpening
    image = image.filter(ImageFilter.SHARPEN)
    
    return image

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Store chat sessions in memory (in production, use Redis or a database)
chat_sessions = {}

def get_latest_model_image():
    """Get the model image"""
    try:
        model_path = os.path.join(app.config['UPLOAD_FOLDER'], 'model.jpg')
        if not os.path.exists(model_path):
            return None
            
        # Read and encode the image
        with open(model_path, 'rb') as img_file:
            img_data = base64.b64encode(img_file.read()).decode('utf-8')
            return img_data
    except Exception as e:
        print(f"Error getting model image: {str(e)}")
        return None

@app.route('/chat', methods=['POST'])
def chat():
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        data = request.get_json()
        message = data.get('message')
        chat_history = data.get('history', [])
        session_id = data.get('session_id')

        if not message:
            return jsonify({'error': 'No message provided'}), 400

        # Create new session if none exists
        if not session_id or session_id not in chat_sessions:
            session_id = str(uuid.uuid4())
            chat_sessions[session_id] = []

        # Get or initialize chat history
        current_history = chat_sessions[session_id]
        
        # Get the latest model image
        model_image = get_latest_model_image()
        image_context = ""
        if model_image:
            image_context = f"\nI can see the current model image that has been uploaded. I'll take this into consideration when providing fashion advice."
        
        # Convert chat history to Anthropic message format
        messages = []
        
        # Add chat history
        for msg in chat_history:
            if msg['role'] != 'system':  # Skip any system messages in history
                messages.append({
                    "role": msg['role'],
                    "content": msg['content']
                })

        # Add current message with image context if available
        user_message = message
        if model_image:
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": model_image
                        }
                    },
                    {
                        "type": "text",
                        "text": user_message
                    }
                ]
            })
        else:
            messages.append({
                "role": "user",
                "content": user_message
            })

        try:
            response = anthropic.messages.create(
                model="claude-3-haiku-20240307",  # Using the latest model
                system="You are a friendly and knowledgeable fashion assistant. Your goal is to provide helpful fashion advice while maintaining context from the ongoing conversation. When you see an image, analyze the outfit and provide specific advice about it. Be concise but thorough in your responses." + image_context,
                max_tokens=1000,
                messages=messages
            )
            
            response_text = response.content[0].text
            
            # Update session history
            chat_sessions[session_id] = chat_history + [
                {"role": "user", "content": message},
                {"role": "assistant", "content": response_text}
            ]
            
            return jsonify({
                'response': response_text,
                'session_id': session_id
            })

        except Exception as api_error:
            print(f"API Error: {str(api_error)}")
            return jsonify({'error': 'Failed to get response from AI service'}), 500

    except Exception as e:
        print(f"Server Error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/chat/clear', methods=['POST'])
def clear_chat():
    try:
        data = request.get_json() if request.is_json else {}
        session_id = data.get('session_id')
        
        if session_id and session_id in chat_sessions:
            del chat_sessions[session_id]
        # Always return success even if session not found
        return jsonify({'message': 'Chat history cleared successfully'})
    except Exception as e:
        print(f"Error clearing chat: {str(e)}")
        # Return 200 even on error since clearing a non-existent session is fine
        return jsonify({'message': 'Chat history cleared successfully'})

@app.route('/try-on', methods=['POST'])
def try_on():
    try:
        # Debug logging
        print("Request files:", request.files)
        print("Request form:", request.form)
        
        if 'image' not in request.files:
            print("Missing 'image' in request files")
            return jsonify({'error': 'No clothing image provided'}), 400
            
        # Get clothing type from request
        clothing_type = request.form.get('type', 'upper')
        print(f"Clothing type received: {clothing_type}")
        
        if clothing_type not in ['upper', 'lower']:
            print(f"Invalid clothing type: {clothing_type}")
            return jsonify({'error': 'Invalid clothing type'}), 400
            
        # Get model image path
        model_path = os.path.join(app.config['UPLOAD_FOLDER'], 'model.jpg')
        if not os.path.exists(model_path):
            print(f"Model image not found at: {model_path}")
            return jsonify({'error': 'No model image found'}), 400
            
        clothing_file = request.files['image']
        if clothing_file.filename == '':
            print("Empty filename received")
            return jsonify({'error': 'No selected file'}), 400
            
        if clothing_file and allowed_file(clothing_file.filename):
            # Create temporary file for clothing image
            clothing_filename = f"temp_clothing_{uuid.uuid4()}.jpg"
            clothing_path = os.path.join(app.config['UPLOAD_FOLDER'], clothing_filename)
            print(f"Saving clothing image to: {clothing_path}")
            
            try:
                # Save clothing image
                clothing_file.save(clothing_path)
                print("Successfully saved clothing image")
                
                # Process try-on
                print("Starting try-on processing")
                result_path = clothing_model.try_on_clothing(
                    model_path,
                    clothing_path,
                    clothing_type
                )
                
                # Move result to uploads folder with unique name
                result_filename = f"result_{uuid.uuid4()}.jpg"
                final_path = os.path.join(app.config['UPLOAD_FOLDER'], result_filename)
                os.rename(result_path, final_path)
                print(f"Processed image saved to: {final_path}")
                
                # Clean up old processed images
                cleanup_processed_images()
                
                return jsonify({
                    'processedImageUrl': f"/uploads/{result_filename}"
                })
                
            finally:
                # Clean up temporary files
                if os.path.exists(clothing_path):
                    os.remove(clothing_path)
                    print(f"Cleaned up temporary file: {clothing_path}")
                    
        print(f"Invalid file type for: {clothing_file.filename}")
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        print(f"Error in try-on endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        # Check if the post request has the file part
        if 'file' not in request.files:
            print("No file part in request.files")
            print("Form data:", request.form)
            print("Files:", request.files)
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        
        # If user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if file and allowed_file(file.filename):
            # Always use model.jpg as the filename
            filename = 'model.jpg'
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # Remove existing file if it exists
            if os.path.exists(filepath):
                os.remove(filepath)
            
            # Process the image before saving
            try:
                with Image.open(file) as img:
                    processed_img = process_image(img)
                    processed_img.save(filepath, format='JPEG', quality=95)
                    
                    # Return URL with backend prefix
                    return jsonify({
                        'message': 'File uploaded and processed successfully',
                        'filename': filename,
                        'url': f'/backend/uploads/{filename}'
                    }), 200
            except Exception as e:
                print(f"Error processing image: {str(e)}")
                return jsonify({'error': f'Error processing image: {str(e)}'}), 500
        
        return jsonify({'error': 'File type not allowed'}), 400
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/uploads', methods=['GET'])
def list_uploads():
    try:
        files = []
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            if allowed_file(filename):
                files.append({
                    'filename': filename,
                    'url': f'backend/uploads/{filename}'
                })
        return jsonify(files), 200
    except Exception as e:
        print(f"Error listing uploads: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/uploads/<filename>', methods=['DELETE'])
def delete_file(filename):
    try:
        # Check if file exists in uploads folder
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(upload_path):
            os.remove(upload_path)
            return jsonify({'message': 'File deleted successfully'}), 200
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        print(f"Error deleting file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/get-model', methods=['GET'])
def get_model():
    """Get the base model image"""
    try:
        model_path = os.path.join(app.config['UPLOAD_FOLDER'], 'base_model.jpg')
        if not os.path.exists(model_path):
            return jsonify({'error': 'Model image not found'}), 404
            
        # Get the full URL for the model image
        model_url = request.host_url.rstrip('/') + '/uploads/base_model.jpg'
        return jsonify({'modelImageUrl': model_url})
    except Exception as e:
        print(f"Error getting model image: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

def load_default_wardrobe():
    garments_path = os.path.join(os.path.dirname(__file__), 'garments')
    wardrobe = []
    
    # Manual mapping of filenames to types
    garment_types = {
        'blueJeans.png': 'lower',
        'filaShirt.jpeg': 'upper',
        'whiteDressShirt.jpg': 'upper',
        'whiteTankTop.jpeg': 'upper'
    }
    
    if os.path.exists(garments_path):
        for filename, item_type in garment_types.items():
            file_path = os.path.join(garments_path, filename)
            if os.path.exists(file_path):
                # Copy file to uploads folder with unique name
                new_filename = f"{os.path.splitext(filename)[0]}_{uuid.uuid4()}{os.path.splitext(filename)[1]}"
                new_path = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
                
                with open(file_path, 'rb') as src, open(new_path, 'wb') as dst:
                    dst.write(src.read())
                
                wardrobe.append({
                    'filename': new_filename,
                    'type': item_type,
                    'url': f'/uploads/{new_filename}'
                })
    
    return wardrobe

@app.route('/default-wardrobe', methods=['GET'])
def get_default_wardrobe():
    try:
        wardrobe = load_default_wardrobe()
        return jsonify(wardrobe)
    except Exception as e:
        print(f"Error loading default wardrobe: {str(e)}")
        return jsonify({'error': str(e)}), 500

def cleanup_processed_images():
    """Clean up old processed images from uploads folder"""
    try:
        uploads_dir = app.config['UPLOAD_FOLDER']
        for filename in os.listdir(uploads_dir):
            # Skip model.jpg and base_model.jpg
            if filename in ['model.jpg', 'base_model.jpg']:
                continue
                
            file_path = os.path.join(uploads_dir, filename)
            # Remove result files and temporary clothing files
            if filename.startswith(('result_', 'temp_clothing_')):
                os.remove(file_path)
                print(f"Cleaned up: {filename}")
    except Exception as e:
        print(f"Error cleaning up processed images: {str(e)}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)