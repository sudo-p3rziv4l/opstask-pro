import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all roles
    const rolesRes = await query('SELECT id, name FROM roles ORDER BY id ASC');
    
    // Get all role permissions mapped to role_id
    const permsRes = await query(`
      SELECT rp.role_id, p.name 
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
    `);

    // Group permissions by role
    const roles = (rolesRes.rows || []).map(role => {
      const rolePerms = permsRes.rows
        .filter(p => p.role_id === role.id)
        .map(p => p.name);
      
      return {
        id: role.id,
        name: role.name,
        permissions: rolePerms
      };
    });

    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, permissions } = await req.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    // Insert new role
    const roleResult = await query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id',
      [name, '']
    );
    const newRoleId = roleResult.rows[0].id;

    if (permissions && permissions.length > 0) {
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
    }

    return NextResponse.json({ success: true, message: "Role created successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
