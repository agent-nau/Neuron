import os
import re

directory = r'c:\Users\megal\.antigravity\Neuron'
folders = ['commands', 'events']

ephemeral_re = re.compile(r'ephemeral:\s*true')
discord_import_re = re.compile(r'import\s*\{(.*?)\}\s*from\s*"discord\.js"')

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if not ephemeral_re.search(content):
        return
    
    print(f"Updating {filepath}")
    
    # 1. Replace ephemeral: true with flags: MessageFlags.Ephemeral
    new_content = ephemeral_re.sub('flags: MessageFlags.Ephemeral', content)
    
    # 2. Ensure MessageFlags is imported
    match = discord_import_re.search(new_content)
    if match:
        imports = match.group(1).split(',')
        imports = [i.strip() for i in imports]
        if 'MessageFlags' not in imports:
            imports.append('MessageFlags')
            new_import = f'import {{ {", ".join(imports)} }} from "discord.js"'
            new_content = new_content.replace(match.group(0), new_import)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

for folder in folders:
    folder_path = os.path.join(directory, folder)
    if not os.path.exists(folder_path):
        continue
    for filename in os.listdir(folder_path):
        if filename.endswith('.js'):
            update_file(os.path.join(folder_path, filename))

print("Done!")
