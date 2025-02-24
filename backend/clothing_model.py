from gradio_client import Client, handle_file
import os
import uuid
from PIL import Image
import io
import base64

class ClothingModel:
    def __init__(self):
        self.client = Client("levihsu/OOTDiffusion")
        
    def try_on_clothing(self, model_image_path, clothing_image_path, clothing_type):
        try:
            print(f"Starting try-on process...")
            print(f"Model image: {model_image_path}")
            print(f"Clothing image: {clothing_image_path}")
            print(f"Clothing type: {clothing_type}")
            
            category_map = {
                'upper': 'Upper-body',
                'lower': 'Lower-body'
            }
            
            try:
                # Use handle_file for both inputs
                model_file = handle_file(model_image_path)
                clothing_file = handle_file(clothing_image_path)
                
                print(f"Handled model file: {model_file}")
                print(f"Handled clothing file: {clothing_file}")
                
                result = self.client.predict(
                    model_file,          # vton_img
                    clothing_file,       # garm_img
                    category_map[clothing_type],  # category
                    1,      # n_samples
                    20,     # n_steps
                    2,      # image_scale
                    42,     # seed
                    api_name="/process_dc"
                )
                
                print("API Response:", result)
                
                if not isinstance(result, list) or len(result) == 0:
                    raise ValueError("Invalid response format from API")
                    
                if 'image' not in result[0]:
                    raise ValueError("Missing image path in API response")
                    
                return result[0]['image']
                
            except Exception as api_error:
                print(f"API call failed: {str(api_error)}")
                raise
            
        except Exception as e:
            print(f"Error in try_on_clothing: {str(e)}")
            raise 