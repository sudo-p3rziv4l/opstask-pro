import re

with open("/home/perzival/opstask-pro/app/api/roles/[id]/route.js", "r") as f:
    code = f.read()

# Fix params promise
code = code.replace("const roleId = params.id;", "const { id: roleId } = await params;")

old_logic = """    const permMap = {
      'task:create': 1,
      'board:edit': 2,
      'users:manage': 3,
      'reports:view': 4,
      'settings:access': null 
    };

    if (permissions && permissions.length > 0) {
      for (const p of permissions) {
        const pId = permMap[p];
        if (pId) {
          await query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
            [roleId, pId]
          );
        }
      }
    }"""

new_logic = """    if (permissions && permissions.length > 0) {
      for (const p of permissions) {
        const permResult = await query('SELECT id FROM permissions WHERE name = $1', [p]);
        if (permResult.rows.length > 0) {
          const pId = permResult.rows[0].id;
          await query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
            [roleId, pId]
          );
        }
      }
    }"""

code = code.replace(old_logic, new_logic)

with open("/home/perzival/opstask-pro/app/api/roles/[id]/route.js", "w") as f:
    f.write(code)
