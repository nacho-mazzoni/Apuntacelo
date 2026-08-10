import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("request_id");

  try {
    const rows =
      requestId != null && requestId !== ""
        ? await db`select * from offers where request_id = ${Number(requestId)} order by created_at asc`
        : await db`select * from offers order by created_at asc`;
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { request_id, seller, ipfs_cid, encrypted_key, file_name, file_type } = body;

  if (!request_id || !seller || !ipfs_cid || !encrypted_key || !file_name || !file_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const rows = await db`
      insert into offers (request_id, seller, ipfs_cid, encrypted_key, file_name, file_type)
      values (${request_id}, ${seller}, ${ipfs_cid}, ${encrypted_key}, ${file_name}, ${file_type})
      returning *
    `;
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 },
    );
  }
}
