#!/usr/bin/env python3

import re
import sys
import time
import requests
from pathlib import Path
from typing import List, Tuple

class SimpleTranslator:
    def __init__(self):
        """
        initialize the simple translator
        """
        # using google translate api endpoint
        self.api_url = "https://translate.googleapis.com/translate_a/single"
        self.delay_between_requests = 1  # seconds to wait between api calls
    
    def extract_text_for_translation(self, content: str) -> List[Tuple[str, bool]]:
        """
        extract text content while preserving all tags
        
        args:
            content: input content (html or plain text)
            
        returns:
            list of (text, is_tag) tuples where is_tag=True for HTML tags
        """
        # split content into tags and text using regex
        parts = re.split(r'(<[^>]*>)', content)
        result = []
        
        for part in parts:
            if part.strip():  # skip empty parts
                is_tag = part.startswith('<') and part.endswith('>')
                result.append((part, is_tag))
        
        return result
    
    def translate_text_batch(self, text_batch: str) -> str:
        """
        translate a batch of text from russian to english using google translate api
        
        args:
            text_batch: text to translate
            
        returns:
            translated text
        """
        try:
            # parameters for google translate api
            params = {
                'client': 'gtx',
                'sl': 'ru',  # source language: russian
                'tl': 'en',  # target language: english
                'dt': 't',
                'q': text_batch
            }
            
            response = requests.get(self.api_url, params=params, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                translated_text = result[0][0][0] if result and result[0] and result[0][0] else text_batch
                return translated_text
            else:
                print(f"api request failed with status {response.status_code}")
                return text_batch  # fallback to original text
                
        except Exception as e:
            print(f"translation error: {e}")
            return text_batch  # fallback to original text
    
    def translate_file(self, input_file: str) -> str:
        """
        translate file content from russian to english while preserving all tags
        
        args:
            input_file: path to input file (.txt or .html)
            
        returns:
            path to output file with _en suffix
        """
        input_path = Path(input_file)
        
        if not input_path.exists():
            raise FileNotFoundError(f"input file not found: {input_file}")
        
        # support both .txt and .html files
        if input_path.suffix.lower() not in ['.txt', '.html']:
            raise ValueError("input file must be a .txt or .html file")
        
        # read input file
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"processing file: {input_file}")
        
        # extract text parts and tags
        parts = self.extract_text_for_translation(content)
        print(f"found {len(parts)} parts to process")
        
        translated_content = []
        text_parts_to_translate = []
        text_part_indices = []
        
        # separate tags from text content
        for i, (part, is_tag) in enumerate(parts):
            if is_tag:
                # keep tags as they are
                translated_content.append(part)
            else:
                # collect text content for translation
                text_parts_to_translate.append(part)
                text_part_indices.append(i)
                # placeholder for translated text
                translated_content.append("")
        
        # translate text parts in batches
        translated_text_parts = []
        for i, text_part in enumerate(text_parts_to_translate):
            print(f"translating part {i + 1}/{len(text_parts_to_translate)}...")
            translated = self.translate_text_batch(text_part)
            translated_text_parts.append(translated)
            
            # add delay between requests to avoid rate limiting
            if i < len(text_parts_to_translate) - 1:
                time.sleep(self.delay_between_requests)
        
        # insert translated text parts back into the content
        for i, translated_part in zip(text_part_indices, translated_text_parts):
            translated_content[i] = translated_part
        
        # join all parts
        final_content = "".join(translated_content)
        
        # create output filename with _en suffix
        output_filename = input_path.stem + '_en' + input_path.suffix
        output_path = input_path.parent / output_filename
        
        # write translated content to output file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(final_content)
        
        print(f"translation complete. output saved to: {output_path}")
        return str(output_path)

def main():
    """
    main function to run the translator
    """
    if len(sys.argv) != 2:
        print("usage: python3 translator.py <input_file.txt|input_file.html>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    # create translator instance
    translator = SimpleTranslator()
    
    try:
        output_file = translator.translate_file(input_file)
        print(f"successfully translated {input_file} to {output_file}")
    except Exception as e:
        print(f"error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()