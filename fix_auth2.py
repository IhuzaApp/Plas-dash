import os
import re

pattern = re.compile(
    r"(export\s+async\s+function\s+GET\s*\([^)]*\)\s*\{).*?(return\s+NextResponse\.json\(\s*\{\s*error:\s*(?:'|\")Unauthorized(?:'|\")\s*\}\s*,\s*\{\s*status:\s*401\s*\}\s*\);\s*\})",
    re.DOTALL
)

def replacer(match):
    signature_block = match.group(1)
    
    param_match = re.search(r"GET\s*\(\s*([a-zA-Z0-9_]+)\s*(?:[:,]\s*[a-zA-Z0-9_]+)?\s*\)", signature_block)
    param_name = param_match.group(1) if param_match else None
    
    if not param_name:
        signature_block = re.sub(r"GET\s*\(\s*\)", "GET(req: Request)", signature_block)
        param_name = "req"
        
    return signature_block + f"""
  const session = await getServerSession(authOptions);
  let userId = (session?.user as {{ id?: string }} | undefined)?.id;

  if (!userId) {{
    const authHeader = {param_name}.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {{
      userId = authHeader.substring(7);
    }}
  }}

  if (!userId) {{
    """ + match.group(2)

count = 0
for root, dirs, files in os.walk('src/app/api'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if "const authHeader =" in content:
                continue
                
            new_content = pattern.sub(replacer, content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f"Updated {path}")
print(f"Total updated: {count}")
