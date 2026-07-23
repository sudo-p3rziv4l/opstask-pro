import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function POST(req) {
  try {
    const body = await req.json();
    const prompt = body.prompt || body.message;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

      const command = `/home/perzival/.local/bin/cloe chat -q ${JSON.stringify(prompt)} < /dev/null`;
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        HOME: '/home/perzival',
        PATH: process.env.PATH ? `${process.env.PATH}:/home/perzival/.local/bin` : '/usr/bin:/bin:/home/perzival/.local/bin',
      },
      timeout: 60000,
    });

    if (stderr && !stdout) {
      console.error("Cloe CLI stderr:", stderr);
    }

    const match = stdout.match(/╭─[^\n]+─╮\n([\s\S]+?)\n╰─[^\n]+─╯/);
    const text = match ? match[1].trim() : stdout;

    return NextResponse.json({ response: text || stderr.trim() });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to execute cloe" }, { status: 500 });
  }
}
