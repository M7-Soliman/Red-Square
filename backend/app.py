from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from anthropic import Anthropic
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:19006"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure upload and processed directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Initialize Anthropic client with API key from environment
anthropic = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

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

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message')
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400

        # Create message to Claude with fashion context
        response = anthropic.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": f"""You are a friendly and knowledgeable fashion assistant. 
                Please provide helpful fashion advice for the following question: {message}"""
            }]
        )

        return jsonify({'response': response.content[0].text})

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/try-on', methods=['POST'])
def try_on():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if file and allowed_file(file.filename):
            # Secure filename and create paths
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # Save and process image
            file.save(filepath)
            
            try:
                # Open and verify image
                with Image.open(filepath) as img:
                    processed_image = process_image(img)
                    
                    # Save processed image
                    processed_filename = f"processed_{filename}"
                    processed_filepath = os.path.join(app.config['PROCESSED_FOLDER'], processed_filename)
                    processed_image.save(processed_filepath, format='JPEG', quality=90)
                    
                    # Return full URL for the processed image
                    return jsonify({
                        'processedImageUrl': f"/processed/{processed_filename}"
                    })
            
            finally:
                # Clean up original upload
                if os.path.exists(filepath):
                    os.remove(filepath)
                    
    except Exception as e:
        print(f"Error in try-on endpoint: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Serve processed images
@app.route('/processed/<filename>')
def serve_processed_image(filename):
    return send_from_directory(app.config['PROCESSED_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)