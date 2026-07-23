import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

export async function POST() {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const res = await axios.get("https://task.ptdika.com/issues.json?limit=100&status_id=51", {
      headers: { "X-Redmine-API-Key": "b5408133ea672f817d64ef16f5c6667d6f6b36c3" },
      httpsAgent: agent
    });

    const issues = res.data.issues || [];
    let synced = 0;

    for (const issue of issues) {
      let status = 'todo'; 
      if (issue.status.name.toLowerCase().includes('in progress')) status = 'in_progress';
      if (issue.status.name.toLowerCase().includes('closed') || issue.status.name.toLowerCase().includes('resolved')) status = 'done';

      const defaultPriority = issue.priority?.name || 'Medium';
      const defaultDesc = issue.description || 'No description provided';
      const defaultStartDate = issue.start_date || new Date().toISOString().split('T')[0];
      const defaultDueDate = issue.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const projectName = issue.project?.name || 'Redmine Sync';

      await query(`
        INSERT INTO tasks (redmine_id, title, description, status, assigned_to, due_date, start_date, priority, source, project_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'redmine', $9)
        ON CONFLICT (redmine_id) DO UPDATE SET 
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          due_date = EXCLUDED.due_date,
          start_date = EXCLUDED.start_date,
          priority = EXCLUDED.priority,
          source = 'redmine',
          project_name = EXCLUDED.project_name
      `, [
        issue.id,
        issue.subject,
        defaultDesc,
        status,
        issue.assigned_to?.name || 'Unassigned',
        defaultDueDate,
        defaultStartDate,
        defaultPriority,
        projectName
      ]);
      synced++;
    }

    return NextResponse.json({ success: true, count: synced });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
