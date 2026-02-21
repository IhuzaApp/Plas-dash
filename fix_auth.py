import os
import re
# python3 fix_auth.py
pattern = re.compile(
    r"(export\s+async\s+function\s+GET\s*\([^)]*\)\s*\{\s*const\s+session\s*=\s*await\s+getServerSession\([^)]*\);\s*)(const)(\s+userId\s*=[^;]+;\s*)(if\s*\(!userId\)\s*\{\s*return\s+NextResponse\.json\(\{\s*error:\s*(?:'|\")Unauthorized(?:'|\")\s*\}\s*,\s*\{\s*status:\s*401\s*\}\);\s*\})",
    re.MULTILINE
)

def replacer(match):
    signature_block = match.group(1)
    
    # Try to extract param name
    param_match = re.search(r"GET\s*\(\s*([a-zA-Z0-9_]+)\s*(?:[:,]\s*[a-zA-Z0-9_]+)?\s*\)", signature_block)
    param_name = param_match.group(1) if param_match else None
    
    # If no param name, we need to inject `req: Request`
    if not param_name:
        signature_block = re.sub(r"GET\s*\(\s*\)", "GET(req: Request)", signature_block)
        param_name = "req"
    
    new_code = signature_block + "let" + match.group(3) + f"""
  if (!userId) {{
    const authHeader = {param_name}.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {{
      userId = authHeader.substring(7);
    }}
  }}

  """ + match.group(4)
    
    return new_code

count = 0
for root, dirs, files in os.walk('src/app/api'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = pattern.sub(replacer, content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f"Updated {path}")
print(f"Total updated: {count}")
