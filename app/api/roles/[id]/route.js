import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    const { id: roleId } = await params;
    const { name, permissions } = await req.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    // Check if role exists and prevent changing Super Admin name if id=1 (assuming 1 is Super Admin)
    const existingRole = await query('SELECT name FROM roles WHERE id = $1', [roleId]);
    if (existingRole.rows.length === 0) {
       return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    
    if (existingRole.rows[0].name === 'Super Admin' && name !== 'Super Admin') {
      return NextResponse.json({ error: "Cannot rename Super Admin role" }, { status: 403 });
    }

    // Update role name
    await query('UPDATE roles SET name = $1 WHERE id = $2', [name, roleId]);

    // Update permissions (delete old, insert new)
    await query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

    if (permissions && permissions.length > 0) {
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
    }

    return NextResponse.json({ success: true, message: "Role updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id: roleId } = await params;

    // Check if role exists and prevent deleting Super Admin
    const existingRole = await query('SELECT name FROM roles WHERE id = $1', [roleId]);
    if (existingRole.rows.length === 0) {
       return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    
    if (existingRole.rows[0].name === 'Super Admin') {
      return NextResponse.json({ error: "Cannot delete Super Admin role" }, { status: 403 });
    }

    // Delete role from DB (cascade should handle role_permissions)
    await query('DELETE FROM roles WHERE id = $1', [roleId]);

    return NextResponse.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
