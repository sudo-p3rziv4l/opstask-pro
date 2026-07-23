import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Function untuk konversi nomor seri Excel ke tanggal
function excelDateToJSDate(serial) {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  total_seconds -= seconds;
  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

function formatDate(date) {
    if (!date) return null;
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const user = jwt.verify(token, process.env.JWT_SECRET || "supersecret_opstask_pro_key_123");
    
    const { tasks } = await req.json();
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "No tasks provided" }, { status: 400 });
    }

    let inserted = 0;
    for (const task of tasks) {
      if (!task['Title'] || !task['Project Name']) continue;

      const title = task['Title'];
      const projectName = task['Project Name'];
      const description = task['Description'] || '';
      
      // KONVERSI TANGGAL EXCEL DISINI
      const startDateRaw = task['Start Date'];
      const dueDateRaw = task['Due Date'];
      
      const startDate = typeof startDateRaw === 'number' ? formatDate(excelDateToJSDate(startDateRaw)) : (startDateRaw || null);
      const dueDate = typeof dueDateRaw === 'number' ? formatDate(excelDateToJSDate(dueDateRaw)) : (dueDateRaw || null);

      const assignedTo = task['Assigned To'] || 'Unassigned';

      await query(
        `INSERT INTO tasks (title, description, status, assigned_to, project_name, start_date, due_date, source, requester_name) 
         VALUES ($1, $2, 'todo', $3, $4, $5, $6, 'internal', $7)`,
        [title, description, assignedTo, projectName, startDate, dueDate, user.username]
      );
      inserted++;
    }

    return NextResponse.json({ success: true, count: inserted });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
