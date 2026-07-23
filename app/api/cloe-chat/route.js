import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import { query } from "@/lib/db";
import ExcelJS from "exceljs";
import path from "path";
import fs2 from "fs";

const execAsync = util.promisify(exec);

export async function POST(req) {
  try {
    const body = await req.json();
    let prompt = body.prompt || body.message;
    
    // Jika body.messages adalah array (dari Frontend FloatingChat)
    if (!prompt && Array.isArray(body.messages) && body.messages.length > 0) {
      const lastMessage = body.messages[body.messages.length - 1];
      prompt = lastMessage.content;
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const lowerPrompt = prompt.toLowerCase();
    const isExportIntent = lowerPrompt.includes('export') || lowerPrompt.includes('laporan') || lowerPrompt.includes('excel') || lowerPrompt.includes('report');

    if (isExportIntent) {
      try {
        const result = await query(
          `SELECT title, project_name, status, assigned_to, requester_name, start_date, due_date, updated_at 
           FROM tasks ORDER BY updated_at DESC`
        );
        
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('OpsTask Report');
        
        sheet.columns = [
          { header: 'Task Name', key: 'title', width: 30 },
          { header: 'Project', key: 'project_name', width: 20 },
          { header: 'Status', key: 'status', width: 15 },
                    { header: 'Assignee', key: 'assigned_to', width: 20 },
          { header: 'Requester', key: 'requester_name', width: 20 },
          { header: 'Start Date', key: 'start_date', width: 15 },
          { header: 'Due Date', key: 'due_date', width: 15 },
          { header: 'Last Updated', key: 'updated_at', width: 20 },
        ];
        
        // Styling header
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // Tailwind sky-600
        
        result.rows.forEach(row => {
          sheet.addRow({
            title: row.title,
            project_name: row.project_name || '-',
            status: row.status,
                        assigned_to: row.assigned_to || 'Unassigned',
            requester_name: row.requester_name || '-',
            start_date: row.start_date ? new Date(row.start_date).toLocaleDateString() : '-',
            due_date: row.due_date ? new Date(row.due_date).toLocaleDateString() : '-',
            updated_at: row.updated_at ? new Date(row.updated_at).toLocaleString() : '-',
          });
        });
        
        const timestamp = new Date().getTime();
        const filename = `OpsTask_Report_${timestamp}.xlsx`;
        
        // Pastikan folder exports ada
        const exportDir = path.join(process.cwd(), 'public', 'exports');
        if (!fs2.existsSync(exportDir)){
            fs2.mkdirSync(exportDir, { recursive: true });
        }
        
        const filePath = path.join(exportDir, filename);
        await workbook.xlsx.writeFile(filePath);
        
        const fileUrl = `/exports/${filename}`;
        
        return NextResponse.json({ 
          response: `Tentu saja! Saya telah menyiapkan laporan yang Anda minta.\n\nSilakan unduh file Excel-nya di sini:\n[Download ${filename}](${fileUrl})`
        });
      } catch (err) {
        console.error("Export Error:", err);
        return NextResponse.json({ response: "Maaf, terjadi kesalahan saat mengekstrak laporan Excel: " + err.message });
      }
    }

        // Read Hermes config for API keys
    const configPath = '/home/perzival/.hermes/profiles/cloe/config.yaml';
    let apiKey = '';
    let baseUrl = 'http://10.0.3.81:20128/v1/chat/completions';
    
    try {
      const configStr = fs2.readFileSync(configPath, 'utf8');
      const keyMatch = configStr.match(/api_key:\s*(.+)/);
      if (keyMatch) apiKey = keyMatch[1].trim();
    } catch (e) {
      console.warn("Could not read cloe config, using fallback");
    }

    const messages = body.messages || [{ role: "user", content: prompt }];
    // Pastikan ada system prompt agar Cloe tahu identitasnya
    const systemPrompt = { 
      role: "system", 
      content: "You are Cloe AI, a helpful assistant integrated into OpsTask Pro. Answer concisely and professionally." 
    };

    if (messages[0]?.role !== "system") {
      messages.unshift(systemPrompt);
    }

    const aiRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "xmen",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      throw new Error(`AI API returned ${aiRes.status}: ${errorText}`);
    }

    const aiData = await aiRes.json();
    const text = aiData.choices[0].message.content;

    return NextResponse.json({ response: text });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to execute cloe" }, { status: 500 });
  }
}
