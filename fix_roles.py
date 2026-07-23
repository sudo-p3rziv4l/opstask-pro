import re

with open("/home/perzival/opstask-pro/app/api/roles/route.js", "r") as f:
    code = f.read()

# Ganti hardcoded permMap pake dinamic query
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
            [newRoleId, pId]
          );
        }
      }
    }"""

new_logic = """    if (permissions && permissions.length > 0) {
      for (const p of permissions) {
        // Cari ID permission asli dari DB
        const permResult = await query('SELECT id FROM permissions WHERE name = $1', [p]);
        if (permResult.rows.length > 0) {
          const pId = permResult.rows[0].id;
          await query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
            [newRoleId, pId]
          );
        }
      }
    }"""

code = code.replace(old_logic, new_logic)

with open("/home/perzival/opstask-pro/app/api/roles/route.js", "w") as f:
    f.write(code)
